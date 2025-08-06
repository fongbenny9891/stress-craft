# Stress Craft

A tool to benchmark and compare file I/O performance across different programming languages. Built because I was curious about how different languages handle intensive file operations and system resources.

## The Problem

Ever wondered:
- How Node.js compares to Go for heavy file operations?
- What happens to memory usage when writing thousands of files?
- Which backend language handles concurrent file I/O better?

## The Solution

Built a system that:
- Creates lots of files concurrently
- Tracks CPU and memory usage in real-time
- Compares performance between different backend implementations
- Shows everything in a clean web interface

## Quick Start

```bash
# Get everything running
pnpm install
pnpm start         # Starts Node.js and Go backends in Docker
pnpm dev:frontend  # Launches the UI

# Open http://localhost:3002 and start testing!
```

## Core Features

🔄 **Multiple Backend Languages**
- Node.js (Fastify) service
- Go service
- More planned (Rust coming soon!)

📊 **Real-time Monitoring**
- CPU usage tracking
- Memory consumption analysis
- Write performance metrics

🎮 **Easy Control**
- Web-based dashboard
- Customizable test parameters
- Live results display

## Tech Stack

- **Frontend:** Next.js + TypeScript + React
- **Backend Services:** 
  - Node.js with Fastify
  - Go
- **Infrastructure:** Docker
- **Package Management:** pnpm

## API Examples

Get system resources:
```bash
GET /api/node/host-info
```

Run a write test:
```bash
GET /api/node/write-test?count=1000&size=100
```

## Project Structure

```
stress-craft/
├── frontend/          # Next.js frontend
├── docker/
│   ├── node-backend/ # Node.js backend
│   └── go-backend/   # Go backend
└── compose/           # Docker compose files
```

## What's Next?

- [ ] Add Other backend comparison
- [ ] Test other I/O actions (Read, Delete, etc), and other possible testing configs
- [ ] Add more test parameters
- [ ] Implement better visualization
- [ ] Create resource usage graphs
