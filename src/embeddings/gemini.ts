/**
 * Embeddings using Voyage AI REST API.
 * Key is read from EMBEDDING_API_KEY environment variable.
 * Voyage AI keys start with "AQ."
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

function getApiKey(): string {
  const key = process.env.EMBEDDING_API_KEY;
  if (!key) throw new Error('EMBEDDING_API_KEY is not set in environment variables.');
  return key;
}

/**
 * Generates a vector embedding using Voyage AI.
 * Returns null instead of throwing so callers can degrade gracefully.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = getApiKey();

    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3-lite', // fast, cost-effective model
        input: [text],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Voyage AI error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('No embedding returned from Voyage AI');
    }

    return embedding as number[];
  } catch (error) {
    console.error('Embedding generation skipped:', error);
    return null; // Graceful fallback
  }
}

export function chunkText(text: string, chunkSize = 1000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
