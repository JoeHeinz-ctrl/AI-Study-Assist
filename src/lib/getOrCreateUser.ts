import User from '@/models/User';
import connectToDatabase from '@/lib/mongoose';

/**
 * Gets or creates a MongoDB user document from a Clerk user ID.
 *
 * Uses findOneAndUpdate with upsert=true — this is atomic and safe from
 * duplicate key race conditions. Works even before the Clerk webhook fires.
 */
export async function getOrCreateUser(clerkUserId: string) {
  await connectToDatabase();

  const user = await User.findOneAndUpdate(
    { clerkUserId },
    { $setOnInsert: { clerkUserId } }, // Only set on first creation
    { upsert: true, new: true }
  );

  if (!user) {
    throw new Error(`Failed to get or create user for clerkUserId: ${clerkUserId}`);
  }

  return user;
}
