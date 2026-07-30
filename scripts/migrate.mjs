import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import pg from 'pg';

const { Client } = pg;

const SUPABASE_URL = 'https://sfggjjfoyeinobtbwpii.supabase.co';
const DB_PASS = 'MF9f!uyTZM.3VJe';

async function run() {
  // Try pg direct connection first
  const client = new Client({
    host: 'db.sfggjjfoyeinobtbwpii.supabase.co',
    port: 5432,
    user: 'postgres',
    password: DB_PASS,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected via pg!');
  } catch (e) {
    console.error('pg connection failed:', e.message);
    console.log('Trying Supabase Management API approach...');
    return;
  }

  // Run migration
  const sql = readFileSync(
    new URL('./migrate-schema.sql', import.meta.url),
    'utf8'
  );

  try {
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (e) {
    console.error('Migration error:', e.message);
  }

  await client.end();
}

run().catch(console.error);
