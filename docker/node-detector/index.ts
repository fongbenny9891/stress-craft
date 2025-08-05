import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getHostResources } from './lib/hostDetection';
import fs from 'fs/promises';
import path from 'path';
import { formatBytes } from './lib/formatUtils';

const app = Fastify();
await app.register(cors, { origin: true });

app.get('/host-info', async () => {
  const resources = await getHostResources();
  return {
    cpu: {
      ...resources.cpu,
      logicalCores: `${resources.cpu.logicalCores} cores`,
    },
    memory: {
      totalMemBytes: formatBytes(resources.memory.totalMemBytes),
      memoryLimit: resources.memory.memoryLimit === 'unlimited' 
        ? 'unlimited' 
        : formatBytes(resources.memory.memoryLimit),
    }
  };
});

// Add state tracking
let currentTest: {
    startTime: number;
    fileCount: number;
    progress: number;
} | null = null;

app.get('/write-test', async (request, reply) => {
  const query = request.query as { count?: string; size?: string };
  const fileCount = parseInt(query.count || '100');
  const fileSizeKB = parseInt(query.size || '100');
  const testDir = '/tmp/test-write';
  const logFile = '/tmp/stress-status-node.log';

  // Clear previous log
  await fs.writeFile(logFile, 'Write test started\n');
  currentTest = {
    startTime: Date.now(),
    fileCount: fileCount,
    progress: 0
  };
  const startTime = Date.now();
  await fs.mkdir(testDir, { recursive: true });
  const data = Buffer.alloc(fileSizeKB * 1024, 'a');

  for (let i = 0; i < fileCount; i++) {
    const filePath = path.join(testDir, `file_${i}.txt`);
    await fs.writeFile(filePath, data);
    currentTest.progress = i;
    
    if (i % 1000 === 0 || i === fileCount - 1) {
      const elapsedMs = Date.now() - currentTest.startTime;
      const progress = (i / fileCount) * 100;
      await fs.appendFile(
        logFile,
        `Progress: ${i} / ${fileCount} (${progress.toFixed(1)}%) - Elapsed: ${(elapsedMs/1000).toFixed(2)}s\n`
      );
    }
  }

  const durationMs = Date.now() - startTime;
  await fs.appendFile(
    logFile, 
    `Completed: ${fileCount} / ${fileCount} (100.0%) - Total time: ${(durationMs/1000).toFixed(2)}s\n`
  );

  return {
    filesWritten: fileCount,
    fileSizeKB,
    totalSizeMB: (fileCount * fileSizeKB) / 1024,
    durationMs,
  };
});

app.get('/write-status', async () => {
  try {
    const logContent = await fs.readFile('/tmp/stress-status-node.log', 'utf-8');
    
    // Add current elapsed time if test is running
    if (currentTest && currentTest.progress < currentTest.fileCount) {
      const elapsedMs = Date.now() - currentTest.startTime;
      const progress = (currentTest.progress / currentTest.fileCount) * 100;
      return logContent + 
          `Current Progress: ${currentTest.progress} / ${currentTest.fileCount} ` +
          `(${progress.toFixed(1)}%) - Elapsed: ${(elapsedMs/1000).toFixed(2)}s\n`;
    }
    return logContent;
  } catch {
    return 'No log found';
  }
});

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => console.log('Node detector listening on port 3000'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
