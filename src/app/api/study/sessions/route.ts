import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import StudySession from '@/models/StudySession';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const studyType = searchParams.get('studyType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Build query
    const query: any = { userId: user._id };
    if (status) query.status = status;
    if (studyType) query.studyType = studyType;

    // Get sessions with pagination
    const sessions = await StudySession
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('sourceDocuments.id', 'title originalName')
      .lean();

    // Get total count for pagination
    const total = await StudySession.countDocuments(query);

    // Get summary statistics
    const stats = await StudySession.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalStudyTime: { $sum: '$analytics.totalStudyTime' }
        }
      }
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalStudyTime: stat.totalStudyTime
        };
        return acc;
      }, {} as any)
    });

  } catch (error) {
    console.error('[STUDY_SESSIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return new NextResponse('Session ID is required', { status: 400 });
    }

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Find and delete session
    const session = await StudySession.findOneAndDelete({
      _id: sessionId,
      userId: user._id
    });

    if (!session) {
      return new NextResponse('Study session not found', { status: 404 });
    }

    return NextResponse.json({ message: 'Study session deleted successfully' });

  } catch (error) {
    console.error('[STUDY_SESSIONS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}