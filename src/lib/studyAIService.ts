import { generateChatResponse } from '@/ai/groq';

export type StudyType = 'flashcards' | 'mcq' | 'short_answer' | 'long_answer' | 'fill_blanks' | 'true_false' | 'matching' | 'definitions' | 'concepts' | 'summary' | 'revision_sheet' | 'interview' | 'viva';
export type StudyMode = 'beginner' | 'intermediate' | 'advanced' | 'exam_revision' | 'competitive_exam' | 'interview_prep';

export interface StudyMaterial {
  type: StudyType;
  content: Record<string, unknown>;
  metadata: {
    difficulty: StudyMode;
    estimatedTime: number;
    topicsCovered: string[];
  };
}

export class StudyAIService {
  
  static async generateStudyMaterial(
    content: string,
    studyType: StudyType,
    studyMode: StudyMode,
    options?: {
      count?: number;
      focusAreas?: string[];
      excludeTopics?: string[];
    }
  ): Promise<StudyMaterial> {
    const prompt = this.buildPrompt(content, studyType, studyMode, options);
    
    try {
      const response = await generateChatResponse([{ role: 'user', content: prompt }], []);
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      const parsedContent = JSON.parse(response);
      
      return {
        type: studyType,
        content: parsedContent,
        metadata: {
          difficulty: studyMode,
          estimatedTime: this.estimateStudyTime(studyType, parsedContent),
          topicsCovered: this.extractTopics(content)
        }
      };
    } catch (error) {
      console.error(`Error generating ${studyType}:`, error);
      throw new Error(`Failed to generate ${studyType}: ${error}`);
    }
  }

