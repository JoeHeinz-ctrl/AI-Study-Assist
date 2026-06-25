import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmbedding extends Document {
  noteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  chunkText: string;
  embedding: number[];
  createdAt: Date;
}

const EmbeddingSchema = new Schema<IEmbedding>(
  {
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chunkText: { type: String, required: true },
    // Depending on the embedding provider, size will vary. Google Gemini is 768.
    embedding: { type: [Number], required: true },
  },
  { timestamps: { updatedAt: false } }
);

const Embedding: Model<IEmbedding> =
  mongoose.models.Embedding ||
  mongoose.model<IEmbedding>('Embedding', EmbeddingSchema);

export default Embedding;
