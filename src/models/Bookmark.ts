import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  title: string;
  summary?: string;
  tags?: string[];
  category?: string;
  previewImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String },
    tags: [{ type: String }],
    category: { type: String },
    previewImageUrl: { type: String },
  },
  { timestamps: true }
);

const Bookmark: Model<IBookmark> =
  mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

export default Bookmark;
