import mongoose, { Schema, Document as MongoDocument, Model } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  fileType: string; // 'pdf', 'docx', 'txt', 'md', 'pptx'
  fileSize: number;
  filePath: string;
  extractedText: string;
  summary?: string;
  tags?: string[];
  metadata?: {
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
    wordCount?: number;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  embeddings: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { 
      type: String, 
      required: true, 
      enum: ['pdf', 'docx', 'txt', 'md', 'pptx'] 
    },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    extractedText: { type: String, default: '' },
    summary: { type: String },
    tags: [{ type: String }],
    metadata: {
      author: { type: String },
      title: { type: String },
      subject: { type: String },
      creator: { type: String },
      producer: { type: String },
      creationDate: { type: Date },
      modificationDate: { type: Date },
      pageCount: { type: Number },
      wordCount: { type: Number },
    },
    processingStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'], 
      default: 'pending' 
    },
    processingError: { type: String },
    embeddings: [{ type: Schema.Types.ObjectId, ref: 'Embedding' }],
  },
  { timestamps: true }
);

// Index for search and filtering
DocumentSchema.index({ userId: 1, processingStatus: 1 });
DocumentSchema.index({ userId: 1, fileType: 1 });
DocumentSchema.index({ userId: 1, createdAt: -1 });

const Document: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default Document;