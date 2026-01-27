/**
 * Migration Runner
 * Executes pgvector migration against the database
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  
  try {
    console.log('🚀 Starting pgvector migration...');
    
    // Read the SQL migration file
    const migrationPath = join(__dirname, '001_create_pgvector_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // First, try to enable pgvector extension (may fail if not superuser, that's OK)
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (error: any) {
      if (error.message.includes('permission denied')) {
        console.log('⚠️  pgvector extension requires superuser. Assuming it\'s already enabled (Neon auto-enables it)');
      } else {
        throw error;
      }
    }
    
    // Execute the migration SQL
    // Split by -- ============================================================ to execute in chunks
    const statements = migrationSQL
      .split(/-- ={50,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('-- STEP 1: Enable pgvector')); // Skip pgvector enable step
    
    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('GRANT')) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.error(`Error executing statement: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - wai_memories table');
    console.log('  - wai_memory_vectors table');
    console.log('  - HNSW index for vector similarity search');
    console.log('  - PostgreSQL functions (cleanup_expired_memories, calculate_relevance, search_memories)');
    console.log('  - Triggers and indexes');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('wai_memories', 'wai_memory_vectors')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Verified tables:', result.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly (ES modules)
const isMain = import.meta.url.endsWith(process.argv[1]);

if (isMain) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Database is ready for WAI SDK Memory System!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };
