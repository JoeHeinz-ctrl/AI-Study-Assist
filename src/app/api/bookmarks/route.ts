import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongoose';
import Bookmark from '@/models/Bookmark';
import User from '@/models/User';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import * as cheerio from 'cheerio';
import { processNoteContent } from '@/ai/groq';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    const bookmarks = await Bookmark.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('[BOOKMARKS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { url } = body;
    
    if (!url) return new NextResponse('URL is required', { status: 400 });

    await connectToDatabase();
    const user = await getOrCreateUser(clerkUserId);

    // Fetch the URL to extract metadata
    let title = url;
    let description = '';
    let previewImageUrl = '';
    
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'MindVault-Bot/1.0' } });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      title = $('title').text() || $('meta[property="og:title"]').attr('content') || url;
      description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      previewImageUrl = $('meta[property="og:image"]').attr('content') || '';
    } catch (err) {
      console.error('Error fetching URL metadata:', err);
    }

    // Optionally process the description with Groq to categorize and tag it
    let tags: string[] = [];
    let category = 'Web Resource';
    
    if (description || title) {
      const aiResult = await processNoteContent(`Title: ${title}\nDescription: ${description}`);
      if (aiResult) {
        tags = aiResult.tags || [];
        category = aiResult.category || category;
        description = aiResult.summary || description;
      }
    }

    const bookmark = await Bookmark.create({
      userId: user._id,
      url,
      title,
      summary: description,
      tags,
      category,
      previewImageUrl
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('[BOOKMARKS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
