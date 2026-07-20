import { StudyGenerationService } from './StudyGenerationService';
import { RetrievalService } from './RetrievalService';
import RevisionSheet from '@/models/RevisionSheet';
import mongoose from 'mongoose';

export class RevisionSheetService {
  static async generateRevisionSheet(userId: string, sessionId: string, noteIds: string[], topic: string) {
    const chunks = await RetrievalService.searchSelectedNotes(userId, noteIds, topic, 30);
    const contextTexts = chunks.map(c => c.chunkText);

    const prompt = `
    Create a comprehensive one-page revision sheet for "${topic}" based on the provided notes.
    Extract the most important definitions, concepts, formulae, algorithms, bullet points, and exam tips.
    Output JSON format:
    {
      "title": "Revision Sheet Title",
      "topic": "${topic}",
      "definitions": [{"term": "Term1", "definition": "Def1"}],
      "importantConcepts": [{"concept": "Concept1", "explanation": "Exp1"}],
      "formulae": [{"name": "Form1", "formula": "E=mc^2", "context": "When to use"}],
      "algorithms": [{"name": "Algo1", "steps": ["Step 1", "Step 2"]}],
      "bulletPoints": ["Key point 1", "Key point 2"],
      "examTips": ["Tip 1", "Tip 2"]
    }
    `;

    const generated = await StudyGenerationService.generateFromContext(prompt, contextTexts);
    
    if (generated) {
      const sheetToInsert = {
        userId: new mongoose.Types.ObjectId(userId),
        studySessionId: new mongoose.Types.ObjectId(sessionId),
        title: (generated.title as string) || `${topic} Revision Sheet`,
        topic: (generated.topic as string) || topic,
        definitions: (generated.definitions as Record<string, unknown>[]) || [],
        importantConcepts: (generated.importantConcepts as Record<string, unknown>[]) || [],
        formulae: (generated.formulae as Record<string, unknown>[]) || [],
        algorithms: (generated.algorithms as Record<string, unknown>[]) || [],
        bulletPoints: (generated.bulletPoints as string[]) || [],
        examTips: (generated.examTips as string[]) || []
      };
      return await RevisionSheet.create(sheetToInsert);
    }
    throw new Error('Failed to parse revision sheet');
  }
}
