import React, { useState } from 'react'
import { api } from '../api'

const SecurityScan: React.FC = () => {
  const [passId, setPassId] = useState('')
  const [token, setToken] = useState('')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchScan = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await api.get(`/security/scan/${passId}/${token}`)
      setData(res.data)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <h3 className="text-center mb-4">Security QR Scan</h3>

      <div className="mb-3">
        <label className="form-label">Pass ID</label>
        <input
          type="text"
          className="form-control"
          value={passId}
          onChange={e => setPassId(e.target.value)}
          placeholder="Enter Gate Pass ID"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">QR Token</label>
        <input
          type="text"
          className="form-control"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Enter QR Token"
        />
      </div>

      <div className="text-center">
        <button
          className="btn btn-primary"
          onClick={fetchScan}
          disabled={loading || !passId || !token}
        >
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mt-3 text-center">{error}</div>
      )}

      {data && (
        <div className="alert alert-success mt-3">
          <h5 className="mb-2">Scan Success</h5>
          <pre className="mb-0">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default SecurityScan
