package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

type CpuInfo struct {
	LogicalCores int         `json:"logicalCores"`
	CpuLimit     interface{} `json:"cpuLimit"`
}
type MemoryInfo struct {
	TotalMemBytes uint64      `json:"totalMemBytes"`
	MemoryLimit   interface{} `json:"memoryLimit"`
}
type HostResources struct {
	CPU    CpuInfo    `json:"cpu"`
	Memory MemoryInfo `json:"memory"`
}

// Add global state to track test progress
type TestState struct {
	StartTime  time.Time
	FileCount  int
	Progress   int
	IsComplete bool
	mutex      sync.Mutex
}

var currentTest = TestState{}

func getCpuLimit() interface{} {
	quota, _ := os.ReadFile("/sys/fs/cgroup/cpu/cpu.cfs_quota_us")
	period, _ := os.ReadFile("/sys/fs/cgroup/cpu/cpu.cfs_period_us")
	q, errQ := strconv.ParseFloat(strings.TrimSpace(string(quota)), 64)
	p, errP := strconv.ParseFloat(strings.TrimSpace(string(period)), 64)
	if errQ == nil && errP == nil && q > 0 && p > 0 {
		return q / p
	}
	return "unlimited"
}

func getMemoryLimit(total uint64) interface{} {
	limit, err := os.ReadFile("/sys/fs/cgroup/memory/memory.limit_in_bytes")
	if err == nil {
		v, err := strconv.ParseUint(strings.TrimSpace(string(limit)), 10, 64)
		if err == nil && v > 0 && v < total {
			return v
		}
	}
	return "unlimited"
}

func getHostResources() HostResources {
	memStat := new(runtime.MemStats)
	runtime.ReadMemStats(memStat)
	return HostResources{
		CPU: CpuInfo{
			LogicalCores: runtime.NumCPU(),
			CpuLimit:     getCpuLimit(),
		},
		Memory: MemoryInfo{
			TotalMemBytes: memStat.Sys,
			MemoryLimit:   getMemoryLimit(memStat.Sys),
		},
	}
}

func (t *TestState) UpdateProgress(value int) {
	t.mutex.Lock()
	defer t.mutex.Unlock()
	t.Progress = value
	if t.Progress >= t.FileCount {
		t.IsComplete = true
	}
}

func main() {
	http.HandleFunc("/host-info", func(w http.ResponseWriter, r *http.Request) {
		resources := getHostResources()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resources)
	})

	http.HandleFunc("/write-test", func(w http.ResponseWriter, r *http.Request) {
		// Input validation
		query := r.URL.Query()
		fileCount, _ := strconv.Atoi(query.Get("count"))
		fileSizeKB, _ := strconv.Atoi(query.Get("size"))
		if fileCount <= 0 {
			fileCount = 100
		}
		if fileSizeKB <= 0 {
			fileSizeKB = 100
		}

		// Create directories
		dir := "/tmp/test-write"
		logFile := "/tmp/stress-status-go.log"
		if err := os.MkdirAll(dir, os.ModePerm); err != nil {
			http.Error(w, "Failed to create directory", http.StatusInternalServerError)
			return
		}

		// Initialize log file
		logF, err := os.Create(logFile)
		if err != nil {
			http.Error(w, "Failed to create log file", http.StatusInternalServerError)
			return
		}
		defer logF.Close()

		// Initialize test state
		currentTest = TestState{
			StartTime: time.Now(),
			FileCount: fileCount,
			Progress:  0,
		}

		// Generate test data
		data := bytes.Repeat([]byte("a"), fileSizeKB*1024)
		
		// Write start message
		startMsg := fmt.Sprintf("Write test started - %d files of %dKB each\n", fileCount, fileSizeKB)
		if _, err := logF.WriteString(startMsg); err != nil {
			http.Error(w, "Failed to write to log", http.StatusInternalServerError)
			return
		}
		log.Printf("[Go Backend] %s", startMsg)

		// Write files
		for i := 0; i < fileCount; i++ {
			fpath := filepath.Join(dir, fmt.Sprintf("file_%d.txt", i))
			if err := os.WriteFile(fpath, data, 0644); err != nil {
				log.Printf("[Go Backend] Error writing file: %v", err)
				currentTest = TestState{} // Reset state on error
				http.Error(w, "Failed to write file", http.StatusInternalServerError)
				return
			}
			
			currentTest.UpdateProgress(i + 1)

			if (i + 1) % 1000 == 0 || i + 1 == fileCount {
				elapsed := time.Since(currentTest.StartTime)
				progress := float64(i + 1) / float64(fileCount) * 100
				logMessage := fmt.Sprintf(
					"Progress: %d / %d (%.1f%%) - Elapsed: %.2fs\n",
					i + 1, fileCount,
					progress,
					elapsed.Seconds(),
				)
				
				if _, err := logF.WriteString(logMessage); err != nil {
					http.Error(w, "Failed to write progress", http.StatusInternalServerError)
					return
				}
				logF.Sync()
				log.Printf("[Go Backend] %s", logMessage)
			}
		}

		// Write completion
		duration := time.Since(currentTest.StartTime)
		result := map[string]interface{}{
			"filesWritten": fileCount,
			"fileSizeKB":   fileSizeKB,
			"totalSizeMB":  float64(fileCount*fileSizeKB) / 1024,
			"durationMs":   duration.Milliseconds(),
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(result); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	})

	http.HandleFunc("/write-status", func(w http.ResponseWriter, r *http.Request) {
		content, err := os.ReadFile("/tmp/stress-status-go.log")
		if err != nil {
			w.Write([]byte("No log found"))
			return
		}

		// Add current elapsed time if test is running
		if !currentTest.StartTime.IsZero() {
			elapsed := time.Since(currentTest.StartTime)
			if currentTest.Progress < currentTest.FileCount {
				progress := float64(currentTest.Progress) / float64(currentTest.FileCount) * 100
				w.Write(append(content, []byte(fmt.Sprintf(
					"Current Progress: %d / %d (%.1f%%) - Elapsed: %.2fs\n",
					currentTest.Progress,
					currentTest.FileCount,
					progress,
					elapsed.Seconds(),
				))...))
				return
			}
		}
		w.Write(content)
	})

	log.Println("Go backend listening on :3001")
	log.Fatal(http.ListenAndServe(":3001", nil))
}
