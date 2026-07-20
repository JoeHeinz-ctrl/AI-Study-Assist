import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizQuestion {
  questionText: string;
  type: 'mcq' | 'true_false' | 'fill_blanks' | 'short_answer' | 'coding';
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IQuiz extends Document {
  studySessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: IQuizQuestion[];
  score?: number;
  totalQuestions: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'fill_blanks', 'short_answer', 'coding'], required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

const QuizSchema = new Schema<IQuiz>(
  {
    studySessionId: { type: Schema.Types.ObjectId, ref: 'StudySession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questions: [QuizQuestionSchema],
    score: { type: Number },
    totalQuestions: { type: Number, required: true },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
