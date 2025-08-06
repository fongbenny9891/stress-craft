import { config } from '../config/environment';
import type {
  BackendLanguage,
  HostInfoResponse,
  WriteTestResponse,
} from "../types/api";

type WriteTestParams = {
  count: number;
  size: number;
};

export const backendApi = {
  async getHostInfo(lang: BackendLanguage): Promise<HostInfoResponse> {
    const timestamp = Date.now();
    const res = await fetch(`/api/${lang}/host-info?_t=${timestamp}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async runWriteTest(
    lang: BackendLanguage,
    params: WriteTestParams
  ): Promise<WriteTestResponse> {
    const timestamp = Date.now();
    const res = await fetch(
      `/api/${lang}/write-test?count=${params.count}&size=${params.size}&_t=${timestamp}`
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async getWriteStatus(lang: BackendLanguage): Promise<string> {
    const timestamp = Date.now();
    const res = await fetch(`/api/${lang}/write-status?_t=${timestamp}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  },
};