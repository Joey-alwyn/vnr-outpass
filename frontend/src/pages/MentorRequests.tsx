import React, { useEffect, useState } from 'react'
import { api } from '../api'

type Req = {
  id: string
  studentId: string
  reason: string
  status: string
  student: {
    name: string
    email: string
  }
}

const MentorRequests: React.FC = () => {
  const [reqs, setReqs] = useState<Req[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchReqs = async () => {
    try {
      const res = await api.get('/mentor/requests')
      setReqs(res.data.requests)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load requests')
    }
  }

  useEffect(() => {
    fetchReqs()
  }, [])

  const respond = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setError(null)
      const res = await api.post('/mentor/respond', { gatePassId: id, action })

      if (res.data.qr) {
        alert(`Approved! QR Code:\n${res.data.qr}`)
      } else {
        alert(`Request ${action.toLowerCase()}ed`)
      }

      // Remove from state immediately after response
      setReqs(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to respond')
    }
  }

  return (
    <div>
      <h2>Pending Requests</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {reqs.length === 0 && <div>No pending requests.</div>}
      <ul>
        {reqs.map(r => (
          <li key={r.id} style={{ marginBottom: '1rem' }}>
            <strong>Student:</strong> {r.student.name} ({r.student.email})<br />
            <strong>Reason:</strong> {r.reason}<br />
            <strong>Status:</strong> {r.status}<br />
            <button onClick={() => respond(r.id, 'APPROVE')}>Approve</button>
            <button onClick={() => respond(r.id, 'REJECT')} style={{ marginLeft: '0.5rem' }}>
              Reject
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MentorRequests
