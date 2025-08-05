import { useEffect, useState, useRef } from 'react';
import type { DetectorLanguage } from '../types/api';
import { useDetector } from '../hooks/useDetector';
import { config } from '../config/environment';

export default function Home() {
  // const renderCount = useRef(0);
  // const [lastUpdate, setLastUpdate] = useState(new Date());
  const [lang, setLang] = useState<DetectorLanguage>('node');
  const [testConfig, setTestConfig] = useState<{ count: number; size: number }>({
    count: config.detectors[lang].defaultCount,
    size: config.detectors[lang].defaultSize
  });

  const {
    hostInfo,
    writeTestResult,
    isLoading,
    error,
    progress,
    fetchHostInfo,
    runWriteTest,
    getWriteStatus
  } = useDetector(lang);

  // // Increment render count on each render
  // renderCount.current += 1;

  // useEffect(() => {
  //   setLastUpdate(new Date());
  // });

  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(getWriteStatus, 2000);
    return () => clearInterval(interval);
  }, [isLoading, getWriteStatus]);


  return (
    <div style={{ padding: 20 }}>
      {/* <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        background: '#f0f0f0', 
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div>Renders: {renderCount.current}</div>
        <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
      </div> */}

      <h1>Host Resource Detector</h1>

      <div style={{ marginBottom: 20 }}>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as DetectorLanguage)}
        >
          <option value="node">Node.js</option>
          <option value="go">Go</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Write Test Configuration</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>
            File Count:
            <input
              type="number"
              min="1"
              max="10000"
              value={testConfig.count}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                count: parseInt(e.target.value) || 100
              }))}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
          <label>
            File Size (KB):
            <input
              type="number"
              min="1"
              max="1024000"
              value={testConfig.size}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                size: parseInt(e.target.value) || 100
              }))}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={fetchHostInfo}>Fetch Host Info</button>
        <button
          onClick={() => runWriteTest(testConfig.count, testConfig.size)}
          disabled={isLoading}
        >
          {isLoading ? 'Running Test...' : 'Run Write Test'}
        </button>
      </div>

      {hostInfo && (
        <div>
          <h2>Host Info ({lang})</h2>
          <pre>{JSON.stringify(hostInfo, null, 2)}</pre>
        </div>
      )}

      {progress && (
        <div>
          <h2>Write Progress Log ({lang})</h2>
          <pre>{progress}</pre>
        </div>
      )}

      {writeTestResult && (
        <div>
          <h2>Write Test Result ({lang})</h2>
          <pre>{JSON.stringify(writeTestResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
