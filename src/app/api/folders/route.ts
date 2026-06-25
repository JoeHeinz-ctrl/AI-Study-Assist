import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Folder from '@/models/Folder';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const folders = await Folder.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json(folders);
  } catch (error) {
    console.error('[FOLDERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { name } = body;
    if (!name) return new NextResponse('Name is required', { status: 400 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const folder = await Folder.create({
      userId: user._id,
      name,
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('[FOLDERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
