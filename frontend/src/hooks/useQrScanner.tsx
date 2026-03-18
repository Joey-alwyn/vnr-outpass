import { useState } from 'react';
import { api } from '../api'; // Your existing api instance
import { toast } from 'sonner';

// Define the shape of the successful scan data
interface ScanResult {
  student: {
    name: string;
    email: string;
  };
  reason: string;
  appliedAt: string;
  scannedAt: string;
}

export const useQrScanner = () => {
  const [data, setData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Processes a scanned QR code URL.
   */
  const processScan = async (url: string) => {
    // Prevent multiple requests while one is in flight
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    toast.loading('Validating QR code...');

    try {
      console.log('🔍 useQrScanner: Processing QR code scan', {
        urlPresent: !!url,
        urlLength: url.length
      });
      
      // 1. Parse the URL to get passId and token
      const parts = new URL(url).pathname.split('/');
      const passId = parts[parts.length - 2];
      const token = parts[parts.length - 1];

      console.log('📋 useQrScanner: Extracted QR parameters', {
        passIdPresent: !!passId,
        tokenPresent: !!token,
        pathDepth: parts.length
      });

      if (!passId || !token) {
        throw new Error("Invalid QR code format.");
      }

      // 2. Make the API call
      console.log('🔍 useQrScanner: Validating QR code with backend', {
        passId: passId,
        endpoint: `/security/scan/${passId}/${token}`
      });
      
      const res = await api.get<ScanResult>(`/security/scan/${passId}/${token}`);
      
      console.log('✅ useQrScanner: QR code validated successfully', {
        studentName: res.data.student.name,
        studentEmail: res.data.student.email,
        scannedAt: res.data.scannedAt
      });
      
      setData(res.data);
      toast.dismiss();
      toast.success('Access Granted!', {
        description: `Gate pass validated for ${res.data.student.name}`,
      });

    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Invalid or expired QR code';
      
      console.error('❌ useQrScanner: QR code validation failed', {
        errorMessage: errorMsg,
        status: e.response?.status,
        isNetworkError: !e.response,
        error: e
      });
      
      setError(errorMsg);
      toast.dismiss();
      toast.error('Access Denied', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets the scanner state to allow for a new scan.
   */
  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return { data, error, isLoading, processScan, reset };
};