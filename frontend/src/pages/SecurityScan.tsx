import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { api } from '../api';
import { toast } from 'sonner';

// Helper component for the CSS fix
const ScannerStyles = () => (
  <style>{`
    #reader video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important; /* This is the key fix */
    }
  `}</style>
);

const SecurityScan: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scanTrigger, setScanTrigger] = useState(0);

  useEffect(() => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader", { 
        verbose: false 
      });
    }
    const html5QrCode = html5QrCodeRef.current;

    if (result) return;

    const config = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdgePercentage = 0.7;
        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return { width: qrboxSize, height: qrboxSize };
      },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
              await html5QrCode.stop();
            }
            handleScan(decodedText);
          },
          (errorMessage) => {
            console.error("QR Code scan error:", errorMessage);
            setError("Failed to scan QR code.");
          }
        );
      } catch (err) {
        console.error("Camera start error:", err);
        const errorMessage = "Unable to access camera. Please ensure permissions are granted.";
        setError(errorMessage);
        toast.error('Camera Access Failed', { description: errorMessage });
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => {
          console.error("Failed to stop the scanner.", err);
        });
      }
    };
  }, [scanTrigger, result]);

  const handleScan = async (url: string) => {
    setLoading(true);
    setError(null);
    toast.loading('Validating QR code...');

    try {
      const parts = new URL(url);
      const [, , passId, token] = parts.pathname.split('/').slice(-4);
      const res = await api.get(`/security/scan/${passId}/${token}`);
      toast.dismiss();
      toast.success('Access Granted!', {
        description: `Gate pass validated for ${res.data.student.name}`,
      });
      setResult(res.data);
    } catch (e: any) {
      toast.dismiss();
      const errorMessage = e.response?.data?.error || 'Invalid or expired QR code.';
      setError(errorMessage);
      toast.error('Access Denied', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  const handleScanAgain = () => {
    setResult(null);
    setError(null);
    setLoading(false);
    setScanTrigger(prev => prev + 1);
  };

  return (
    <>
      {/* ADD THIS HELPER COMPONENT HERE */}
      <ScannerStyles />

      <div className="container-fluid min-vh-100 d-flex flex-column bg-light">
        {/* Header */}
        <div className="row justify-content-center py-3 bg-primary text-white shadow-sm">
          <div className="col-12 text-center">
            <h3 className="mb-0 fw-bold">🔒 Security QR Scanner</h3>
            <small className="opacity-75">Scan gate pass QR codes for validation</small>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="row justify-content-center flex-grow-1 py-3">
          <div className="col-12 col-md-8 col-lg-6 d-flex flex-column">
            {!result && !error && (
              <div className="card shadow-lg border-0 mb-3 w-100">
                <div className="card-body p-2">
                  <div className="position-relative w-100 bg-dark rounded overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
                    <div id="reader" className="position-absolute top-0 start-0 w-100 h-100" />
                    <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 d-flex justify-content-center align-items-center">
                      <div
                        className="rounded"
                        style={{
                          width: '70%',
                          height: '70%',
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                          border: '2px solid yellow',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="d-flex flex-column gap-3">
              {loading && (
                <div className="alert alert-info text-center" role="alert">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <strong>Validating QR Code...</strong>
                </div>
              )}

              {error && (
                <div className="alert alert-danger text-center" role="alert">
                  <h6 className="alert-heading mb-2">❌ Access Denied</h6>
                  <p className="mb-2">{error}</p>
                  <button className="btn btn-sm btn-danger" onClick={handleScanAgain}>
                    🔄 Try Again
                  </button>
                </div>
              )}

              {result && (
                <div className="card border-success shadow-sm fade-in">
                  <div className="card-header bg-success text-white text-center">
                    <h5 className="mb-0">✅ Access Granted</h5>
                  </div>
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <div
                        className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <span className="fw-bold fs-4">
                          {result.student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h5 className="fw-bold text-primary">{result.student.name}</h5>
                    </div>
                    <div className="row g-2">
                      <div className="col-12"><div className="d-flex align-items-center p-2 bg-light rounded">
                        <div className="me-3">📧</div><div>
                        <small className="text-muted d-block">Email</small>
                        <span className="fw-medium">{result.student.email}</span>
                      </div></div></div>
                      <div className="col-12"><div className="d-flex align-items-center p-2 bg-light rounded">
                        <div className="me-3">📝</div><div>
                        <small className="text-muted d-block">Reason</small>
                        <span className="fw-medium">{result.reason}</span>
                      </div></div></div>
                      <div className="col-6"><div className="d-flex align-items-center p-2 bg-light rounded">
                        <div className="me-2">📅</div><div>
                        <small className="text-muted d-block">Applied</small>
                        <span className="fw-medium small">{new Date(result.appliedAt).toLocaleDateString()}</span>
                      </div></div></div>
                      <div className="col-6"><div className="d-flex align-items-center p-2 bg-light rounded">
                        <div className="me-2">🕐</div><div>
                        <small className="text-muted d-block">Scanned</small>
                        <span className="fw-medium small">{new Date(result.scannedAt).toLocaleTimeString()}</span>
                      </div></div></div>
                    </div>
                    <div className="text-center mt-4">
                      <button className="btn btn-outline-primary" onClick={handleScanAgain}>
                        🔄 Scan Another Code
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Footer */}
        <div className="row mt-auto">
          <div className="col-12 bg-white py-3 border-top">
            <div className="text-center">
              <small className="text-muted">
                💡 <strong>Instructions:</strong> Position the QR code inside the yellow frame.
              </small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityScan;