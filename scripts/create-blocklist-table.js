// One-off: creates tms_token_blocklist. Safe to re-run (IF NOT EXISTS).
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Minimal .env parse (avoids adding a dep just for this script).
const env = {};
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'tms',
  });
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`tms_token_blocklist\` (
      \`Jti\` CHAR(36) NOT NULL,
      \`ExpiresAt\` DATETIME NOT NULL,
      \`CreateDatetime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`Jti\`),
      KEY \`IX_blocklist_expires\` (\`ExpiresAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('tms_token_blocklist ready');
  await conn.end();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
