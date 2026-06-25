import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Document from '@/models/Document';
import Note from '@/models/Note';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { UploadService } from '@/lib/uploadService';
import { TextExtractionService } from '@/lib/textExtractionService';
import { StudyAIService } from '@/lib/studyAIService';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Upload file
    const uploadResult = await UploadService.uploadFile(file);

    // Create document record
    const document = new Document({
      userId: user._id,
      folderId: folderId || undefined,
      filename: uploadResult.filename,
      originalName: uploadResult.originalName,
      fileType: uploadResult.type,
      fileSize: uploadResult.size,
      filePath: uploadResult.filepath,
      processingStatus: 'pending'
    });

    await document.save();

    // Start background processing
    processDocumentInBackground(document._id.toString());

    return NextResponse.json({
      documentId: document._id,
      filename: document.originalName,
      status: 'uploaded',
      message: 'File uploaded successfully. Processing will begin shortly.'
    });

  } catch (error) {
    console.error('[DOCUMENTS_UPLOAD_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Background processing function
async function processDocumentInBackground(documentId: string) {
  try {
    await connectToDatabase();
    const document = await Document.findById(documentId);
    
    if (!document) {
      console.error('Document not found for processing:', documentId);
      return;
    }

    // Update status to processing
    document.processingStatus = 'processing';
    await document.save();

    // Extract text
    const extractionResult = await TextExtractionService.extractText(
      document.filePath,
      document.fileType
    );

    // Clean and format text
    const cleanText = TextExtractionService.cleanAndFormatText(extractionResult.text);

    // Generate summary and tags
    const [summary, tags] = await Promise.all([
      StudyAIService.generateSummary(cleanText),
      StudyAIService.generateTags(cleanText)
    ]);

    // Update document with extracted content
    document.extractedText = cleanText;
    document.summary = summary;
    document.tags = tags;
    document.metadata = {
      ...document.metadata,
      ...extractionResult.metadata
    };
    document.processingStatus = 'completed';
    await document.save();

    // Create a Note from the document for integration with existing features
    const note = new Note({
      userId: document.userId,
      folderId: document.folderId,
      title: document.originalName.replace(/\.[^/.]+$/, ''), // Remove extension
      content: cleanText,
      summary: summary,
      tags: tags,
      category: 'uploaded_document'
    });
    await note.save();

    // TODO: Generate embeddings for semantic search
    // This would integrate with your existing embedding system

    console.log(`Document processed successfully: ${documentId}`);

  } catch (error) {
    console.error('Error processing document:', documentId, error);
    
    // Update document with error status
    try {
      await connectToDatabase();
      await Document.findByIdAndUpdate(documentId, {
        processingStatus: 'failed',
        processingError: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (updateError) {
      console.error('Error updating document status:', updateError);
    }
  }
}