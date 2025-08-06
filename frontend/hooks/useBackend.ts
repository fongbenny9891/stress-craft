import { useState } from 'react';
import { backendApi } from '../services/backendApi';
import type { BackendLanguage, HostInfoResponse, WriteTestResponse } from '../types/api';

export function useBackend(lang: BackendLanguage) {
  const [hostInfo, setHostInfo] = useState<HostInfoResponse | null>(null);
  const [writeTestResult, setWriteTestResult] = useState<WriteTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const fetchHostInfo = async () => {
    try {
      setError(null);
      const data = await backendApi.getHostInfo(lang);
      setHostInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch host info');
      console.error('Error fetching host info:', err);
    }
  };

  const runWriteTest = async (count: number, size: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await backendApi.runWriteTest(lang, { count, size });
      setWriteTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run write test');
      console.error('Error running write test:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWriteStatus = async () => {
    try {
      const text = await backendApi.getWriteStatus(lang);
      setProgress(text);
    } catch (err) {
      setProgress('Error fetching progress log');
    }
  };

  return {
    hostInfo,
    writeTestResult,
    isLoading,
    error,
    progress,
    fetchHostInfo,
    runWriteTest,
    getWriteStatus
  };
}