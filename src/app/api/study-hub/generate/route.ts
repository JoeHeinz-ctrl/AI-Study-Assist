import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { EmbeddingService } from '@/services/EmbeddingService';
import { FlashcardService } from '@/services/FlashcardService';
import { QuizService } from '@/services/QuizService';
import { PredictionService } from '@/services/PredictionService';
import { RevisionSheetService } from '@/services/RevisionSheetService';
import { StudyGenerationService } from '@/services/StudyGenerationService';
import StudySession from '@/models/StudySession';
import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteIds, topic, type } = body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: 'noteIds array is required' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    // Ensure embeddings exist
    await EmbeddingService.ensureEmbeddingsForNotes(user._id.toString(), noteIds);

    // Create a generic StudySession for this generation
    const studySession = await StudySession.create({
      userId: user._id,
      title: `${topic} - ${type}`,
      studyType: type,
      studyMode: 'beginner',
      sourceDocuments: noteIds.map((id: string) => ({ type: 'note', id: new mongoose.Types.ObjectId(id), title: 'Note' }))
    });

    const sessionId = studySession._id.toString();
    const userId = user._id.toString();
    
    let result;

    switch (type) {
      case 'study_material':
        result = await StudyGenerationService.generateStudyMaterial(userId, noteIds, topic);
        studySession.generatedContent = result;
        await studySession.save();
        break;
      case 'flashcards':
        result = await FlashcardService.generateFlashcards(userId, sessionId, noteIds, topic);
        break;
      case 'quiz':
        result = await QuizService.generateQuiz(userId, sessionId, noteIds, topic);
        break;
      case 'predictions':
        result = await PredictionService.generatePredictions(userId, sessionId, noteIds, topic);
        break;
      case 'revision_sheet':
        result = await RevisionSheetService.generateRevisionSheet(userId, sessionId, noteIds, topic);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, sessionId, result });

  } catch (error: any) {
    console.error('Study Hub Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
