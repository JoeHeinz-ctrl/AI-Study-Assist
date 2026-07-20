import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrediction extends Document {
  studySessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  topic: string;
  probability: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  expectedMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
  answerHint?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    studySessionId: { type: Schema.Types.ObjectId, ref: 'StudySession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    topic: { type: String, required: true },
    probability: { type: String, enum: ['high', 'medium', 'low'], required: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    expectedMarks: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    reason: { type: String, required: true },
    answerHint: { type: String }
  },
  { timestamps: true }
);

const Prediction: Model<IPrediction> =
  mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);

export default Prediction;
