import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevisionSheet extends Document {
  studySessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  definitions: Array<{ term: string; definition: string }>;
  importantConcepts: Array<{ concept: string; explanation: string }>;
  formulae: Array<{ name: string; formula: string; context: string }>;
  algorithms: Array<{ name: string; steps: string[] }>;
  bulletPoints: string[];
  examTips: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RevisionSheetSchema = new Schema<IRevisionSheet>(
  {
    studySessionId: { type: Schema.Types.ObjectId, ref: 'StudySession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    definitions: [{ term: String, definition: String }],
    importantConcepts: [{ concept: String, explanation: String }],
    formulae: [{ name: String, formula: String, context: String }],
    algorithms: [{ name: String, steps: [String] }],
    bulletPoints: [{ type: String }],
    examTips: [{ type: String }]
  },
  { timestamps: true }
);

const RevisionSheet: Model<IRevisionSheet> =
  mongoose.models.RevisionSheet || mongoose.model<IRevisionSheet>('RevisionSheet', RevisionSheetSchema);

export default RevisionSheet;