  static async generateSummary(content: string): Promise<string> {
    const prompt = `Create a concise, well-structured summary of the following content. 
    Focus on key concepts, main points, and important details. 
    Use clear headings and bullet points where appropriate.
    
    Content:
    """
    ${content.substring(0, 8000)}
    """`;

    try {
      const response = await generateChatResponse([{ role: 'user', content: prompt }], []);
      return response || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  static async generateTags(content: string): Promise<string[]> {
    const prompt = `Analyze the following content and generate 5-10 relevant tags or keywords that best describe the main topics and concepts.
    
    Return your response as a JSON array of strings.
    
    Content:
    """
    ${content.substring(0, 4000)}
    """`;

    try {
      const response = await generateChatResponse([{ role: 'user', content: prompt }], []);
      if (response) {
        const tags = JSON.parse(response);
        return Array.isArray(tags) ? tags : [];
      }
      return [];
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  private static buildPrompt(
    content: string,
    studyType: StudyType,
    studyMode: StudyMode,
    options?: {
      count?: number;
      focusAreas?: string[];
      excludeTopics?: string[];
    }
  ): string {
    const baseContent = content.substring(0, 8000); // Limit content size
    const count = options?.count || this.getDefaultCount(studyType);
    
    let prompt = `Based on the following content, generate ${count} high-quality ${studyType} suitable for ${studyMode} level study.\n\n`;
    
    // Add mode-specific instructions
    prompt += this.getModeInstructions(studyMode) + '\n\n';
    
    // Add type-specific instructions
    prompt += this.getTypeInstructions(studyType, count) + '\n\n';
    
    // Add focus areas if specified
    if (options?.focusAreas && options.focusAreas.length > 0) {
      prompt += `Focus particularly on these areas: ${options.focusAreas.join(', ')}.\n\n`;
    }
    
    // Add exclusions if specified
    if (options?.excludeTopics && options.excludeTopics.length > 0) {
      prompt += `Avoid covering these topics: ${options.excludeTopics.join(', ')}.\n\n`;
    }
    
    prompt += `Content:\n"""\n${baseContent}\n"""\n\nRespond ONLY with valid JSON.`;
    
    return prompt;
  }

  private static getModeInstructions(mode: StudyMode): string {
    switch (mode) {
      case 'beginner':
        return 'Create content that focuses on fundamental concepts, basic terminology, and foundational understanding. Use simple language and clear explanations.';
      case 'intermediate':
        return 'Create content that builds on basic knowledge, introduces more complex concepts, and requires analytical thinking.';
      case 'advanced':
        return 'Create content that requires deep understanding, critical analysis, synthesis of concepts, and advanced problem-solving skills.';
      case 'exam_revision':
        return 'Create content optimized for exam preparation, focusing on key facts, formulas, important dates, and commonly tested concepts.';
      case 'competitive_exam':
        return 'Create challenging content with tricky questions, edge cases, and concepts that test deep understanding and quick thinking.';
      case 'interview_prep':
        return 'Create content that covers commonly asked interview questions, practical applications, and real-world scenarios.';
      default:
        return 'Create balanced content appropriate for general study purposes.';
    }
  }

  private static getTypeInstructions(type: StudyType, count: number): string {
    switch (type) {
      case 'flashcards':
        return `Generate ${count} flashcards as JSON: {"flashcards": [{"front": "question", "back": "answer"}]}`;
        
      case 'mcq':
        return `Generate ${count} multiple choice questions as JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]}`;
        
      case 'short_answer':
        return `Generate ${count} short answer questions as JSON: {"questions": [{"question": "...", "expectedAnswer": "...", "keywords": ["key1", "key2"]}]}`;
        
      case 'long_answer':
        return `Generate ${count} long answer questions as JSON: {"questions": [{"question": "...", "outlinePoints": ["point1", "point2"], "sampleAnswer": "..."}]}`;
        
      case 'fill_blanks':
        return `Generate ${count} fill-in-the-blank questions as JSON: {"questions": [{"statement": "The ___ is important because ___", "blanks": ["answer1", "answer2"]}]}`;
        
      case 'true_false':
        return `Generate ${count} true/false questions as JSON: {"questions": [{"statement": "...", "answer": true, "explanation": "..."}]}`;
        
      case 'matching':
        return `Generate 1 matching exercise as JSON: {"exercise": {"items": [{"term": "...", "definition": "..."}], "instructions": "Match terms with definitions"}}`;
        
      case 'definitions':
        return `Generate key definitions as JSON: {"definitions": [{"term": "...", "definition": "...", "context": "..."}]}`;
        
      case 'concepts':
        return `Generate important concepts as JSON: {"concepts": [{"name": "...", "description": "...", "importance": "...", "examples": ["..."]}]}`;
        
      case 'summary':
        return `Generate a structured summary as JSON: {"summary": {"mainPoints": ["..."], "keyTakeaways": ["..."], "importantDetails": ["..."]}}`;
        
      case 'revision_sheet':
        return `Generate a one-page revision sheet as JSON: {"revisionSheet": {"title": "...", "sections": [{"heading": "...", "content": ["..."]}]}}`;
        
      case 'interview':
        return `Generate ${count} interview questions as JSON: {"questions": [{"question": "...", "type": "behavioral|technical|situational", "sampleAnswer": "...", "tips": ["..."]}]}`;
        
      case 'viva':
        return `Generate ${count} viva voce questions as JSON: {"questions": [{"question": "...", "expectedAnswer": "...", "followUpQuestions": ["..."]}]}`;
        
      default:
        return `Generate ${count} study items in appropriate JSON format.`;
    }
  }

  private static getDefaultCount(type: StudyType): number {
    switch (type) {
      case 'flashcards': return 15;
      case 'mcq': return 10;
      case 'short_answer': return 8;
      case 'long_answer': return 5;
      case 'fill_blanks': return 10;
      case 'true_false': return 12;
      case 'matching': return 1;
      case 'definitions': return 10;
      case 'concepts': return 8;
      case 'interview': return 8;
      case 'viva': return 10;
      default: return 10;
    }
  }

  private static estimateStudyTime(type: StudyType, content: Record<string, unknown>): number {
    // Estimate study time in minutes based on type and content
    const baseTime = {
      flashcards: 1,
      mcq: 2,
      short_answer: 3,
      long_answer: 10,
      fill_blanks: 2,
      true_false: 1,
      matching: 5,
      definitions: 2,
      concepts: 5,
      summary: 10,
      revision_sheet: 15,
      interview: 5,
      viva: 3
    };

    const itemCount = Array.isArray(content) ? content.length : Object.keys(content).length;
    return (baseTime[type] || 3) * itemCount;
  }

  private static extractTopics(content: string): string[] {
    // Simple topic extraction based on capitalized phrases and common patterns
    const topics: string[] = [];
    
    // Extract headings
    const headings = content.match(/^#{1,6}\s+(.+)$/gm);
    if (headings) {
      topics.push(...headings.map(h => h.replace(/^#+\s+/, '')));
    }
    
    // Extract capitalized phrases (potential topics)
    const capitalizedPhrases = content.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
    if (capitalizedPhrases) {
      topics.push(...capitalizedPhrases.filter(phrase => phrase.length > 3 && phrase.length < 50));
    }
    
    return [...new Set(topics)].slice(0, 10); // Return unique topics, max 10
  }
}