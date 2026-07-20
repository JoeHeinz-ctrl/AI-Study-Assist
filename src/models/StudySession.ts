import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  studyType: 'flashcards' | 'mcq' | 'short_answer' | 'long_answer' | 'fill_blanks' | 'true_false' | 'matching' | 'definitions' | 'concepts' | 'summary' | 'revision_sheet' | 'interview' | 'viva' | 'study_material' | 'quiz' | 'predictions';
  studyMode: 'beginner' | 'intermediate' | 'advanced' | 'exam_revision' | 'competitive_exam' | 'interview_prep';
  sourceDocuments: Array<{
    type: 'note' | 'document';
    id: mongoose.Types.ObjectId;
    title: string;
  }>;
  generatedContent: Record<string, unknown>; // Flexible structure for different study materials
  progress: {
    totalItems: number;
    completedItems: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number; // in seconds
    lastPosition: number;
    completionPercentage: number;
  };
  settings: {
    showAnswersImmediately: boolean;
    shuffleQuestions: boolean;
    timeLimitPerQuestion?: number;
    numberOfQuestions?: number;
  };
  analytics: {
    weakConcepts: string[];
    strongConcepts: string[];
    averageScore: number;
    studyStreak: number;
    totalStudyTime: number;
  };
  status: 'active' | 'completed' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    studyType: { 
      type: String, 
      required: true,
      enum: ['flashcards', 'mcq', 'short_answer', 'long_answer', 'fill_blanks', 'true_false', 'matching', 'definitions', 'concepts', 'summary', 'revision_sheet', 'interview', 'viva', 'study_material', 'quiz', 'predictions']
    },
    studyMode: { 
      type: String, 
      required: true,
      enum: ['beginner', 'intermediate', 'advanced', 'exam_revision', 'competitive_exam', 'interview_prep']
    },
    sourceDocuments: [{
      type: { type: String, enum: ['note', 'document'], required: true },
      id: { type: Schema.Types.ObjectId, required: true },
      title: { type: String, required: true }
    }],
    generatedContent: { type: Schema.Types.Mixed },
    progress: {
      totalItems: { type: Number, default: 0 },
      completedItems: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      incorrectAnswers: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 },
      lastPosition: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 }
    },
    settings: {
      showAnswersImmediately: { type: Boolean, default: true },
      shuffleQuestions: { type: Boolean, default: false },
      timeLimitPerQuestion: { type: Number },
      numberOfQuestions: { type: Number }
    },
    analytics: {
      weakConcepts: [{ type: String }],
      strongConcepts: [{ type: String }],
      averageScore: { type: Number, default: 0 },
      studyStreak: { type: Number, default: 0 },
      totalStudyTime: { type: Number, default: 0 }
    },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'paused', 'archived'], 
      default: 'active' 
    }
  },
  { timestamps: true }
);

// Indexes for performance
StudySessionSchema.index({ userId: 1, status: 1 });
StudySessionSchema.index({ userId: 1, studyType: 1 });
StudySessionSchema.index({ userId: 1, createdAt: -1 });

if (mongoose.models.StudySession) {
  delete mongoose.models.StudySession;
}

const StudySession: Model<IStudySession> = mongoose.model<IStudySession>('StudySession', StudySessionSchema);

export default StudySession;