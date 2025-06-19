import React, { useState } from 'react'
import { api } from '../api'

const SecurityScan: React.FC = () => {
  const [passId, setPassId] = useState('')
  const [token, setToken] = useState('')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchScan = async () => {
    try {
      setError(null)
      const res = await api.get(`/security/scan/${passId}/${token}`)
      setData(res.data)
    } catch (e: any) {
      setData(null)
      setError(e.response?.data?.error || 'Scan failed')
    }
  }

  return (
    <div>
      <input
        value={passId}
        onChange={e => setPassId(e.target.value)}
        placeholder="Pass ID"
      />
      <input
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="QR Token"
      />
      <button onClick={fetchScan}>Scan</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

export default SecurityScan
