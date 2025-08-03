export default function handler(req, res) {
  res.status(200).json({
    cpu: { logicalCores: 8, cpuLimit: 4 },
    memory: { totalMemBytes: 16777216000, memoryLimit: 8589934592 }
  });
}
