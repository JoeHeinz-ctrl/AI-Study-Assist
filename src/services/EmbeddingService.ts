import Embedding from '@/models/Embedding';
import Note from '@/models/Note';
import { generateEmbedding, generateEmbeddingsBatch, chunkText } from '@/embeddings/gemini';
import mongoose from 'mongoose';

export class EmbeddingService {
  /**
   * Ensures that the given notes have embeddings generated for them.
   */
  static async ensureEmbeddingsForNotes(userId: string, noteIds: string[]) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const noteObjectIds = noteIds.map(id => new mongoose.Types.ObjectId(id));

    // Fetch the notes
    const notes = await Note.find({
      _id: { $in: noteObjectIds },
      userId: userObjId
    });

    for (const note of notes) {
      // Check if embeddings exist for this note
      const existingCount = await Embedding.countDocuments({ noteId: note._id });
      
      if (existingCount === 0 && note.content) {
        // We need to generate embeddings
        // Strip markdown/html tags just in case, or keep them for context
        const plainText = note.content.replace(/<[^>]*>?/gm, '');
        const chunks = chunkText(plainText, 1000); // 1000 chars per chunk
        const validChunks = chunks.filter(c => c.trim().length > 0);
        if (validChunks.length === 0) continue;

        // Voyage AI free tier has a limit of 3 RPM.
        // We use batch generation to send all chunks of a note in a SINGLE request.
        const embeddingsMatrix = await generateEmbeddingsBatch(validChunks);
        
        if (embeddingsMatrix && embeddingsMatrix.length === validChunks.length) {
          const embeddingsToInsert = validChunks.map((chunk, index) => ({
            noteId: note._id,
            userId: userObjId,
            chunkText: chunk,
            embedding: embeddingsMatrix[index]
          }));
          
          await Embedding.insertMany(embeddingsToInsert);
        }
      }
    }
  }
}
