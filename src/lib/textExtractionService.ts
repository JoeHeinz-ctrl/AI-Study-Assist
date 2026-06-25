import { readFile } from 'fs/promises';
import { join } from 'path';

export interface ExtractionResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
    wordCount?: number;
  };
}

export class TextExtractionService {
  static async extractText(filePath: string, fileType: string): Promise<ExtractionResult> {
    switch (fileType) {
      case 'txt':
        return this.extractFromTxt(filePath);
      case 'md':
        return this.extractFromMarkdown(filePath);
      case 'pdf':
        return this.extractFromPdf(filePath);
      case 'docx':
        return this.extractFromDocx(filePath);
      case 'pptx':
        return this.extractFromPptx(filePath);
      default:
        throw new Error(`Unsupported file type for text extraction: ${fileType}`);
    }
  }

  private static async extractFromTxt(filePath: string): Promise<ExtractionResult> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const wordCount = content.trim().split(/\s+/).length;
      
      return {
        text: content,
        metadata: {
          wordCount
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from TXT file: ${error}`);
    }
  }

  private static async extractFromMarkdown(filePath: string): Promise<ExtractionResult> {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : undefined;
      
      // Clean markdown formatting for word count
      const cleanText = content.replace(/[#*_`~\[\]()]/g, '').trim();
      const wordCount = cleanText.split(/\s+/).length;
      
      return {
        text: content,
        metadata: {
          title,
          wordCount
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from Markdown file: ${error}`);
    }
  }

  private static async extractFromPdf(filePath: string): Promise<ExtractionResult> {
    // For now, return a placeholder implementation
    // In a production app, you'd use a library like pdf2pic, pdf-parse, or call an external service
    try {
      // This is a simplified implementation
      // You would integrate with libraries like:
      // - pdf-parse
      // - pdf2pic
      // - Or external services like Google Document AI
      
      return {
        text: "PDF text extraction requires additional libraries. Please implement pdf-parse or similar.",
        metadata: {
          pageCount: 1,
          wordCount: 10
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF file: ${error}`);
    }
  }

  private static async extractFromDocx(filePath: string): Promise<ExtractionResult> {
    // For now, return a placeholder implementation
    // In a production app, you'd use mammoth or similar libraries
    try {
      // This is a simplified implementation
      // You would integrate with libraries like:
      // - mammoth
      // - docx
      // - Or external services
      
      return {
        text: "DOCX text extraction requires additional libraries. Please implement mammoth or similar.",
        metadata: {
          wordCount: 10
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX file: ${error}`);
    }
  }

  private static async extractFromPptx(filePath: string): Promise<ExtractionResult> {
    // For now, return a placeholder implementation
    // In a production app, you'd use a library or external service
    try {
      return {
        text: "PPTX text extraction requires additional libraries. Please implement a suitable solution.",
        metadata: {
          wordCount: 10
        }
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PPTX file: ${error}`);
    }
  }

  static cleanAndFormatText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/[ \t]+/g, ' '); // Normalize spaces
  }

  static extractHeadings(text: string): string[] {
    const headings: string[] = [];
    
    // Extract markdown headings
    const markdownHeadings = text.match(/^#{1,6}\s+(.+)$/gm);
    if (markdownHeadings) {
      headings.push(...markdownHeadings.map(h => h.replace(/^#+\s+/, '')));
    }
    
    // Extract lines that look like headings (all caps, short lines)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && trimmed.length < 100 && trimmed === trimmed.toUpperCase()) {
        headings.push(trimmed);
      }
    }
    
    return [...new Set(headings)]; // Remove duplicates
  }
}