import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudyMaterial extends Document {
  studySessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  explanation: string;
  simplifiedExplanation: string;
  importantConcepts: string[];
  keyPoints: string[];
  realWorldExample: string;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>(
  {
    studySessionId: { type: Schema.Types.ObjectId, ref: 'StudySession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    explanation: { type: String, required: true },
    simplifiedExplanation: { type: String, required: true },
    importantConcepts: [{ type: String }],
    keyPoints: [{ type: String }],
    realWorldExample: { type: String, required: true },
    summary: { type: String, required: true }
  },
  { timestamps: true }
);

const StudyMaterial: Model<IStudyMaterial> =
  mongoose.models.StudyMaterial || mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);

export default StudyMaterial;
