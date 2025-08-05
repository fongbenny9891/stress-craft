export type HostInfoResponse = {
  cpu: { 
    logicalCores: number; 
    cpuLimit: number | "unlimited" 
  };
  memory: { 
    totalMemBytes: number; 
    memoryLimit: number | "unlimited" 
  };
};

export type WriteTestResponse = {
  filesWritten: number;
  fileSizeKB: number;
  totalSizeMB: number;
  durationMs: number;
};

export type DetectorLanguage = 'node' | 'go';