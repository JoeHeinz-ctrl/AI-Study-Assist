import Groq from 'groq-sdk';

// Lazy initialization — avoids crashing the module when the key is missing
function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');
  return new Groq({ apiKey });
}

export async function processNoteContent(content: string) {
  if (!content || content.trim().length === 0) return null;

  try {
    const prompt = `
    Analyze the following note content and provide a JSON response with:
    - title: A concise, accurate title (string)
    - summary: A 1-2 sentence summary (string)
    - tags: An array of 3-5 relevant tags (array of strings)
    - category: A single broader category (string)
    
    Content:
    """
    ${content.substring(0, 3000)}
    """
    
    Respond ONLY with valid JSON.
    `;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const resultText = chatCompletion.choices[0]?.message?.content;
    if (!resultText) return null;

    return JSON.parse(resultText);
  } catch (error) {
    console.error('Error processing note with Groq:', error);
    return null;
  }
}

export async function generateChatResponse(messages: any[], contextChunks: string[] = []) {
  try {
    let systemMessage = {
      role: 'system',
      content: 'You are an intelligent AI Second Brain assistant. Help the user synthesize and recall information.'
    };

    if (contextChunks.length > 0) {
      systemMessage.content += `\n\nUse the following retrieved notes as context to answer the user's question:\n${contextChunks.join('\n\n---\n\n')}\n\nIf the answer is not contained in the context, do not hallucinate; tell the user you don't know based on their notes.`;
    }

    const response = await getGroq().chat.completions.create({
      messages: [systemMessage, ...messages],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      stream: false,
    });

    return response.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error chatting with Groq:', error);
    throw new Error('Failed to generate chat response');
  }
}
