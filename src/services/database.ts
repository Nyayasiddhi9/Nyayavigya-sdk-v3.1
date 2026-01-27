export async function initializeDatabase(): Promise<void> {
  console.log('🔌 Connecting to database...');
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set - using in-memory storage');
  }
}
