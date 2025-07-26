import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import './MappingManager.css';

interface Student {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Mentor {
  id: string;
  email: string;
  name: string;
}

interface Mapping {
  id: string;
  student: Student;
  mentor: Mentor;
}

interface MappingData {
  mappings: Mapping[];
  studentsWithoutMentors: Student[];
  allMentors: Mentor[];
  summary: {
    totalMappings: number;
    unmappedStudents: number;
    totalMentors: number;
  };
}

const MappingManager: React.FC = () => {
  const [data, setData] = useState<MappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching student-mentor mappings...');
      
      const response = await api.get('/admin/student-mentor-mappings');
      setData(response.data);
      
      console.log('✅ Mappings fetched:', response.data.summary);
    } catch (error) {
      console.error('❌ Failed to fetch mappings:', error);
      toast.error('Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = async (studentId: string, mentorId: string | null) => {
    try {
      setUpdating(studentId);
      console.log(`🔄 Updating mapping for ${studentId} to ${mentorId || 'none'}...`);

      await api.put(`/admin/student-mentor-mappings/${studentId}`, {
        mentorId: mentorId || null
      });

      toast.success('Mapping updated successfully');
      setEditingStudent(null);
      await fetchMappings(); // Refresh data

    } catch (error) {
      console.error('❌ Failed to update mapping:', error);
      toast.error('Failed to update mapping');
    } finally {
      setUpdating(null);
    }
  };

  const removeMapping = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this mapping?')) return;
    
    await updateMapping(studentId, null);
  };

  if (loading) {
    return <div className="mapping-loading">Loading mappings...</div>;
  }

  if (!data) {
    return <div className="mapping-error">Failed to load mappings</div>;
  }

  return (
    <div className="mapping-manager">
      <div className="mapping-header">
        <h2>🔗 Student-Mentor Mappings</h2>
        <button onClick={fetchMappings} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="mapping-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-value">{data.summary.totalMappings}</div>
            <div className="card-label">Total Mappings</div>
          </div>
          <div className="summary-card">
            <div className="card-value">{data.summary.unmappedStudents}</div>
            <div className="card-label">Unmapped Students</div>
          </div>
          <div className="summary-card">
            <div className="card-value">{data.summary.totalMentors}</div>
            <div className="card-label">Available Mentors</div>
          </div>
        </div>
      </div>

      <div className="mapping-content">
        {/* Existing Mappings */}
        <div className="mapping-section">
          <h3>📋 Current Mappings ({data.mappings.length})</h3>
          
          {data.mappings.length === 0 ? (
            <div className="no-mappings">No mappings found</div>
          ) : (
            <div className="mappings-table">
              <div className="table-header">
                <div>Student</div>
                <div>Mentor</div>
                <div>Actions</div>
              </div>
              
              {data.mappings.map((mapping) => (
                <div key={mapping.id} className="table-row">
                  <div className="student-info">
                    <div className="name">{mapping.student.name}</div>
                    <div className="email">{mapping.student.email}</div>
                  </div>
                  
                  <div className="mentor-info">
                    {editingStudent === mapping.student.id ? (
                      <select
                        value={mapping.mentor.id}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateMapping(mapping.student.id, e.target.value);
                          }
                        }}
                        onBlur={() => setEditingStudent(null)}
                        autoFocus
                        disabled={updating === mapping.student.id}
                      >
                        <option value="">Select Mentor</option>
                        {data.allMentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                            {mentor.name} ({mentor.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <div className="name">{mapping.mentor.name}</div>
                        <div className="email">{mapping.mentor.email}</div>
                      </>
                    )}
                  </div>
                  
                  <div className="actions">
                    {updating === mapping.student.id ? (
                      <span className="updating">⏳</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingStudent(mapping.student.id)}
                          className="edit-btn"
                          disabled={editingStudent === mapping.student.id}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeMapping(mapping.student.id)}
                          className="remove-btn"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Without Mentors */}
        {data.studentsWithoutMentors.length > 0 && (
          <div className="mapping-section">
            <h3>⚠️ Students Without Mentors ({data.studentsWithoutMentors.length})</h3>
            
            <div className="unmapped-students">
              {data.studentsWithoutMentors.map((student) => (
                <div key={student.id} className="unmapped-student">
                  <div className="student-info">
                    <div className="name">{student.name}</div>
                    <div className="email">{student.email}</div>
                  </div>
                  
                  <div className="assign-mentor">
                    {editingStudent === student.id ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            updateMapping(student.id, e.target.value);
                          }
                        }}
                        onBlur={() => setEditingStudent(null)}
                        autoFocus
                        disabled={updating === student.id}
                      >
                        <option value="">Select Mentor</option>
                        {data.allMentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                            {mentor.name} ({mentor.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStudent(student.id)}
                        className="assign-btn"
                        disabled={updating === student.id}
                      >
                        {updating === student.id ? '⏳ Assigning...' : '👥 Assign Mentor'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Mentors */}
        <div className="mapping-section">
          <h3>👩‍🏫 Available Mentors ({data.allMentors.length})</h3>
          
          <div className="mentors-grid">
            {data.allMentors.map((mentor) => {
              const studentCount = data.mappings.filter(m => m.mentor.id === mentor.id).length;
              return (
                <div key={mentor.id} className="mentor-card">
                  <div className="mentor-name">{mentor.name}</div>
                  <div className="mentor-email">{mentor.email}</div>
                  <div className="mentor-students">
                    {studentCount} student{studentCount !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingManager;
