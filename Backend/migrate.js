/**
 * migrate.js — corre todas las migraciones en orden.
 * Uso: node migrate.js
 * Railway: configurarlo como "Pre-deploy command" en el servicio de Backend.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT ?? 5432),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const migrationsDir = path.join(__dirname, '..', 'database');

  // Crear tabla de control si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Obtener migraciones ya aplicadas
  const { rows } = await pool.query('SELECT name FROM _migrations');
  const applied = new Set(rows.map((r) => r.name));

  // Leer todos los archivos de migración en orden
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[SKIP] ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`[RUN]  ${file}`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`[OK]   ${file}`);
  }

  await pool.end();
  console.log('Migraciones completadas.');
}

run().catch((err) => {
  console.error('[MIGRATE ERROR]', err);
  process.exit(1);
});
