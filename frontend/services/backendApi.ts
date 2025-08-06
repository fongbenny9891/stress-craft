import { type BackendLanguage } from '../types/api';

export const backendApi = {
  async getHostInfo(lang: BackendLanguage) {
    const res = await fetch(`/api/${lang}/host-info`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async runWriteTest(lang: BackendLanguage, params: { count: number; size: number }) {
    const res = await fetch(`/api/${lang}/write-test?count=${params.count}&size=${params.size}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async getWriteStatus(lang: BackendLanguage) {
    const res = await fetch(`/api/${lang}/write-status`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  }
};