import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import Embedding from '@/models/Embedding';
import Note from '@/models/Note';
import { generateEmbedding } from '@/embeddings/gemini';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) return NextResponse.json([]);

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // --- VECTOR SEARCH PATH ---
    const queryVector = await generateEmbedding(query);

    if (queryVector) {
      try {
        const pipeline = [
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: queryVector as number[],
              numCandidates: 100,
              limit: 10,
              filter: { userId: user._id }
            }
          },
          {
            $project: {
              _id: 1,
              noteId: 1,
              chunkText: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ] as any[];

        const searchResults = await Embedding.aggregate(pipeline);

        if (searchResults.length > 0) {
          const noteIds = [...new Set(searchResults.map((res) => res.noteId))];
          const notes = await Note.find({ _id: { $in: noteIds }, userId: user._id });

          const finalResults = searchResults
            .map((res) => {
              const note = notes.find((n) => n._id.toString() === res.noteId.toString());
              return {
                ...note?.toObject(),
                snippet: res.chunkText,
                score: res.score
              };
            })
            .filter((r) => r._id); // filter orphaned embeddings

          // De-duplicate by note _id (keep highest-scored chunk per note)
          const seen = new Set<string>();
          const uniqueResults = finalResults.filter((item) => {
            const id = item._id?.toString();
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          return NextResponse.json(uniqueResults);
        }
      } catch (vectorErr) {
        // Vector search failed (e.g. index not created yet) — fall through to text search
        console.warn('[SEARCH] Vector search failed, falling back to text search:', vectorErr);
      }
    }

    // --- TEXT SEARCH FALLBACK ---
    // Used when: embeddings unavailable, vector index not set up, or vector search returns nothing
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    const textResults = await Note.find({
      userId: user._id,
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { tags: { $regex: regex } },
        { summary: { $regex: regex } }
      ]
    })
      .select('_id title content summary tags updatedAt')
      .limit(10)
      .lean();

    const formattedTextResults = textResults.map((note) => {
      const contentStr = note.content || '';
      const matchIndex = contentStr.toLowerCase().indexOf(query.toLowerCase());
      const snippet =
        matchIndex >= 0
          ? '...' +
            contentStr
              .substring(Math.max(0, matchIndex - 30), matchIndex + 120)
              .trim() +
            '...'
          : contentStr.substring(0, 150);
      return { ...note, snippet, score: 0 };
    });

    return NextResponse.json(formattedTextResults);
  } catch (error) {
    console.error('[SEARCH_GET]', error);
    return NextResponse.json([]);
  }
}
