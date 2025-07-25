import React, { useEffect, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../api'
import { toast } from 'sonner'

const SecurityScan: React.FC = () => {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

useEffect(() => {
  const html5QrCode = new Html5Qrcode("reader")

  html5QrCode
    .start(
      { facingMode: "environment" }, 
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        await html5QrCode.stop()
        handleScan(decodedText)
      },
      (errorMessage) => console.log("QR scan error:", errorMessage)
    )
    .catch(err => {
      console.error("Camera start error:", err)
      const errorMessage = "Unable to access camera. Please ensure camera permissions are granted.";
      setError(errorMessage);
      toast.error('Camera Access Failed', {
        description: errorMessage
      });
    })

  return () => {
    html5QrCode
      .stop()
      .catch(() => {})
  }
}, [])

  const handleScan = async (url: string) => {
    setLoading(true)
    setError(null)
    toast.loading('Validating QR code...');
    
    try {
      const parts = new URL(url)
      const [, , passId, token] = parts.pathname.split('/').slice(-4)
      const res = await api.get(`/security/scan/${passId}/${token}`)
      
      toast.dismiss();
      toast.success('Access Granted!', {
        description: `Gate pass validated for ${res.data.student.name}`
      });
      
      setResult(res.data)
    } catch (e: any) {
      toast.dismiss();
      const errorMessage = e.response?.data?.error || 'Invalid QR code';
      setError(errorMessage);
      toast.error('Access Denied', {
        description: errorMessage
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <h3 className="text-center mb-3">Security QR Scanner</h3>
      <div id="reader" style={{ width: '100%' }} />

      {loading && <p className="text-center mt-3">Validating...</p>}
      {error && (
        <div className="alert alert-danger mt-3 text-center">{error}</div>
      )}
      {result && (
  <div className="card mt-4 shadow-sm border-success">
    <div className="card-header bg-success text-white">
      Access Granted
    </div>
    <div className="card-body">
      <h5 className="card-title">Student: {result.student.name}</h5>
      <p className="card-text"><strong>Email:</strong> {result.student.email}</p>
      <p className="card-text"><strong>Reason:</strong> {result.reason}</p>
      <p className="card-text"><strong>Applied At:</strong> {new Date(result.appliedAt).toLocaleString()}</p>
      <p className="card-text"><strong>Scanned At:</strong> {new Date(result.scannedAt).toLocaleString()}</p>
    </div>
  </div>
)}
    </div>
  )
}

export default SecurityScan
