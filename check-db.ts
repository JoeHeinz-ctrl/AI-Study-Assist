import { connect } from 'mongoose';
import Embedding from './src/models/Embedding';
import Note from './src/models/Note';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  await connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const noteCount = await Note.countDocuments();
  const embedCount = await Embedding.countDocuments();

  console.log(`Notes in DB: ${noteCount}`);
  console.log(`Embeddings in DB: ${embedCount}`);

  process.exit(0);
}
run();
