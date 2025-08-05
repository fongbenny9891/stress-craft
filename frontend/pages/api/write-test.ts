// frontend/pages/api/write-test.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lang, count, size } = req.query;
  const port = lang === 'go' ? 3001 : 3000;

  const url = `http://localhost:${port}/write-test?count=${count || 100}&size=${size || 100}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to run write test', details: (err as Error).message });
  }
}
