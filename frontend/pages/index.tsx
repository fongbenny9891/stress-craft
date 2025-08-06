import { useEffect, useState } from "react";
import type { BackendLanguage } from "../types/api";
import { useBackend } from "../hooks/useBackend";
import { config } from "../config/environment";

export default function Home() {
  const [lang, setLang] = useState<BackendLanguage>("node");
  const [testConfig, setTestConfig] = useState<{ count: number; size: number }>(
    {
      count: config.backends[lang].defaultTestConfig.count,
      size: config.backends[lang].defaultTestConfig.size,
    }
  );

  const {
    hostInfo,
    writeTestResult,
    isLoading,
    error,
    progress,
    fetchHostInfo,
    runWriteTest,
    getWriteStatus,
  } = useBackend(lang);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(
      getWriteStatus,
      config.test.logUpdateIntervalMs
    );
    return () => clearInterval(interval);
  }, [isLoading, getWriteStatus]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Stress Craft - Backend Performance Comparison</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          Backend Language:
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as BackendLanguage)}
            style={{ marginLeft: "0.5rem" }}
          >
            {config.getSupportedLanguages().map((language) => (
              <option key={language} value={language}>
                {config.backends[language].name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Write Test Configuration</h3>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label>
            File Count:
            <input
              type="number"
              min="1"
              max={config.test.maxFileCount}
              value={testConfig.count}
              onChange={(e) =>
                setTestConfig((prev) => ({
                  ...prev,
                  count: parseInt(e.target.value) || 100,
                }))
              }
              style={{ marginLeft: "0.5rem" }}
            />
          </label>
          <label>
            File Size (KB):
            <input
              type="number"
              min="1"
              max={config.test.maxFileSizeKB}
              value={testConfig.size}
              onChange={(e) =>
                setTestConfig((prev) => ({
                  ...prev,
                  size: parseInt(e.target.value) || 100,
                }))
              }
              style={{ marginLeft: "0.5rem" }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={fetchHostInfo}>Fetch Host Info</button>
        <button
          onClick={() => runWriteTest(testConfig.count, testConfig.size)}
          disabled={isLoading}
        >
          {isLoading ? "Running Test..." : "Run Write Test"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>Error: {error}</div>
      )}

      {hostInfo && (
        <div>
          <h2>Host Info ({config.backends[lang].name})</h2>
          <pre>{JSON.stringify(hostInfo, null, 2)}</pre>
        </div>
      )}

      {progress && (
        <div>
          <h2>Write Progress Log ({config.backends[lang].name})</h2>
          <pre>{progress}</pre>
        </div>
      )}

      {writeTestResult && (
        <div>
          <h2>Write Test Result ({config.backends[lang].name})</h2>
          <pre>{JSON.stringify(writeTestResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
