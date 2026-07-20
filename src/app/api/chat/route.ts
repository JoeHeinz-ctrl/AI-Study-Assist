import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import Embedding from '@/models/Embedding';
import Note from '@/models/Note';
import { generateEmbedding } from '@/embeddings/gemini';
import { RetrievalService } from '@/services/RetrievalService';
import { generateChatResponse } from '@/ai/groq';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new NextResponse('Invalid messages', { status: 400 });
    }

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const latestUserMessage = messages[messages.length - 1].content;

    // Attempt RAG: generate embedding and find relevant chunks
    let contextChunks: string[] = [];
    try {
      const searchResults = await RetrievalService.searchAllUserNotes(user._id.toString(), latestUserMessage, 5);
      contextChunks = searchResults.map((res: any) => res.chunkText);
    } catch (err) {
      // Vector search may fail if index doesn't exist yet, or API is down
      console.warn('RAG vector retrieval skipped:', err);
    }

    // Always run text search to complement vector search (Hybrid Search)
    // This ensures that exact keyword matches (like missing embeddings) are always found!
    try {
      const escapedQuery = latestUserMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Extract meaningful keywords from the message to search for (very basic tokenization)
      const keywords = latestUserMessage.split(/\s+/).filter((w: string) => w.length > 2).slice(0, 3);
      const searchRegexes = keywords.map((kw: string) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      
      if (searchRegexes.length > 0) {
        const textResults = await Note.find({
          userId: user._id,
          $or: searchRegexes.map((regex: RegExp) => ({
            $or: [
              { title: { $regex: regex } },
              { content: { $regex: regex } }
            ]
          }))
        }).limit(3).lean();

        for (const note of textResults) {
          if (note.content) {
            const chunkString = `[Note Title: ${note.title}]\n${note.content.substring(0, 1500)}`;
            // Only add if not already in context chunks (prevent exact duplicates, though unlikely)
            if (!contextChunks.includes(chunkString)) {
              contextChunks.push(chunkString);
            }
          }
        }
      }
    } catch (fallbackErr) {
      console.error('Hybrid text search failed:', fallbackErr);
    }

    // Generate the AI response with or without context
    const responseText = await generateChatResponse(messages, contextChunks);

    return NextResponse.json({
      role: 'assistant',
      content: responseText,
    });
  } catch (error) {
    console.error('[CHAT_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
