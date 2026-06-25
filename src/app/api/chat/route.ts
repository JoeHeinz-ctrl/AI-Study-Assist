import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import Embedding from '@/models/Embedding';
import { generateEmbedding } from '@/embeddings/gemini';
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
      const queryVector = await generateEmbedding(latestUserMessage);

      if (queryVector) {
        const pipeline = [
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: 50,
              limit: 5,
              filter: { userId: user._id }
            }
          }
        ];

        const searchResults = await Embedding.aggregate(pipeline);
        contextChunks = searchResults.map((res: any) => res.chunkText);
      }
    } catch (err) {
      // Vector search may fail if index doesn't exist yet — that's fine, we fall back to plain chat
      console.warn('RAG context retrieval skipped (index may not exist yet):', err);
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
