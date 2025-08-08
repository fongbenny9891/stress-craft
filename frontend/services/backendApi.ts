import { type BackendLanguage } from '../types/api';

export const backendApi = {
  async getHostInfo(lang: BackendLanguage) {
    const res = await fetch(`/api/${lang}/host-info`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async runWriteTest(lang: BackendLanguage, params: { count: number; size: number }) {
    try {
      const res = await fetch(
        `/api/${lang}/write-test?count=${params.count}&size=${params.size}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `HTTP error! status: ${res.status}, message: ${errorText}`
        );
      }
      return res.json();
    } catch (error) {
      console.error(`Write test failed for ${lang} backend:`, error);
      throw error;
    }
  },

  async getWriteStatus(lang: BackendLanguage) {
    const res = await fetch(`/api/${lang}/write-status`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  }
};