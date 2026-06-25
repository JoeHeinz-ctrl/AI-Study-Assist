import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Document from '@/models/Document';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const fileType = searchParams.get('fileType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Build query
    const query: any = { userId: user._id };
    if (status) query.processingStatus = status;
    if (fileType) query.fileType = fileType;

    // Get documents with pagination
    const documents = await Document
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-filePath') // Don't expose file paths
      .lean();

    // Get total count for pagination
    const total = await Document.countDocuments(query);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[DOCUMENTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Find and delete document
    const document = await Document.findOneAndDelete({
      _id: documentId,
      userId: user._id
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // TODO: Delete file from filesystem
    // TODO: Delete related embeddings
    // TODO: Delete related note if it was created

    return NextResponse.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('[DOCUMENTS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}