import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { LoginButton } from '../components/LoginButton'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { QrCode, Clock, CheckCircle, XCircle, AlertCircle, FileText, Users, Scan, Shield, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const Home: React.FC = () => {
  const { user, loading } = useAuth()
  const [latestPass, setLatestPass] = useState<any>(null)
  const [, setError] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return

    const fetchStatus = async () => {
      try {
        const res = await api.get('/student/status')
        setLatestPass(res.data.passes[0] || null)
        if (res.data.passes[0]) {
          if (res.data.passes[0].status === 'APPROVED') {
            toast.success('Gate Pass Approved!', {
              description: 'Your latest gate pass has been approved. You can now show the QR code to security.'
            });
          } else if (res.data.passes[0].status === 'PENDING') {
            toast.info('Gate Pass Pending', {
              description: 'Your gate pass is waiting for mentor approval.'
            });
          } else if (res.data.passes[0].status === 'REJECTED') {
            toast.error('Gate Pass Rejected', {
              description: 'Your latest gate pass was rejected. You can apply for a new one.'
            });
          }
        }
      } catch {
        const errorMessage = 'Failed to fetch latest gate pass.';
        setError(errorMessage);
        toast.error('Failed to Load Status', {
          description: errorMessage
        });
      }
    }

    fetchStatus()
  }, [user])

  if (loading) {
    return (
      <div className="container-fluid px-3 py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <div className="card border-0 bg-transparent">
              <div className="card-body py-5">
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="text-muted">Loading your dashboard...</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-fluid px-3 py-5">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-body p-4 p-md-5 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                     style={{ width: '80px', height: '80px' }}>
                  <Shield size={36} className="text-primary" />
                </div>
                <h1 className="h3 fw-bold text-primary mb-3">Welcome to VNR OutPass</h1>
                <p className="text-muted mb-4 lead">
                  Secure and streamlined gate pass management system for VNR students and staff.
                </p>
                <div className="text-muted mb-4">
                  <small>Login with your college Google account to continue</small>
                </div>
                <LoginButton />
                
                <div className="row mt-5 text-start">
                  <div className="col-12">
                    <h6 className="fw-semibold mb-3 text-center">Features</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <FileText size={16} className="text-primary me-2" />
                          <small className="text-muted">Easy Applications</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <QrCode size={16} className="text-primary me-2" />
                          <small className="text-muted">QR Code Access</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <CheckCircle size={16} className="text-primary me-2" />
                          <small className="text-muted">Real-time Status</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <Shield size={16} className="text-primary me-2" />
                          <small className="text-muted">Secure System</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={20} className="text-success" />
      case 'PENDING':
        return <Clock size={20} className="text-warning" />
      case 'REJECTED':
        return <XCircle size={20} className="text-danger" />
      default:
        return <AlertCircle size={20} className="text-muted" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'danger'
      default: return 'secondary'
    }
  }

  return (
    <div className="container-fluid px-3 py-4">
      <div className="row">
        <div className="col-12">
          <div className="mb-4 fade-in">
            <h1 className="h3 fw-bold text-dark mb-1">Dashboard</h1>
            <p className="text-muted mb-0">Welcome back, {user.name}</p>
          </div>
        </div>
      </div>

      {/* Student Dashboard */}
      {user.role === 'STUDENT' && (
        <div className="row">
          {/* Quick Actions */}
          <div className="col-12 col-lg-8 mb-4">
            {latestPass ? (
              <div className="card shadow-sm border-0 fade-in">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0 fw-semibold">Latest Gate Pass</h5>
                    <span className={`badge bg-${getStatusColor(latestPass.status)} px-3 py-2`}>
                      {latestPass.status}
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <div className="bg-light p-3 rounded">
                        <h6 className="text-muted mb-1 small fw-semibold">REASON</h6>
                        <p className="mb-0 text-dark">{latestPass.reason}</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-3 rounded">
                        <h6 className="text-muted mb-1 small fw-semibold">APPLIED AT</h6>
                        <p className="mb-0 text-dark small">
                          {new Date(latestPass.appliedAt).toLocaleDateString()} at{' '}
                          {new Date(latestPass.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-3 rounded">
                        <h6 className="text-muted mb-1 small fw-semibold">STATUS</h6>
                        <div className="d-flex align-items-center">
                          {getStatusIcon(latestPass.status)}
                          <span className="ms-2 text-dark small fw-medium">{latestPass.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  {latestPass.status === 'APPROVED' && (
                    <div className="border-top pt-4">
                      {!latestPass.qr ? (
                        <div className="text-center py-3">
                          <AlertCircle size={24} className="text-muted mb-2" />
                          <p className="text-muted mb-0">QR Code is being generated...</p>
                        </div>
                      ) : !showQr ? (
                        <div className="text-center">
                          <button
                            className="btn btn-success px-4 py-2 d-inline-flex align-items-center"
                            onClick={() => {
                              setShowQr(true);
                              toast.success('QR Code Displayed', {
                                description: 'Present this QR code to security when exiting the campus.'
                              });
                            }}
                          >
                            <QrCode size={18} className="me-2" />
                            Show QR Code
                          </button>
                          <p className="text-muted mt-2 small">Present this QR code to security</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-white p-3 rounded border d-inline-block mb-3">
                            <img
                              src={latestPass.qr}
                              alt="Gate Pass QR"
                              className="img-fluid"
                              style={{ maxWidth: '200px', width: '100%' }}
                            />
                          </div>
                          <div>
                            <button
                              className="btn btn-outline-secondary me-2"
                              onClick={() => {
                                setShowQr(false);
                                toast.info('QR Code Hidden', {
                                  description: 'QR code has been hidden for security.'
                                });
                              }}
                            >
                              Hide QR
                            </button>
                            <p className="text-muted mt-2 small">
                              📱 Present this QR code to security when exiting
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Messages */}
                  {latestPass.status === 'PENDING' && (
                    <div className="alert alert-warning border-0 mb-0">
                      <div className="d-flex align-items-center">
                        <Clock size={18} className="text-warning me-2" />
                        <span>Your application is pending mentor approval.</span>
                      </div>
                    </div>
                  )}
                  {latestPass.status === 'REJECTED' && (
                    <div className="alert alert-danger border-0 mb-0">
                      <div className="d-flex align-items-center">
                        <XCircle size={18} className="text-danger me-2" />
                        <span>Your application was rejected. You can apply for a new gate pass.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card shadow-sm border-0 fade-in">
                <div className="card-body p-5 text-center">
                  <FileText size={48} className="text-muted mb-3" />
                  <h5 className="text-dark mb-2">No Gate Pass Applications</h5>
                  <p className="text-muted mb-4">You haven't applied for any gate passes yet.</p>
                  <button
                    className="btn btn-primary px-4 py-2 d-inline-flex align-items-center"
                    onClick={() => nav('/apply')}
                  >
                    <FileText size={18} className="me-2" />
                    Apply for Gate Pass
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="card-body p-4">
                <h5 className="card-title mb-3 fw-semibold">Quick Actions</h5>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary text-start d-flex align-items-center justify-content-between py-3"
                    onClick={() => nav('/apply')}
                  >
                    <div className="d-flex align-items-center">
                      <FileText size={20} className="me-3" />
                      <div>
                        <div className="fw-semibold">Apply for Pass</div>
                        <small className="opacity-75">Submit new application</small>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="btn btn-outline-primary text-start d-flex align-items-center justify-content-between py-3"
                    onClick={() => nav('/student/status')}
                  >
                    <div className="d-flex align-items-center">
                      <Shield size={20} className="me-3" />
                      <div>
                        <div className="fw-semibold">My Passes</div>
                        <small className="text-muted">View all applications</small>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Dashboard */}
      {user.role === 'MENTOR' && (
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-body p-5 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                     style={{ width: '80px', height: '80px' }}>
                  <Users size={36} className="text-primary" />
                </div>
                <h3 className="fw-bold text-dark mb-3">Mentor Dashboard</h3>
                <p className="text-muted mb-4">
                  Review and approve student gate pass requests efficiently.
                </p>
                <button
                  className="btn btn-primary px-4 py-2 d-inline-flex align-items-center"
                  onClick={() => nav('/mentor')}
                >
                  <Users size={18} className="me-2" />
                  View Pending Requests
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Dashboard */}
      {user.role === 'SECURITY' && (
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-body p-5 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                     style={{ width: '80px', height: '80px' }}>
                  <Scan size={36} className="text-primary" />
                </div>
                <h3 className="fw-bold text-dark mb-3">Security Dashboard</h3>
                <p className="text-muted mb-4">
                  Scan student QR codes to verify and process gate pass exits.
                </p>
                <button
                  className="btn btn-primary px-4 py-2 d-inline-flex align-items-center"
                  onClick={() => nav('/security')}
                >
                  <Scan size={18} className="me-2" />
                  Start QR Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOD Dashboard */}
      {user.role === 'HOD' && (
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-body p-5 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                     style={{ width: '80px', height: '80px' }}>
                  <Shield size={36} className="text-primary" />
                </div>
                <h3 className="fw-bold text-dark mb-3">HOD Dashboard</h3>
                <p className="text-muted mb-4">
                  Monitor and manage all gate pass activities in your department.
                </p>
                <button
                  className="btn btn-primary px-4 py-2 d-inline-flex align-items-center"
                  onClick={() => nav('/hod')}
                >
                  <Shield size={18} className="me-2" />
                  Open HOD Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
