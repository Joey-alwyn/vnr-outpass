import React, { useState } from 'react';
import Pagination from '../ui/Pagination';

const PaginationDemo: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 84; // Example total items
  const itemsPerPage = 15;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Mock data for demonstration
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    return {
      start: startIndex,
      end: endIndex,
      items: Array.from({ length: endIndex - startIndex + 1 }, (_, i) => ({
        id: startIndex + i,
        name: `User ${startIndex + i}`,
        email: `user${startIndex + i}@example.com`,
        role: ['Student', 'Mentor', 'HOD', 'Security'][Math.floor(Math.random() * 4)]
      }))
    };
  };

  const currentData = getCurrentPageData();

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h4 className="card-title mb-0 text-primary">
                <i className="fas fa-users me-2"></i>
                User Management
              </h4>
              <p className="text-muted mb-0 mt-1">
                Showing {currentData.start}-{currentData.end} of {totalItems} users
              </p>
            </div>
            
            <div className="card-body">
              {/* Users Table */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: '60px' }}>#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col" style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.items.map((user) => (
                      <tr key={user.id}>
                        <td className="fw-medium text-muted">{user.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm me-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  backgroundColor: '#007bff',
                                  fontSize: '12px'
                                }}
                              >
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            </div>
                            <span className="fw-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{user.email}</td>
                        <td>
                          <span className={`badge ${
                            user.role === 'Student' ? 'bg-primary' :
                            user.role === 'Mentor' ? 'bg-success' :
                            user.role === 'HOD' ? 'bg-warning text-dark' :
                            'bg-secondary'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary btn-sm">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="btn btn-outline-danger btn-sm">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced Pagination Footer */}
            <div className="card-footer bg-light border-top-0">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="d-flex align-items-center text-muted small">
                    <i className="fas fa-info-circle me-2"></i>
                    Displaying {currentData.start}-{currentData.end} of {totalItems} results
                  </div>
                </div>
                <div className="col-md-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="justify-content-md-end mt-3 mt-md-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="row mt-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <i className="fas fa-users mb-2 d-block"></i>
                    Total Users
                  </h5>
                  <h3 className="mb-0">{totalItems}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <i className="fas fa-file-alt mb-2 d-block"></i>
                    Current Page
                  </h5>
                  <h3 className="mb-0">{currentPage}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <i className="fas fa-layer-group mb-2 d-block"></i>
                    Total Pages
                  </h5>
                  <h3 className="mb-0">{totalPages}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginationDemo;
