import type { NextApiRequest, NextApiResponse } from 'next';
import { CONFIG, getBackendUrl, type BackendLanguage } from "lib/shared-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lang } = req.query;
  
  // Validate lang parameter
  if (!lang) {
    return res.status(400).json({ error: 'Language parameter is required' });
  }
  
  if (typeof lang !== 'string') {
    return res.status(400).json({ error: 'Language parameter must be a string' });
  }

  // Check if language is supported
  if (!(lang in CONFIG.backends)) {
    const supportedLangs = Object.keys(CONFIG.backends).join(', ');
    return res.status(400).json({ 
      error: `Unsupported language: ${lang}`, 
      supportedLanguages: supportedLangs
    });
  }

  try {
    const backendUrl = getBackendUrl(lang as BackendLanguage);
    console.log(`Fetching write status from: ${backendUrl}/write-status`);
    
    const response = await fetch(`${backendUrl}/write-status`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(text);
    
  } catch (err) {
    console.error(`Failed to fetch write status for ${lang}:`, err);
    
    if (err instanceof Error && err.name === 'AbortError') {
      return res.status(504).json({ error: 'Backend request timeout' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch status from backend', 
      language: lang,
      details: (err as Error).message 
    });
  }
}