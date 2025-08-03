import Fastify from 'fastify';
import { getHostResources } from './lib/hostDetection.js';
import fs from 'fs/promises';
import path from 'path';

const app = Fastify();

app.get('/host-info', async () => {
  return getHostResources();
});

app.get('/write-test', async (request, reply) => {
  const query = request.query as { count?: string; size?: string };
  const fileCount = parseInt(query.count || '100');    
  const fileSizeKB = parseInt(query.size || '100');    

  const start = Date.now();
  const testDir = '/tmp/test-write';
  await fs.mkdir(testDir, { recursive: true });
  const data = Buffer.alloc(fileSizeKB * 1024, 'a');

  for (let i = 0; i < fileCount; i++) {
    const filePath = path.join(testDir, `file_${i}.txt`);
    await fs.writeFile(filePath, data);
  }

  const durationMs = Date.now() - start;

  return {
    filesWritten: fileCount,
    fileSizeKB,
    totalSizeMB: (fileCount * fileSizeKB) / 1024,
    durationMs,
  };
});


app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => {
    console.log('Node detector listening on port 3000');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });