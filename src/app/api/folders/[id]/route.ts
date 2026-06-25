import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Folder from '@/models/Folder';
import Note from '@/models/Note';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const { id: folderId } = await params;
    if (!folderId) return new NextResponse('Folder ID is required', { status: 400 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Fetch the folder
    const folder = await Folder.findOne({ _id: folderId, userId: user._id });
    if (!folder) return new NextResponse('Folder not found', { status: 404 });

    // Fetch the notes in this folder
    const notes = await Note.find({ folderId: folder._id, userId: user._id }).sort({ updatedAt: -1 });

    return NextResponse.json({ folder, notes });
  } catch (error) {
    console.error('[FOLDER_GET_BY_ID]', error);
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

    const { id: folderId } = await params;
    if (!folderId) return new NextResponse('Folder ID is required', { status: 400 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: folderId, userId: user._id });
    if (!folder) return new NextResponse('Folder not found', { status: 404 });

    // Clear folderId on all notes belonging to this folder (orphan notes, don't delete them)
    await Note.updateMany(
      { folderId: folder._id, userId: user._id },
      { $unset: { folderId: '' } }
    );

    // Delete the folder
    await Folder.deleteOne({ _id: folder._id });

    return NextResponse.json({ success: true, message: 'Folder deleted and notes uncategorized.' });
  } catch (error) {
    console.error('[FOLDER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
