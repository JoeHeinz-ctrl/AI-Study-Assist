import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import StudySession from '@/models/StudySession';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const session = await StudySession
      .findOne({ _id: id, userId: user._id })
      .populate('sourceDocuments.id', 'title originalName')
      .lean();

    if (!session) {
      return new NextResponse('Study session not found', { status: 404 });
    }

    return NextResponse.json(session);

  } catch (error) {
    console.error('[STUDY_SESSION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { 
      progress, 
      analytics, 
      status,
      action // 'answer_correct', 'answer_incorrect', 'complete_item', 'update_time'
    } = body;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const session = await StudySession.findOne({ 
      _id: id, 
      userId: user._id 
    });

    if (!session) {
      return new NextResponse('Study session not found', { status: 404 });
    }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'answer_correct':
          session.progress.correctAnswers += 1;
          session.progress.completedItems += 1;
          break;
        case 'answer_incorrect':
          session.progress.incorrectAnswers += 1;
          session.progress.completedItems += 1;
          break;
        case 'complete_item':
          session.progress.completedItems += 1;
          break;
        case 'update_time':
          const timeSpent = body.timeSpent || 0;
          session.progress.timeSpent += timeSpent;
          session.analytics.totalStudyTime += timeSpent;
          break;
      }

      // Update completion percentage
      if (session.progress.totalItems > 0) {
        session.progress.completionPercentage = Math.round(
          (session.progress.completedItems / session.progress.totalItems) * 100
        );
      }

      // Update average score
      const totalAnswered = session.progress.correctAnswers + session.progress.incorrectAnswers;
      if (totalAnswered > 0) {
        session.analytics.averageScore = Math.round(
          (session.progress.correctAnswers / totalAnswered) * 100
        );
      }

      // Mark as completed if all items are done
      if (session.progress.completedItems >= session.progress.totalItems) {
        session.status = 'completed';
      }
    }

    // Apply direct updates if provided
    if (progress) {
      Object.assign(session.progress, progress);
    }
    
    if (analytics) {
      Object.assign(session.analytics, analytics);
    }
    
    if (status) {
      session.status = status;
    }

    await session.save();

    return NextResponse.json(session);

  } catch (error) {
    console.error('[STUDY_SESSION_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const session = await StudySession.findOneAndDelete({
      _id: id,
      userId: user._id
    });

    if (!session) {
      return new NextResponse('Study session not found', { status: 404 });
    }

    return NextResponse.json({ message: 'Study session deleted successfully' });

  } catch (error) {
    console.error('[STUDY_SESSION_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}