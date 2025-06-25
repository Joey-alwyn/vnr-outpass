import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../api'

const SecurityScan: React.FC = () => {
  const qrRef = useRef(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader")
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        html5QrCode.start(
          devices[0].id,
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            html5QrCode.stop()
            handleScan(decodedText)
          },
          (errorMessage) => console.log("QR scan error:", errorMessage)
        )
      }
    })

    return () => {
      Html5Qrcode.getCameras().then(() => html5QrCode.stop().catch(() => {}))
    }
  }, [])

  const handleScan = async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const parts = new URL(url)
      const [, , passId, token] = parts.pathname.split('/').slice(-4)
      const res = await api.get(`/security/scan/${passId}/${token}`)
      setResult(res.data)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Invalid QR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <h3 className="text-center mb-3">Security QR Scanner</h3>
      <div id="reader" style={{ width: '100%' }}></div>

      {loading && <p className="text-center mt-3">Validating...</p>}
      {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
      {result && (
        <div className="alert alert-success mt-3">
          <h5>Scan Success</h5>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default SecurityScan
