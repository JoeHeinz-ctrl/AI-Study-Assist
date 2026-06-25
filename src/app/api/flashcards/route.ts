import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Note from '@/models/Note';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { generateChatResponse } from '@/ai/groq';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { noteId } = body;

    if (!noteId) return new NextResponse('noteId is required', { status: 400 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) return new NextResponse('Note not found', { status: 404 });

    if (!note.content || note.content.trim().length === 0) {
      return new NextResponse('Note has no content to generate flashcards from', { status: 400 });
    }

    const prompt = `Based on the following note content, generate 5-10 high-quality flashcards for studying.
Format your response as a JSON object with a single property 'flashcards' containing an array of objects.
Each object must have a 'front' (string, the question/term) and 'back' (string, the answer/definition) property.

Note Content:
"""
${note.content.substring(0, 4000)}
"""

Respond ONLY with valid JSON.`;

    // Re-use the shared Groq helper so the API key is validated in one place
    const responseText = await generateChatResponse(
      [{ role: 'user', content: prompt }],
      [] // No RAG context needed for flashcard generation
    );

    if (!responseText) throw new Error('No completion returned from Groq');

    const resultJSON = JSON.parse(responseText);
    return NextResponse.json(resultJSON);
  } catch (error) {
    console.error('[FLASHCARDS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
