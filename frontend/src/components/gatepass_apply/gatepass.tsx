import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'

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
      nav('/student/status')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow" style={{ maxWidth: 480, width: '100%' }}>
        <h4 className="text-center mb-4">Apply for Gate Pass</h4>

        <div className="mb-3">
          <label htmlFor="reason" className="form-label">Reason</label>
          <textarea
            id="reason"
            name="reason"
            value={data.reason}
            onChange={handleChange}
            rows={3}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="fromDate" className="form-label">From</label>
          <input
            type="datetime-local"
            id="fromDate"
            name="fromDate"
            value={data.fromDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="toDate" className="form-label">To</label>
          <input
            type="datetime-local"
            id="toDate"
            name="toDate"
            value={data.toDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

export default GatePassForm
