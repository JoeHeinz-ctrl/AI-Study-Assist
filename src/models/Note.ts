import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  summary?: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  readingTime?: number;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
    title: { type: String, required: true, default: 'Untitled Note' },
    content: { type: String, default: '' },
    summary: { type: String },
    keywords: [{ type: String }],
    tags: [{ type: String }],
    category: { type: String },
    readingTime: { type: Number },
    isPinned: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
