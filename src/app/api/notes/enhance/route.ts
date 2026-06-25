import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChatResponse } from '@/ai/groq';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert document layout designer and professional editor. Your goal is to transform the user's note content into a beautifully structured, highly readable, publication-quality markdown document. Follow these strict guidelines:

1. AUTO-STRUCTURE PLAIN TEXT:
   If the input is raw, unformatted text or a "wall of text" (no headings, large block paragraphs):
   - Add a single, clear H1 title at the top matching the document theme.
   - Split long paragraphs and add logical H2 and H3 headings.
   - Integrate rich visual aids where suitable: bullet/numbered lists, checkboxes for steps, callouts for highlights, quotes, dividers, and tables.

2. IMPROVE EXISTING FORMATTING GENTLY:
   If the input already has markdown formatting (headings, lists, bold text):
   - Do NOT rewrite or rephrase the content entirely. Preserve the author's voice, phrasing, and facts.
   - Focus on layout consistency: improve spacing between sections, fix heading hierarchy (H1 -> H2 -> H3), merge tiny fragmented paragraphs, split overly long blocks, and align list hierarchies.

3. PROFESSIONAL LAYOUT & HIERARCHY:
   - Use H1 (#) ONLY for the main title at the top of the document.
   - Use H2 (##) for major sections.
   - Use H3 (###) for sub-sections.
   - Employ visual breathing room: ensure empty lines separate sections, lists, quotes, and block elements.
   - Use horizontal dividers (---) to separate major sections.
   - Prefer callouts, tables, checklists, and code blocks over dense paragraphs to present structured info.

4. SMART TYPE DETECTION:
   Identify the document type from context and apply specialized formatting patterns:
   - "Tutorial / Guide" -> Use numbered steps, code blocks, and informative callouts.
   - "Meeting Notes" -> Use bold headers, bullet lists, dates, and an action-item checklist.
   - "Research Notes" -> Structure with summary sections, key findings, reference lists, and tables for data.
   - "Study Notes" -> Structure with headings, core definitions/terms in bold, bullet lists of key points, callouts for examples, and a review/Q&A checklist.
   - "Project Documentation" -> Formulate clear sections for Overview, Architecture, Implementation details, Code blocks, and Roadmap/Future Work.
   - "Personal Journal / Diary" -> Preserve the absolute natural flow of writing. Apply clean spacing between paragraphs, but do not impose heavy hierarchical sections, tables, or checklists.

5. PRESERVE MEANING & FACTS:
   - You must never invent facts, assume extra information, or remove code snippets/formulas.
   - Keep all technical specifications, code lines, figures, and assertions mathematically/factually identical.
   - Only correct grammar, spelling, punctuation, and structural layout.

6. OBSIDIAN-STYLE CALLOUT SUPPORT:
   - Convert highlighted notes or alerts into Obsidian-style blockquote callouts:
     > [!NOTE]
     > Content here
     Or use [!INFO], [!TODO], [!WARNING], [!ERROR], [!SUCCESS] depending on the context.

Output ONLY the raw markdown content without any conversational prefixes, suffixes, markdown wrapper code blocks (like \`\`\`markdown ... \`\`\`), or side comments.`
          },
          { role: 'user', content }
        ],
        temperature: 0.3
      })
    });

    if (!groqResponse.ok) {
      const errTxt = await groqResponse.text();
      console.error('Groq enhance error:', errTxt);
      throw new Error('Groq API error');
    }

    const groqData = await groqResponse.json();
    const enhancedContent = groqData.choices[0]?.message?.content;

    if (!enhancedContent) {
      throw new Error('Failed to generate enhanced content');
    }

    return NextResponse.json({ content: enhancedContent.trim() });
  } catch (error) {
    console.error('[ENHANCE_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
