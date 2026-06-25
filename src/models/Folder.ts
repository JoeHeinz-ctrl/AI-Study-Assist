import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color?: string;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    color: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  },
  { timestamps: true }
);

const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
