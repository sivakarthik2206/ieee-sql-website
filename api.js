import pkg from 'pg';
const { Client } = pkg;

function isSafe(sql) {
  if (!sql) return false;
  if (/;/.test(sql)) return false;
  if (!/^\s*select\b/i.test(sql)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { sql } = req.body || {};
  if (!isSafe(sql)) {
    return res.status(400).json({ error: 'Only single SELECT queries are allowed.' });
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL_RO, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const result = await client.query(sql);
    res.status(200).json({ rows: result.rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    await client.end();
  }
}
