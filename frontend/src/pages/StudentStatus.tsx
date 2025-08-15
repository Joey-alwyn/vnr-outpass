import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { Users, Shield, AlertCircle } from 'lucide-react';

type Pass = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'UTILIZED';
  qr: string | null;
  appliedAt: string;
  reason: string; // ✅ Added reason
};

type Mentor = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const StudentStatus: React.FC = () => {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchPasses = async () => {
      try {
        const res = await api.get<{ passes: Pass[] }>('/student/status');
        setPasses(res.data.passes);
        if (res.data.passes.length === 0) {
          toast.info('No Gate Passes Found', {
            description: 'You haven\'t applied for any gate passes yet.'
          });
        }
      } catch (e) {
        const errorMessage = (e as any).response?.data?.error || 'Failed to load passes';
        setError(errorMessage);
        toast.error('Failed to Load Passes', {
          description: errorMessage
        });
      }
    };

    const fetchMentor = async () => {
      try {
        const res = await api.get<{ mentor: Mentor }>('/student/mentor');
        setMentor(res.data.mentor);
      } catch (err) {
        console.log('Failed to fetch mentor details:', err);
        setMentor(null);
      }
    };

    fetchPasses();
    fetchMentor();
  }, []);

  if (error)
    return <div className="alert alert-danger text-center">{error}</div>;
  if (passes.length === 0)
    return <div className="text-center">No gate passes found.</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Your Gate Passes</h2>
      
      {/* Mentor Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center">
                <Users className="me-2 text-primary" size={20} />
                Your Mentor
              </h5>
              {mentor ? (
                <div className="d-flex align-items-start">
                  <div className="d-inline-flex align-items-center justify-content-center me-3"
                       style={{ 
                         width: '40px', 
                         height: '40px',
                         borderRadius: '10px',
                         background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                       }}>
                    <Shield size={20} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">{mentor.name}</h6>
                    <p className="mb-1 text-muted small">{mentor.email}</p>
                    <span className="badge bg-primary">{mentor.role}</span>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center text-muted">
                  <AlertCircle size={20} className="me-2" />
                  <span>No mentor assigned. Contact your HOD or admin.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {passes.map((p) => (
          <div key={p.id} className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Pass ID: {p.id}</h5>
                
                {/* ✅ Reason added here */}
                <p className="card-text">
                  <strong>Reason:</strong> {p.reason}
                </p>

                <p className="card-text">
                  <strong>Applied At:</strong>{' '}
                  {new Date(p.appliedAt).toLocaleString()}
                </p>
                <p className="card-text">
                  <strong>Status:</strong> {p.status}
                </p>

                {/* Approved QR Handling */}
                {p.status === 'APPROVED' && (
                  <div className="text-center mt-3">
                    {!p.qr ? (
                      <p className="text-muted">QR Code not generated yet.</p>
                    ) : !showQrFor || showQrFor !== p.id ? (
                      <button
                        onClick={() => {
                          setShowQrFor(p.id);
                          toast.success('QR Code Displayed', {
                            description: 'Present this QR code to security when exiting the campus.'
                          });
                        }}
                        className="btn btn-primary"
                      >
                        Show QR Code
                      </button>
                    ) : (
                      <div>
                        <p className="mb-2">Present this QR to security:</p>
                        <img
                          src={p.qr}
                          alt="Gate Pass QR"
                          className="img-fluid border"
                          style={{ maxWidth: '250px' }}
                        />
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setShowQrFor(null);
                              toast.info('QR Code Hidden', {
                                description: 'QR code has been hidden for security.'
                              });
                            }}
                            className="btn btn-outline-secondary"
                          >
                            Hide QR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Other Status Messages */}
                {p.status === 'PENDING' && (
                  <p className="text-warning">Your request is pending approval.</p>
                )}
                {p.status === 'REJECTED' && (
                  <p className="text-danger">Your request was rejected.</p>
                )}
                {(p.status === 'ESCALATED' || p.status === 'UTILIZED') && (
                  <p className="text-muted">
                    This gate pass is no longer active.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentStatus;
