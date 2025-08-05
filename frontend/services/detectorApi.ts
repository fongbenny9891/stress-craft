import { config } from '../config/environment';
import type { DetectorLanguage, HostInfoResponse, WriteTestResponse } from '../types/api';

type WriteTestParams = {
  count: number;
  size: number;
};

export const detectorApi = {
  async getHostInfo(lang: DetectorLanguage): Promise<HostInfoResponse> {
    const timestamp = Date.now();
    const res = await fetch(`/api/${lang}/host-info?_t=${timestamp}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async runWriteTest(lang: DetectorLanguage, params: WriteTestParams): Promise<WriteTestResponse> {
    const timestamp = Date.now();
    const res = await fetch(
      `/api/${lang}/write-test?count=${params.count}&size=${params.size}&_t=${timestamp}`
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async getWriteStatus(lang: DetectorLanguage): Promise<string> {
    const timestamp = Date.now();
    const res = await fetch(`/api/${lang}/write-status?_t=${timestamp}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  }
};