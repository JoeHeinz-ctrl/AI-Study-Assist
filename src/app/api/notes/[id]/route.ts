import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Note from '@/models/Note';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import Embedding from '@/models/Embedding';
import { processNoteContent } from '@/ai/groq';
import { generateEmbedding, chunkText } from '@/embeddings/gemini';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const note = await Note.findOne({ _id: id, userId: user._id });
    if (!note) return new NextResponse('Note not found', { status: 404 });

    return NextResponse.json(note);
  } catch (error) {
    console.error('[NOTE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, content } = body;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // STEP 1: Save the note update immediately — must always succeed
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: body },
      { new: true }
    );

    if (!note) return new NextResponse('Note not found', { status: 404 });

    // Respond immediately with the saved note
    const response = NextResponse.json(note);

    // STEP 2: AI enrichment — run after response is ready, errors are silent
    if (content) {
      (async () => {
        try {
          const aiResult = await processNoteContent(content);
          if (aiResult) {
            await Note.findByIdAndUpdate(note._id, {
              $set: {
                title: title || aiResult.title || note.title,
                summary: aiResult.summary,
                tags: aiResult.tags,
                category: aiResult.category,
              }
            });
          }
        } catch (err) {
          console.error('AI processing skipped on PATCH:', err);
        }

        // STEP 3: Update embeddings — silent fail
        try {
          await Embedding.deleteMany({ noteId: note._id });
          const chunks = chunkText(content);
          for (const chunk of chunks) {
            const vector = await generateEmbedding(chunk);
            if (vector) {
              await Embedding.create({
                noteId: note._id,
                userId: user._id,
                chunkText: chunk,
                embedding: vector
              });
            }
          }
        } catch (err) {
          console.error('Embedding generation skipped on PATCH:', err);
        }
      })();
    }

    return response;
  } catch (error) {
    console.error('[NOTE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const note = await Note.findOneAndDelete({ _id: id, userId: user._id });
    if (!note) return new NextResponse('Note not found', { status: 404 });

    // Clean up embeddings
    await Embedding.deleteMany({ noteId: id }).catch(() => {});

    return NextResponse.json(note);
  } catch (error) {
    console.error('[NOTE_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
