import Groq from 'groq-sdk';
import { RetrievalService } from './RetrievalService';

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');
  return new Groq({ apiKey });
}

export class StudyGenerationService {
  /**
   * Generates structured JSON from the provided context using Groq.
   */
  static async generateFromContext(prompt: string, contextChunks: string[]): Promise<Record<string, unknown>> {
    if (!contextChunks || contextChunks.length === 0) {
      throw new Error("Not enough information found in your notes.");
    }

    const contextText = contextChunks.join('\n\n---\n\n');
    const systemPrompt = `You are an expert AI tutor. Generate educational materials strictly based on the provided context. If the context lacks sufficient information, output a JSON with a single key "error" and the value "Not enough information found in your notes." Do not hallucinate.`;

    const fullPrompt = `${prompt}\n\nContext:\n"""\n${contextText}\n"""\n\nRespond ONLY with valid JSON.`;

    try {
      const chatCompletion = await getGroq().chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const resultText = chatCompletion.choices[0]?.message?.content;
      if (!resultText) throw new Error('No response from AI');
      
      const parsed = JSON.parse(resultText);
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      return parsed;
    } catch (error) {
      console.error('StudyGenerationService Error:', error);
      throw error;
    }
  }

  static async generateStudyMaterial(userId: string, noteIds: string[], topic: string) {
    const chunks = await RetrievalService.searchSelectedNotes(userId, noteIds, topic, 15);
    const contextTexts = chunks.map(c => c.chunkText);

    const prompt = `
    Create comprehensive study notes about "${topic}".
    Output JSON format:
    {
      "title": "Topic title",
      "topic": "Main topic",
      "explanation": "Detailed explanation",
      "simplifiedExplanation": "ELI5 (Explain Like I'm 5) version",
      "importantConcepts": ["Concept 1", "Concept 2"],
      "keyPoints": ["Point 1", "Point 2"],
      "realWorldExample": "A practical example",
      "summary": "Brief summary of the entire topic"
    }
    `;

    return this.generateFromContext(prompt, contextTexts);
  }
}
