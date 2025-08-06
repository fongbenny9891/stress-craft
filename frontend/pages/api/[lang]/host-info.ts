import type { NextApiRequest, NextApiResponse } from 'next';
import { getBackendUrl, type BackendLanguage, CONFIG } from "lib/shared-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lang } = req.query;
  
  if (!lang || typeof lang !== 'string') {
    return res.status(400).json({ error: 'Language parameter is required' });
  }

  if (!(lang in CONFIG.backends)) {
    return res.status(400).json({ error: `Unsupported language: ${lang}` });
  }

  try {
    const backendUrl = getBackendUrl(lang as BackendLanguage);
    const response = await fetch(`${backendUrl}/host-info`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch host info', 
      details: (err as Error).message 
    });
  }
}