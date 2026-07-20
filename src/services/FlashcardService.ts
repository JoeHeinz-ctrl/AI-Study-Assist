import { StudyGenerationService } from './StudyGenerationService';
import { RetrievalService } from './RetrievalService';
import Flashcard from '@/models/Flashcard';
import mongoose from 'mongoose';

export class FlashcardService {
  static async generateFlashcards(userId: string, sessionId: string, noteIds: string[], topic: string, count: number = 10) {
    const chunks = await RetrievalService.searchSelectedNotes(userId, noteIds, topic, 20);
    const contextTexts = chunks.map(c => c.chunkText);

    const prompt = `
    Generate ${count} flashcards about "${topic}".
    Output JSON format:
    {
      "flashcards": [
        {
          "front": "Question or prompt",
          "back": "Answer or explanation",
          "topic": "Specific subtopic",
          "difficulty": "easy|medium|hard" // Choose one
        }
      ]
    }
    `;

    const generated = await StudyGenerationService.generateFromContext(prompt, contextTexts);
    
    if (generated && generated.flashcards && Array.isArray(generated.flashcards)) {
      const cardsToInsert = generated.flashcards.map((fc: Record<string, unknown>) => ({
        ...fc,
        userId: new mongoose.Types.ObjectId(userId),
        studySessionId: new mongoose.Types.ObjectId(sessionId)
      }));
      return await Flashcard.insertMany(cardsToInsert);
    }
    throw new Error('Failed to parse flashcards');
  }
}
