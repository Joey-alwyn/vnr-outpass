import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { LoginButton } from '../components/LoginButton'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'

const Home: React.FC = () => {
  const { user, loading } = useAuth()
  const [latestPass, setLatestPass] = useState<any>(null)
  const [showQr, setShowQr] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return

    const fetchStatus = async () => {
      try {
        const res = await api.get('/student/status')
        setLatestPass(res.data.passes[0] || null)
      } catch {
        // Optional: Log or handle error here
        console.warn('Failed to fetch latest gate pass.')
      }
    }

    fetchStatus()
  }, [user])

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center">
        <div className="px-3 py-4 bg-white border rounded shadow-sm w-100" style={{ maxWidth: '360px' }}>
          <h4 className="mb-2 text-primary text-center">Welcome to VNR OutPass</h4>
          <p className="text-muted text-center mb-3" style={{ fontSize: '0.9rem' }}>
            Login with your college Google account to continue.
          </p>
          <LoginButton />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {user.role === 'STUDENT' && latestPass && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title">Your Latest Gate Pass</h5>
            <p><strong>Reason:</strong> {latestPass.reason}</p>
            <p><strong>Applied At:</strong> {new Date(latestPass.appliedAt).toLocaleString()}</p>
            <p><strong>Status:</strong> {latestPass.status}</p>

            {/* QR Code Logic */}
            {latestPass.status === 'APPROVED' && (
              <div className="text-center mt-3">
                {!latestPass.qr ? (
                  <p className="text-muted">QR Code not generated yet.</p>
                ) : !showQr ? (
                  <button className="btn btn-primary" onClick={() => setShowQr(true)}>
                    Show QR Code
                  </button>
                ) : (
                  <div>
                    <p className="mb-2">Present this QR to security:</p>
                    <img
                      src={latestPass.qr}
                      alt="Gate Pass QR"
                      className="img-fluid border"
                      style={{ maxWidth: '250px' }}
                    />
                    <div className="mt-3">
                      <button className="btn btn-outline-secondary" onClick={() => setShowQr(false)}>
                        Hide QR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {latestPass.status === 'PENDING' && (
              <p className="text-warning mt-2">Your request is pending approval.</p>
            )}
            {latestPass.status === 'REJECTED' && (
              <p className="text-danger mt-2">Your request was rejected.</p>
            )}
            {(latestPass.status === 'ESCALATED' || latestPass.status === 'UTILIZED') && (
              <p className="text-muted mt-2">This gate pass is no longer active.</p>
            )}
          </div>
        </div>
      )}

      {user.role === 'MENTOR' && (
        <div className="alert alert-info text-center">
          <h5>Welcome, Mentor</h5>
          <p>Use the Requests tab to view pending gate pass requests.</p>
        </div>
      )}

      {user.role === 'SECURITY' && (
        <div className="text-center">
          <h5 className="mb-3">Security Dashboard</h5>
          <button className="btn btn-primary" onClick={() => nav('/security/scan')}>
            Go to Scan QR
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
