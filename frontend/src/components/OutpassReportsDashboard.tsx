import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface OutpassReport {
  id: string;
  student: {
    id: string;
    email: string;
    name: string;
  };
  mentor: {
    id: string;
    email: string;
    name: string;
  };
  reason: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  qrGeneratedAt?: string;
  scannedAt?: string;
  qrValid: boolean;
}

interface LiveStatus {
  currentlyOutside: {
    count: number;
    students: Array<{
      passId: string;
      student: { name: string; email: string };
      mentor: { name: string; email: string };
      reason: string;
      timeOutside: number;
    }>;
  };
  recentlyReturned: {
    count: number;
    students: Array<{
      passId: string;
      student: { name: string; email: string };
      returnedAt: string;
      totalTimeOut: number;
    }>;
  };
}

const OutpassReportsDashboard: React.FC = () => {
  const [reports, setReports] = useState<OutpassReport[]>([]);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'ALL'
  });

  useEffect(() => {
    fetchReports();
    fetchLiveStatus();
    
    // Refresh live status every 30 seconds
    const interval = setInterval(fetchLiveStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/outpass-reports', {
        params: filters
      });
      setReports(response.data.outpasses);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStatus = async () => {
    try {
      const response = await api.get('/admin/live-outpass-status');
      setLiveStatus(response.data);
    } catch (error) {
      console.error('Error fetching live status:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.post('/admin/download-outpass-report', filters, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `outpass_report_${filters.startDate}_to_${filters.endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const downloadApprovedScannedReport = async () => {
    try {
      const response = await api.post('/admin/download-approved-scanned-report', filters, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `approved_scanned_outpasses_${filters.startDate}_to_${filters.endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading approved & scanned report:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Outpass Reports Dashboard</h1>

      {/* Live Status Cards */}
      {liveStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Currently Outside Campus
            </h3>
            <div className="text-2xl font-bold text-red-600">
              {liveStatus.currentlyOutside.count}
            </div>
            {liveStatus.currentlyOutside.students.length > 0 && (
              <div className="mt-2 space-y-1">
                {liveStatus.currentlyOutside.students.slice(0, 3).map((student) => (
                  <div key={student.passId} className="text-sm text-red-700">
                    {student.student.name} - {student.timeOutside} mins
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Recently Returned
            </h3>
            <div className="text-2xl font-bold text-green-600">
              {liveStatus.recentlyReturned.count}
            </div>
            {liveStatus.recentlyReturned.students.length > 0 && (
              <div className="mt-2 space-y-1">
                {liveStatus.recentlyReturned.students.slice(0, 3).map((student) => (
                  <div key={student.passId} className="text-sm text-green-700">
                    {student.student.name} - {student.totalTimeOut} mins total
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="UTILIZED">Utilized</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button
              onClick={downloadReport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download All
            </button>
            <button
              onClick={downloadApprovedScannedReport}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Download Completed
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Outpass Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.student.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.mentor.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(report.appliedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(report.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OutpassReportsDashboard;
