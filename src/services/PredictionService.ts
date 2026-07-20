import { StudyGenerationService } from './StudyGenerationService';
import { RetrievalService } from './RetrievalService';
import Prediction from '@/models/Prediction';
import mongoose from 'mongoose';

export class PredictionService {
  static async generatePredictions(userId: string, sessionId: string, noteIds: string[], topic: string) {
    const chunks = await RetrievalService.searchSelectedNotes(userId, noteIds, topic, 25);
    const contextTexts = chunks.map(c => c.chunkText);

    const prompt = `
    Predict 5 to 10 likely exam questions based on the provided context for "${topic}".
    Assign probability (high, medium, low) and confidenceScore (0-100).
    Output JSON format:
    {
      "predictions": [
        {
          "question": "The predicted exam question",
          "topic": "Specific topic",
          "probability": "high|medium|low",
          "confidenceScore": 85,
          "expectedMarks": 5,
          "difficulty": "easy|medium|hard",
          "reason": "Why this is a likely exam question",
          "answerHint": "Brief hint or outline of the answer"
        }
      ]
    }
    `;

    const generated = await StudyGenerationService.generateFromContext(prompt, contextTexts);
    
    if (generated && generated.predictions && Array.isArray(generated.predictions)) {
      const predictionsToInsert = generated.predictions.map((p: Record<string, unknown>) => ({
        ...p,
        userId: new mongoose.Types.ObjectId(userId),
        studySessionId: new mongoose.Types.ObjectId(sessionId)
      }));
      return await Prediction.insertMany(predictionsToInsert);
    }
    throw new Error('Failed to parse predictions');
  }
}
