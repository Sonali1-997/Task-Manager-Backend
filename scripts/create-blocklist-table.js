// One-off: creates tms_token_blocklist. Safe to re-run (existence-checked).
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

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
  const pool = await sql.connect({
    server: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 1433),
    user: env.DB_USERNAME || 'sa',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'tms',
    options: {
      encrypt: (env.DB_ENCRYPT || 'true') === 'true',
      trustServerCertificate: (env.DB_TRUST_SERVER_CERT || 'true') === 'true',
    },
  });
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.tms_token_blocklist', N'U') IS NULL
    CREATE TABLE dbo.tms_token_blocklist (
      Jti            CHAR(36) NOT NULL,
      ExpiresAt      DATETIME NOT NULL,
      CreateDatetime DATETIME NOT NULL CONSTRAINT DF_blocklist_created DEFAULT (CURRENT_TIMESTAMP),
      CONSTRAINT PK_tms_token_blocklist PRIMARY KEY (Jti)
    );

    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes
      WHERE name = N'IX_blocklist_expires'
        AND object_id = OBJECT_ID(N'dbo.tms_token_blocklist')
    )
      CREATE INDEX IX_blocklist_expires ON dbo.tms_token_blocklist (ExpiresAt);
  `);
  console.log('tms_token_blocklist ready');
  await pool.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
