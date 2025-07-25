import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';

type Pass = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'UTILIZED';
  qr: string | null;
  appliedAt: string;
  reason: string; // ✅ Added reason
};

const StudentStatus: React.FC = () => {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ passes: Pass[] }>('/student/status')
      .then((res) => {
        setPasses(res.data.passes);
        if (res.data.passes.length === 0) {
          toast.info('No Gate Passes Found', {
            description: 'You haven\'t applied for any gate passes yet.'
          });
        }
      })
      .catch((e) => {
        const errorMessage = e.response?.data?.error || 'Failed to load passes';
        setError(errorMessage);
        toast.error('Failed to Load Passes', {
          description: errorMessage
        });
      });
  }, []);

  if (error)
    return <div className="alert alert-danger text-center">{error}</div>;
  if (passes.length === 0)
    return <div className="text-center">No gate passes found.</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Your Gate Passes</h2>
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
