// Node.js version of host detection logic

const os = require('os');
const fs = require('fs');

function getCpuInfo() {
  const logicalCores = os.cpus().length;
  let cpuQuota = null;
  let cpuPeriod = null;

  try {
    cpuQuota = parseInt(
      fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8')
    );
    cpuPeriod = parseInt(
      fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8')
    );
  } catch (err) {
    // likely not running in cgroup v1 or not limited
  }

  let cpuLimit = 'unlimited';
  if (cpuQuota > 0 && cpuPeriod > 0) {
    cpuLimit = cpuQuota / cpuPeriod;
  }

  return {
    logicalCores,
    cpuLimit,
  };
}

function getMemoryInfo() {
  const totalMemBytes = os.totalmem();

  let memoryLimit = 'unlimited';
  try {
    const memLimitBytes = parseInt(
      fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8')
    );
    if (!isNaN(memLimitBytes) && memLimitBytes > 0 && memLimitBytes < totalMemBytes) {
      memoryLimit = memLimitBytes;
    }
  } catch (err) {
    // no limit found or cgroup v1 not available
  }

  return {
    totalMemBytes,
    memoryLimit,
  };
}

function getHostResources() {
  const cpu = getCpuInfo();
  const memory = getMemoryInfo();

  return {
    cpu,
    memory,
  };
}

console.log(JSON.stringify(getHostResources(), null, 2));
