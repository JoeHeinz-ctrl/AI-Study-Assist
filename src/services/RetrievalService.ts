import Embedding from '@/models/Embedding';
import { generateEmbedding } from '@/embeddings/gemini';
import mongoose from 'mongoose';

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RetrievalService {
  /**
   * Retrieves relevant note chunks for a given query and specific notes.
   */
  static async searchSelectedNotes(userId: string, noteIds: string[], query: string, limit: number = 10) {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }

    const noteObjectIds = noteIds.map(id => new mongoose.Types.ObjectId(id));
    
    const embeddings = await Embedding.find({
      userId: new mongoose.Types.ObjectId(userId),
      noteId: { $in: noteObjectIds }
    }).lean();

    if (embeddings.length === 0) return [];

    const results = embeddings.map(emb => ({
      ...emb,
      similarity: cosineSimilarity(queryEmbedding, emb.embedding)
    }));

    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  }
  
  /**
   * Gets all chunks for given notes.
   */
  static async getAllChunksForNotes(userId: string, noteIds: string[]) {
    const noteObjectIds = noteIds.map(id => new mongoose.Types.ObjectId(id));
    return Embedding.find({
      userId: new mongoose.Types.ObjectId(userId),
      noteId: { $in: noteObjectIds }
    }).lean();
  }
}
