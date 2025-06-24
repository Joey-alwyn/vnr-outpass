// src/components/GatePassForm.tsx
import React, { useState } from 'react'
import { api } from '../../api'
import { useNavigate } from 'react-router-dom'

interface GatePassData {
  reason: string
  fromDate: string
  toDate: string
}

const GatePassForm: React.FC = () => {
  const [data, setData] = useState<GatePassData>({ reason: '', fromDate: '', toDate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/student/apply', data)
      nav(`/student/status`)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Submission failed')
    } finally { 
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Apply for Gate Pass</h3>

      <label>
        Reason:
        <textarea
          name="reason"
          value={data.reason}
          onChange={handleChange}
          rows={3}
          required
          style={{ width: '100%' }}
        />
      </label>

      <label>
        From:
        <input
          type="datetime-local"
          name="fromDate"
          value={data.fromDate}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        To:
        <input
          type="datetime-local"
          name="toDate"
          value={data.toDate}
          onChange={handleChange}
          required
        />
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={loading} style={{ padding: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

export default GatePassForm