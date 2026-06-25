import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Note from '@/models/Note';
import Document from '@/models/Document';
import StudySession from '@/models/StudySession';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { StudyAIService, StudyType, StudyMode } from '@/lib/studyAIService';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { 
      studyType, 
      studyMode, 
      sourceDocuments, 
      title,
      settings = {},
      options = {} 
    } = body;

    // Validate required fields
    if (!studyType || !studyMode || !sourceDocuments?.length) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Collect content from source documents
    let combinedContent = '';
    const processedSources = [];

    for (const source of sourceDocuments) {
      let document: any;
      let content = '';

      if (source.type === 'note') {
        document = await Note.findOne({ _id: source.id, userId: user._id });
        content = document?.content || '';
      } else if (source.type === 'document') {
        document = await Document.findOne({ _id: source.id, userId: user._id });
        content = document?.extractedText || '';
      }

      if (document && content.trim()) {
        combinedContent += `\n\n=== ${document.title || document.originalName} ===\n${content}`;
        processedSources.push({
          type: source.type,
          id: document._id,
          title: document.title || document.originalName
        });
      }
    }

    if (!combinedContent.trim()) {
      return new NextResponse('No content found in selected sources', { status: 400 });
    }

    // Generate study material using AI
    const studyMaterial = await StudyAIService.generateStudyMaterial(
      combinedContent,
      studyType as StudyType,
      studyMode as StudyMode,
      options
    );

    // Create study session
    const studySession = new StudySession({
      userId: user._id,
      title: title || `${studyType} - ${new Date().toLocaleDateString()}`,
      studyType,
      studyMode,
      sourceDocuments: processedSources,
      generatedContent: studyMaterial.content,
      progress: {
        totalItems: countItems(studyMaterial.content, studyType),
        completedItems: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeSpent: 0,
        lastPosition: 0,
        completionPercentage: 0
      },
      settings: {
        showAnswersImmediately: settings.showAnswersImmediately !== false,
        shuffleQuestions: settings.shuffleQuestions || false,
        timeLimitPerQuestion: settings.timeLimitPerQuestion,
        numberOfQuestions: settings.numberOfQuestions
      },
      analytics: {
        weakConcepts: [],
        strongConcepts: [],
        averageScore: 0,
        studyStreak: 0,
        totalStudyTime: 0
      },
      status: 'active'
    });

    await studySession.save();

    return NextResponse.json({
      sessionId: studySession._id,
      studyMaterial: studyMaterial.content,
      metadata: studyMaterial.metadata,
      message: 'Study material generated successfully'
    });

  } catch (error) {
    console.error('[STUDY_GENERATE_POST]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error', 
      { status: 500 }
    );
  }
}

function countItems(content: any, studyType: string): number {
  if (!content) return 0;
  
  switch (studyType) {
    case 'flashcards':
      return content.flashcards?.length || 0;
    case 'mcq':
    case 'short_answer':
    case 'long_answer':
    case 'fill_blanks':
    case 'true_false':
    case 'interview':
    case 'viva':
      return content.questions?.length || 0;
    case 'matching':
      return content.exercise?.items?.length || 0;
    case 'definitions':
      return content.definitions?.length || 0;
    case 'concepts':
      return content.concepts?.length || 0;
    default:
      return 1;
  }
}