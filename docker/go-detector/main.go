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

func main() {
	http.HandleFunc("/host-info", func(w http.ResponseWriter, r *http.Request) {
		resources := getHostResources()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resources)
	})

http.HandleFunc("/write-test", func(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	query := r.URL.Query()
	fileCount, _ := strconv.Atoi(query.Get("count"))
	fileSizeKB, _ := strconv.Atoi(query.Get("size"))

	if fileCount <= 0 {
		fileCount = 100
	}
	if fileSizeKB <= 0 {
		fileSizeKB = 100
	}

	dir := "/tmp/test-write"
	os.MkdirAll(dir, os.ModePerm)
	data := bytes.Repeat([]byte("a"), fileSizeKB*1024)

	for i := 0; i < fileCount; i++ {
		fpath := filepath.Join(dir, fmt.Sprintf("file_%d.txt", i))
		os.WriteFile(fpath, data, 0644)
	}

	duration := time.Since(start)

	result := map[string]interface{}{
		"filesWritten": fileCount,
		"fileSizeKB":   fileSizeKB,
		"totalSizeMB":  float64(fileCount*fileSizeKB) / 1024,
		"durationMs":   duration.Milliseconds(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
})


	log.Println("Go detector listening on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
