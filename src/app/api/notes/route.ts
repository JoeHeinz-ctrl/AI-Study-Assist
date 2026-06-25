import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Note from '@/models/Note';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { processNoteContent } from '@/ai/groq';
import { generateEmbedding, chunkText } from '@/embeddings/gemini';
import Embedding from '@/models/Embedding';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const notes = await Note.find({ userId: user._id }).sort({ updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('[NOTES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { title, content, folderId } = body;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // STEP 1: Save the note immediately — this must always succeed
    const note = await Note.create({
      userId: user._id,
      title: title || 'Untitled Note',
      content: content || '',
      folderId: folderId || undefined,
    });

    // STEP 2: Optionally enrich with AI — failures here do NOT affect the response
    if (content) {
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
        console.error('AI processing skipped on POST:', err);
      }

      // STEP 3: Optionally generate embeddings — failures do NOT affect the response
      try {
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
        console.error('Embedding generation skipped on POST:', err);
      }
    }

    // Return the latest version of the note
    const updatedNote = await Note.findById(note._id);
    return NextResponse.json(updatedNote || note);
  } catch (error) {
    console.error('[NOTES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
