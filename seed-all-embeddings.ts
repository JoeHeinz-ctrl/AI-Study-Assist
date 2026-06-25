import { connect } from 'mongoose';
import Embedding from './src/models/Embedding';
import Note from './src/models/Note';
import { generateEmbedding, chunkText } from './src/embeddings/gemini';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    await connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    const notes = await Note.find();
    console.log(`Found ${notes.length} notes.`);

    let generated = 0;
    for (const note of notes) {
      const existing = await Embedding.countDocuments({ noteId: note._id });
      if (existing === 0 && note.content) {
        console.log(`Generating embedding for note: ${note.title}`);
        const chunks = chunkText(note.content);
        for (const chunk of chunks) {
          const vector = await generateEmbedding(chunk);
          if (vector) {
            await Embedding.create({
              noteId: note._id,
              userId: note.userId,
              chunkText: chunk,
              embedding: vector
            });
            generated++;
          }
        }
      }
    }
    console.log(`Successfully generated ${generated} new embeddings.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
