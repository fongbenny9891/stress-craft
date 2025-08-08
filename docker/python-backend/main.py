from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
import psutil
import aiofiles
import os
import time
import logging
from typing import Optional
from threading import Lock
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/host-info")
async def host_info():
    cpu_limit = "unlimited"
    memory_limit = "unlimited"
    
    # Try to get container CPU limit
    try:
        with open("/sys/fs/cgroup/cpu/cpu.cfs_quota_us") as f:
            quota = float(f.read().strip())
        with open("/sys/fs/cgroup/cpu/cpu.cfs_period_us") as f:
            period = float(f.read().strip())
        if quota > 0 and period > 0:
            cpu_limit = quota / period
    except:
        pass

    # Try to get container memory limit
    try:
        with open("/sys/fs/cgroup/memory/memory.limit_in_bytes") as f:
            mem_limit = int(f.read().strip())
        if mem_limit > 0 and mem_limit < psutil.virtual_memory().total:
            memory_limit = mem_limit
    except:
        pass

    return {
        "cpu": {
            "logicalCores": psutil.cpu_count(),
            "cpuLimit": cpu_limit
        },
        "memory": {
            "totalMemBytes": psutil.virtual_memory().total,
            "memoryLimit": memory_limit
        }
    }

# Global state for tracking current test
current_test: Optional[dict] = None

# Add thread-safe state management
class TestState:
    def __init__(self, count: int):
        self.lock = Lock()
        self.start_time = time.time()
        self.file_count = count
        self.progress = 0
        self.is_completed = False

    def update_progress(self, value: int):
        with self.lock:
            self.progress = value
            if self.progress >= self.file_count:
                self.is_completed = True

# Update the write_test function
@app.get("/write-test")
async def write_test(count: int = 100, size: int = 100):
    global current_test
    
    # Validate input
    if count <= 0 or size <= 0:
        raise HTTPException(status_code=400, detail="Count and size must be positive")
    
    # Initialize thread-safe test state
    current_test = TestState(count)

    try:
        # Create test directory and log file
        dir_path = "/tmp/test-write"
        log_path = "/tmp/stress-status-python.log"
        os.makedirs(dir_path, exist_ok=True)
        
        # Generate test data once
        test_data = "a" * (size * 1024)  # size in KB
        
        # Initialize log file
        async with aiofiles.open(log_path, "w") as log_file:
            start_msg = f"Write test started - {count} files of {size}KB each\n"
            await log_file.write(start_msg)
            logger.info(f"[Python Backend] {start_msg}")

        # Write files
        start_time = time.time()
        for i in range(count):
            file_path = os.path.join(dir_path, f"file_{i}.txt")
            async with aiofiles.open(file_path, "w") as f:
                await f.write(test_data)
            
            # Thread-safe progress update
            current_test.update_progress(i + 1)  # Fix: i + 1 instead of i

            # Log progress every 1000 files or at completion
            if (i + 1) % 1000 == 0 or i + 1 == count:
                elapsed = time.time() - current_test.start_time
                progress = (i + 1) / count * 100
                log_msg = f"Progress: {i + 1} / {count} ({progress:.1f}%) - Elapsed: {elapsed:.2f}s\n"
                
                async with aiofiles.open(log_path, "a") as log_file:
                    await log_file.write(log_msg)
                    await log_file.flush()  # Ensure log is written
                logger.info(f"[Python Backend] {log_msg}")
                await asyncio.sleep(0)  # Allow other tasks to run

        # Log completion
        duration = time.time() - start_time
        completion_msg = f"Completed: {count} / {count} (100.0%) - Total time: {duration:.2f}s\n"
        async with aiofiles.open(log_path, "a") as log_file:
            await log_file.write(completion_msg)
        logger.info(f"[Python Backend] {completion_msg}")

        return JSONResponse({
            "filesWritten": count,
            "fileSizeKB": size,
            "totalSizeMB": (count * size) / 1024,
            "durationMs": int(duration * 1000)
        })

    except Exception as e:
        logger.error(f"[Python Backend] Error: {str(e)}")
        current_test = None
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/write-status", response_class=PlainTextResponse)
async def write_status():
    try:
        async with aiofiles.open("/tmp/stress-status-python.log", "r") as f:
            content = await f.read()

        # Add current progress if test is running
        if current_test and current_test.progress < current_test.file_count:
            elapsed = time.time() - current_test.start_time
            progress = (current_test.progress / current_test.file_count) * 100
            current_status = (
                f"Current Progress: {current_test.progress} / {current_test.file_count} "
                f"({progress:.1f}%) - Elapsed: {elapsed:.2f}s\n"
            )
            return content + current_status
        
        return content
    except FileNotFoundError:
        return "No log found"

if __name__ == "__main__":
    import uvicorn
    logger.info("Python backend listening on port 3003")
    uvicorn.run(app, host="0.0.0.0", port=3003)