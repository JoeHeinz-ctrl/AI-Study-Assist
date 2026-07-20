import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlashcard extends Document {
  studySessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'new' | 'learning' | 'review' | 'mastered';
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    studySessionId: { type: Schema.Types.ObjectId, ref: 'StudySession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    status: { type: String, enum: ['new', 'learning', 'review', 'mastered'], default: 'new' },
    nextReviewDate: { type: Date }
  },
  { timestamps: true }
);

const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);

export default Flashcard;
