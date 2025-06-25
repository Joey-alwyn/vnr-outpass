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

      setReqs(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to respond')
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Pending Gate Pass Requests</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {reqs.length === 0 && <div className="text-center text-muted">No pending requests.</div>}

      <div className="row g-4">
        {reqs.map(r => (
          <div className="col-md-6" key={r.id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">{r.student.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{r.student.email}</h6>
                <p className="card-text"><strong>Reason:</strong> {r.reason}</p>
                <p className="card-text"><strong>Status:</strong> {r.status}</p>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-success"
                    onClick={() => respond(r.id, 'APPROVE')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => respond(r.id, 'REJECT')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MentorRequests
