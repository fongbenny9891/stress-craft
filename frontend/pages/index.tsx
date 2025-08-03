import { useState } from 'react';

export default function Home() {
  const [nodeData, setNodeData] = useState(null);
  const [goData, setGoData] = useState(null);

  const fetchData = async (service: 'node' | 'go') => {
    const res = await fetch(`/api/${service}`);
    const json = await res.json();
    service === 'node' ? setNodeData(json) : setGoData(json);
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px' }}>
      <h1>SpinForge Host Resource Detection</h1>
      <button onClick={() => fetchData('node')}>Fetch Node.js Detector</button>
      <button onClick={() => fetchData('go')}>Fetch Go Detector</button>

      <pre>{nodeData ? JSON.stringify(nodeData, null, 2) : 'No Node.js result yet'}</pre>
      <pre>{goData ? JSON.stringify(goData, null, 2) : 'No Go result yet'}</pre>
    </div>
  );
}
