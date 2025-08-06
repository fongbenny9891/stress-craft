import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check if NODE_ENV is set to one of the allowed values, otherwise default to "development"
const NODE_ENV = ["development", "uat", "production"].includes(
  process.env.NODE_ENV ?? ""
)
  ? process.env.NODE_ENV
  : "development";

export type BackendLanguage = "node" | "go" | "rust" | "python" | "csharp";

export const CONFIG = {
  env: NODE_ENV,

  // Host configuration
  host:
    typeof window !== "undefined"
      ? window.location.hostname
      : process.env.HOST || "localhost",

  // Backend services mapping
  backends: {
    node: {
      name: "Node.js",
      port: Number(process.env.NODE_BACKEND_PORT) || 3000,
      color: "#68a063",
      defaultTestConfig: {
        count: 100,
        size: 100,
      },
    },
    go: {
      name: "Go",
      port: Number(process.env.GO_BACKEND_PORT) || 3001,
      color: "#00add8",
      defaultTestConfig: {
        count: 100,
        size: 100,
      },
    },
    rust: {
      name: "Rust",
      port: Number(process.env.RUST_BACKEND_PORT) || 3002,
      color: "#ce422b",
      defaultTestConfig: {
        count: 100,
        size: 100,
      },
    },
    python: {
      name: "Python",
      port: Number(process.env.PYTHON_BACKEND_PORT) || 3003,
      color: "#3776ab",
      defaultTestConfig: {
        count: 100,
        size: 100,
      },
    },
    csharp: {
      name: "C#",
      port: Number(process.env.CSHARP_BACKEND_PORT) || 3004,
      color: "#512bd4",
      defaultTestConfig: {
        count: 100,
        size: 100,
      },
    },
  } as const,

  // Frontend configuration
  frontend: {
    port: Number(process.env.FRONTEND_PORT) || 3010,
    url:
      process.env.FRONTEND_URL ||
      `http://localhost:${Number(process.env.FRONTEND_PORT) || 3010}`,
  },

  // API routes
  routes: {
    hostInfo: "/host-info",
    writeTest: "/write-test",
    writeStatus: "/write-status",
    readTest: "/read-test",
    deleteTest: "/delete-test",
  },

  // Test configuration
  test: {
    maxFileCount: 100000,
    maxFileSizeKB: 1024000,
    logUpdateIntervalMs: 2000,
    progressLogInterval: 1000, // Log every 1000 files
  },

  // Docker configuration
  docker: {
    network: process.env.DOCKER_NETWORK || "stress-craft-network",
    volumes: {
      logs: "/tmp/stress-logs",
      data: "/tmp/stress-data",
    },
  },
} as const;

// Helper functions
export const getBackendUrl = (language: BackendLanguage): string => {
  const backend = CONFIG.backends[language];
  if (!backend) {
    throw new Error(`Unknown backend language: ${language}`);
  }
  return `http://${CONFIG.host}:${backend.port}`;
};

export const getBackendPort = (language: BackendLanguage): number => {
  const backend = CONFIG.backends[language];
  if (!backend) {
    throw new Error(`Unknown backend language: ${language}`);
  }
  return backend.port;
};

export const getSupportedLanguages = (): BackendLanguage[] => {
  return Object.keys(CONFIG.backends) as BackendLanguage[];
};
