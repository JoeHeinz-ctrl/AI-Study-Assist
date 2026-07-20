import { StudyGenerationService } from './StudyGenerationService';
import { RetrievalService } from './RetrievalService';
import Quiz from '@/models/Quiz';
import mongoose from 'mongoose';

export class QuizService {
  static async generateQuiz(userId: string, sessionId: string, noteIds: string[], topic: string, count: number = 10, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    const chunks = await RetrievalService.searchSelectedNotes(userId, noteIds, topic, 20);
    const contextTexts = chunks.map(c => c.chunkText);

    const prompt = `
    Generate a quiz with ${count} questions about "${topic}" at a "${difficulty}" difficulty level.
    Mix question types if possible (mcq, true_false, fill_blanks, short_answer).
    Output JSON format:
    {
      "title": "Quiz Title",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "questions": [
        {
          "questionText": "The question",
          "type": "mcq|true_false|fill_blanks|short_answer",
          "options": ["A", "B", "C", "D"], // Only if type is mcq
          "correctAnswer": "The correct answer",
          "explanation": "Why this is correct",
          "difficulty": "easy|medium|hard"
        }
      ]
    }
    `;

    const generated = await StudyGenerationService.generateFromContext(prompt, contextTexts);
    
    if (generated && generated.questions) {
      const questionsArray = Array.isArray(generated.questions) ? generated.questions : [];
      const quizToInsert = {
        userId: new mongoose.Types.ObjectId(userId),
        studySessionId: new mongoose.Types.ObjectId(sessionId),
        title: generated.title as string || `${topic} Quiz`,
        topic: generated.topic as string || topic,
        difficulty: (generated.difficulty as string || difficulty) as 'easy' | 'medium' | 'hard',
        questions: questionsArray,
        totalQuestions: questionsArray.length
      };
      return await Quiz.create(quizToInsert);
    }
    throw new Error('Failed to parse quiz');
  }
}
