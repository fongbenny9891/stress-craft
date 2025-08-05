
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lang } = req.query;
  const port = lang === 'go' ? 3001 : 3000;

  try {
    const response = await fetch(`http://localhost:${port}/write-status`);
    const text = await response.text();

    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status from backend', details: (err as Error).message });
  }
}
