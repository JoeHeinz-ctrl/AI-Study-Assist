import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true },
    email: { type: String }, // optional until Clerk webhook syncs real email
    firstName: { type: String },
    lastName: { type: String },
    profileImageUrl: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
