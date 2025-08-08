// Top-level statements first
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Global state
var currentTest = new TestState();

// API endpoints
app.MapGet("/host-info", () =>
{
    double? cpuLimit = null;
    long? memoryLimit = null;

    try
    {
        var quota = File.ReadAllText("/sys/fs/cgroup/cpu/cpu.cfs_quota_us");
        var period = File.ReadAllText("/sys/fs/cgroup/cpu/cpu.cfs_period_us");
        if (double.TryParse(quota, out var q) && double.TryParse(period, out var p) && q > 0 && p > 0)
        {
            cpuLimit = q / p;
        }
    }
    catch { }

    try
    {
        var limit = File.ReadAllText("/sys/fs/cgroup/memory/memory.limit_in_bytes");
        if (long.TryParse(limit, out var memLimit) && memLimit > 0 && memLimit < GC.GetGCMemoryInfo().TotalAvailableMemoryBytes)
        {
            memoryLimit = memLimit;
        }
    }
    catch { }

    return new
    {
        cpu = new
        {
            logicalCores = Environment.ProcessorCount,
            cpuLimit = cpuLimit.HasValue ? cpuLimit.Value.ToString() : "unlimited"
        },
        memory = new
        {
            totalMemBytes = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes,
            memoryLimit = memoryLimit.HasValue ? memoryLimit.Value.ToString() : "unlimited"
        }
    };
});

app.MapGet("/write-test", async (int count = 100, int size = 100) =>
{
    if (count <= 0 || size <= 0)
    {
        return Results.BadRequest("Count and size must be positive");
    }

    currentTest = new TestState
    {
        StartTime = DateTime.Now,
        FileCount = count,
        Progress = 0
    };

    var dirPath = "/tmp/test-write";
    var logPath = "/tmp/stress-status-csharp.log";
    Directory.CreateDirectory(dirPath);

    // Generate test data once
    var data = new string('a', size * 1024);
    var startMsg = $"Write test started - {count} files of {size}KB each\n";
    
    await File.WriteAllTextAsync(logPath, startMsg);
    Console.WriteLine($"[C# Backend] {startMsg}");

    var sw = System.Diagnostics.Stopwatch.StartNew();

    try
    {
        for (int i = 0; i < count; i++)
        {
            var filePath = Path.Combine(dirPath, $"file_{i}.txt");
            await File.WriteAllTextAsync(filePath, data);
            
            lock (currentTest)
            {
                currentTest.Progress = i + 1;
                // IsCompleted will be set automatically when Progress reaches FileCount
            }

            if ((i + 1) % 1000 == 0 || i + 1 == count)
            {
                var progress = (double)(i + 1) / count * 100;
                var logMsg = $"Progress: {i + 1} / {count} ({progress:F1}%) - Elapsed: {sw.Elapsed.TotalSeconds:F2}s\n";
                
                // Use FileStream for proper flushing
                using (var fileStream = new FileStream(logPath, FileMode.Append, FileAccess.Write))
                using (var writer = new StreamWriter(fileStream))
                {
                    await writer.WriteAsync(logMsg);
                    await writer.FlushAsync();
                    await fileStream.FlushAsync();
                }
                
                Console.WriteLine($"[C# Backend] {logMsg}");
                await Task.Yield();
            }
        }

        sw.Stop();
        var completionMsg = $"Completed: {count} / {count} (100.0%) - Total time: {sw.Elapsed.TotalSeconds:F2}s\n";
        await File.AppendAllTextAsync(logPath, completionMsg);
        Console.WriteLine($"[C# Backend] {completionMsg}");

        return Results.Json(new
        {
            filesWritten = count,
            fileSizeKB = size,
            totalSizeMB = (double)(count * size) / 1024,
            durationMs = (long)sw.Elapsed.TotalMilliseconds
        });
    }
    catch (Exception ex)
    {
        currentTest = null;
        return Results.StatusCode(500);
    }
    finally
    {
        if (!currentTest.IsCompleted)
        {
            currentTest = null;  // Reset on failure
        }
    }
});

app.MapGet("/write-status", async () =>
{
    try
    {
        var content = await File.ReadAllTextAsync("/tmp/stress-status-csharp.log");

        if (currentTest?.Progress < currentTest?.FileCount)
        {
            var elapsed = (DateTime.Now - currentTest.StartTime).TotalSeconds;
            var progress = (double)currentTest.Progress / currentTest.FileCount * 100;
            var currentStatus = $"Current Progress: {currentTest.Progress} / {currentTest.FileCount} " + $"({progress:F1}%) - Elapsed: {elapsed:F2}s\n";
            return Results.Text(content + currentStatus);
        }

        return Results.Text(content);
    }
    catch
    {
        return Results.Text("No log found");
    }
});

// Start the application
Console.WriteLine("C# backend listening on port 3004");
await app.RunAsync("http://0.0.0.0:3004");

// Type declarations must come last
public class TestState
{
    private int progress;
    private readonly object lockObject = new object();
    private bool isCompleted;
    
    public DateTime StartTime { get; set; }
    public int FileCount { get; set; }
    public bool IsCompleted 
    { 
        get 
        {
            lock (lockObject)
            {
                return isCompleted;
            }
        }
        set 
        {
            lock (lockObject)
            {
                isCompleted = value;
            }
        }
    }

    public int Progress
    {
        get
        {
            lock (lockObject)
            {
                return progress;
            }
        }
        set
        {
            lock (lockObject)
            {
                progress = value;
                if (progress >= FileCount)
                {
                    isCompleted = true;
                }
            }
        }
    }
}