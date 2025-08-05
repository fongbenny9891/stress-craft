// frontend/pages/api/host-info.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lang } = req.query;
  const port = lang === 'go' ? 3001 : 3000;

  try {
    const response = await fetch(`http://localhost:${port}/host-info`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch host info', details: (err as Error).message });
  }
}
