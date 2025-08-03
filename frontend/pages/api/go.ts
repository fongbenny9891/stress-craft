export default function handler(req, res) {
  res.status(200).json({
    cpu: { logicalCores: 4, cpuLimit: "unlimited" },
    memory: { totalMemBytes: 8589934592, memoryLimit: "unlimited" }
  });
}
