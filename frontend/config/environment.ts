import {
  CONFIG,
  getSupportedLanguages,
  type BackendLanguage,
} from "lib/shared-config";

export const config = {
  backends: CONFIG.backends,
  routes: CONFIG.routes,
  test: CONFIG.test,

  // Helper functions for frontend
  getSupportedLanguages,
} as const;

export type { BackendLanguage };
