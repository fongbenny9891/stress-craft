import os from 'os';
import fs from 'fs';

interface CpuInfo {
  logicalCores: number;
  cpuLimit: number | 'unlimited';
}

interface MemoryInfo {
  totalMemBytes: number;
  memoryLimit: number | 'unlimited';
}

interface HostResources {
  cpu: CpuInfo;
  memory: MemoryInfo;
}

function getCpuInfo(): CpuInfo {
  const logicalCores = os.cpus().length;
  let cpuQuota: number | null = null;
  let cpuPeriod: number | null = null;

  try {
    cpuQuota = parseInt(
      fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8')
    );
    cpuPeriod = parseInt(
      fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8')
    );
  } catch (err) {}

  let cpuLimit: number | 'unlimited' = 'unlimited';
  if (cpuQuota && cpuQuota > 0 && cpuPeriod && cpuPeriod > 0) {
    cpuLimit = cpuQuota / cpuPeriod;
  }

  return { logicalCores, cpuLimit };
}

function getMemoryInfo(): MemoryInfo {
  const totalMemBytes = os.totalmem();
  let memoryLimit: number | 'unlimited' = 'unlimited';
  try {
    const memLimitBytes = parseInt(
      fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8')
    );
    if (!isNaN(memLimitBytes) && memLimitBytes > 0 && memLimitBytes < totalMemBytes) {
      memoryLimit = memLimitBytes;
    }
  } catch (err) {}

  return { totalMemBytes, memoryLimit };
}

export function getHostResources(): HostResources {
  return { cpu: getCpuInfo(), memory: getMemoryInfo() };
}
