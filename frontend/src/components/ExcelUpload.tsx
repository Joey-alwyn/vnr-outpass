import React, { useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import './ExcelUpload.css';

interface UploadResult {
  success: boolean;
  message: string;
  summary: {
    totalRows: number;
    validStudents: number;
    studentsWithMentors: number;
    studentsWithoutMentors: number;
    createdStudents: number;
    updatedStudents: number;
    successfulMappings: number;
    failedMappings: number;
  };
  details: {
    createdStudents: string[];
    updatedStudents: string[];
    mappingResults: Array<{
      student: string;
      mentor: string | null;
      status: string;
    }>;
    errors: string[];
  };
}

const ExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && 
          !selectedFile.name.toLowerCase().endsWith('.xlsx') && 
          !selectedFile.name.toLowerCase().endsWith('.xls')) {
        toast.error('Invalid file type', {
          description: 'Please select an Excel file (.xlsx or .xls)'
        });
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      console.log('📤 Uploading Excel file:', file.name);
      
      const response = await api.post('/admin/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload successful:', response.data);
      setResult(response.data);
      
      toast.success('Excel file processed successfully!', {
        description: `Processed ${response.data.summary.validStudents} students with ${response.data.summary.successfulMappings} successful mappings.`
      });

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast.error('Upload failed', {
        description: error.response?.data?.details || 'Failed to process Excel file'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      ['Student Email', 'Student Name', 'Roll Number', 'Department', 'Mentor Email', 'Mentor Name'],
      ['22071a0501@vnrvjiet.in', 'John Doe', '22071A0501', 'CSE', 'mentor1@vnrvjiet.in', 'Dr. Smith'],
      ['22071a0502@vnrvjiet.in', 'Jane Smith', '22071A0502', 'CSE', 'mentor2@vnrvjiet.in', 'Dr. Johnson'],
      ['22071a0503@vnrvjiet.in', 'Mike Wilson', '22071A0503', 'CSE', '', ''],
    ];
    
    // Convert to CSV for download (simple implementation)
    const csvContent = templateData.map(row => row.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-mentor-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.info('Template downloaded', {
      description: 'Use this template format for your Excel file'
    });
  };

  return (
    <div className="excel-upload">
      <div className="upload-header">
        <h2>📊 Excel Upload</h2>
        <p>Upload an Excel file to create student-mentor mappings in bulk</p>
      </div>

      <div className="upload-section">
        <div className="file-input-container">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            id="excel-file"
            className="file-input"
          />
          <label htmlFor="excel-file" className="file-input-label">
            {file ? file.name : 'Choose Excel File (.xlsx, .xls)'}
          </label>
        </div>

        <div className="upload-actions">
          <button
            onClick={downloadTemplate}
            className="template-btn"
            disabled={uploading}
          >
            📥 Download Template
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="upload-btn"
          >
            {uploading ? '⏳ Processing...' : '📤 Upload & Process'}
          </button>
        </div>
      </div>

      {result && (
        <div className="upload-result">
          <div className="result-header">
            <h3>✅ Processing Complete</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="details-toggle"
            >
              {showDetails ? '👁️ Hide Details' : '👁️ Show Details'}
            </button>
          </div>

          <div className="result-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Rows:</span>
                <span className="summary-value">{result.summary.totalRows}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Valid Students:</span>
                <span className="summary-value">{result.summary.validStudents}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Created:</span>
                <span className="summary-value success">{result.summary.createdStudents}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Updated:</span>
                <span className="summary-value info">{result.summary.updatedStudents}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Successful Mappings:</span>
                <span className="summary-value success">{result.summary.successfulMappings}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Failed Mappings:</span>
                <span className="summary-value error">{result.summary.failedMappings}</span>
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="result-details">
              {result.details.errors.length > 0 && (
                <div className="detail-section">
                  <h4>❌ Errors ({result.details.errors.length})</h4>
                  <ul className="error-list">
                    {result.details.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details.createdStudents.length > 0 && (
                <div className="detail-section">
                  <h4>✅ Created Students ({result.details.createdStudents.length})</h4>
                  <ul className="success-list">
                    {result.details.createdStudents.map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.details.mappingResults.length > 0 && (
                <div className="detail-section">
                  <h4>🔗 Mapping Results</h4>
                  <div className="mapping-results">
                    {result.details.mappingResults.map((mapping, index) => (
                      <div key={index} className={`mapping-item ${mapping.status}`}>
                        <span className="student">{mapping.student}</span>
                        <span className="arrow">→</span>
                        <span className="mentor">
                          {mapping.mentor || 'No Mentor'}
                        </span>
                        <span className={`status ${mapping.status}`}>
                          {mapping.status === 'mapped' ? '✅' : 
                           mapping.status === 'failed' ? '❌' : '⚠️'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="upload-instructions">
        <h4>📋 Instructions</h4>
        <ol>
          <li>Download the template to see the required format</li>
          <li>Fill in your student data with the following columns:</li>
          <ul>
            <li><strong>Student Email</strong> (required) - Must be @vnrvjiet.in</li>
            <li><strong>Student Name</strong> (required)</li>
            <li><strong>Roll Number</strong> (optional)</li>
            <li><strong>Department</strong> (optional)</li>
            <li><strong>Mentor Email</strong> (optional) - For automatic mapping</li>
            <li><strong>Mentor Name</strong> (optional) - For mentor creation</li>
          </ul>
          <li>Upload your Excel file (.xlsx or .xls format)</li>
          <li>Review the results and manually adjust mappings if needed</li>
        </ol>
      </div>
    </div>
  );
};

export default ExcelUpload;
