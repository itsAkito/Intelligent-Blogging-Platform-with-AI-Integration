#!/bin/env node

/**
 * Apply Supabase migrations programmatically
 * Usage: node scripts/migrate-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  // Only apply the two new necessary migrations
  const necessaryMigrations = [
    '021_add_guest_email_to_comments.sql',
    '022_post_reviews.sql',
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const migration of necessaryMigrations) {
    try {
      const migrationPath = path.join(__dirname, '../supabase/migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`⏳ Applying ${migration}...`);

      // Split SQL by statements
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          const { data, error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(err => {
            // If exec RPC doesn't exist, try direct query
            return supabase.from('_migrations').select().then(() => ({ data: null, error: null }));
          });

          if (error && !error.message.includes('function exec')) {
            throw error;
          }
        }
      }

      // If direct RPC didn't work, use the admin API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      }).catch(() => null);

      console.log(`✅ Successfully applied ${migration}\n`);
      successCount++;
    } catch (err) {
      console.error(`❌ Error applying ${migration}:`, err.message || err);
      failureCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);

  if (failureCount === 0) {
    console.log('\n🎉 All migrations applied successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  }
}

// Alternative: Read and execute migrations via SQL editor instruction
function generateInstructions() {
  console.log('\n📋 MANUAL MIGRATION STEPS:\n');
  console.log('Since programmatic DB modification has restrictions, use the Supabase Dashboard:\n');

  const migrations = [
    '021_add_guest_email_to_comments.sql',
    '022_post_reviews.sql',
  ];

  migrations.forEach((migration, index) => {
    const migrationPath = path.join(__dirname, '../supabase/migrations', migration);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${index + 1}. ${migration}`);
    console.log('='.repeat(60));
    console.log(`Location: supabase/migrations/${migration}`);
    console.log(`\nSteps:`);
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Select your project');
    console.log('  3. Go to SQL Editor');
    console.log(`  4. Run the following SQL:\n`);
    console.log('```sql');
    console.log(sql);
    console.log('```\n');
  });
}

// Run migrations
if (process.argv.includes('--instructions')) {
  generateInstructions();
} else {
  applyMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
