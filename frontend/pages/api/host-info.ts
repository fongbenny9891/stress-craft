import type { NextApiRequest, NextApiResponse } from "next";
import { CONFIG, getBackendUrl, type BackendLanguage } from "lib/shared-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lang } = req.query;

  if (!lang || typeof lang !== "string") {
    return res.status(400).json({ error: "Language parameter is required" });
  }

  if (!(lang in CONFIG.backends)) {
    const supportedLangs = Object.keys(CONFIG.backends).join(", ");
    return res.status(400).json({
      error: `Unsupported language: ${lang}`,
      supportedLanguages: supportedLangs,
    });
  }

  try {
    const backendUrl = getBackendUrl(lang as BackendLanguage);
    const response = await fetch(`${backendUrl}/host-info`);

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch host info",
      details: (err as Error).message,
    });
  }
}
