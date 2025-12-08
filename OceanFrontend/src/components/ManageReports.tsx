import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface Report {
  _id: string;
  type: string;
  location: { lat: number; lng: number };
  severity: number;
  description: string;
  verificationStatus: string;
  declineReason?: string;
  reportedBy: { name: string; email: string };
  verifiedBy?: { name: string; email: string };
  createdAt: string;
  imageUrl?: string;
}

export const ManageReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter, page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? '' : filter;
      const response = await api.get(`/admin/reports?status=${status}&page=${page}&limit=10`);
      setReports(response.reports);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reportId: string) => {
    if (actionLoading) return;
    try {
      setActionLoading(reportId);
      await api.put(`/admin/reports/${reportId}/verify`);
      fetchReports();
    } catch (error) {
      console.error('Error verifying report:', error);
      alert('Failed to verify report');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeclineModal = (report: Report) => {
    setSelectedReport(report);
    setShowDeclineModal(true);
  };

  const handleDecline = async () => {
    if (!selectedReport || actionLoading) return;

    try {
      setActionLoading(selectedReport._id);
      await api.put(`/admin/reports/${selectedReport._id}/decline`, {
        reason: declineReason || 'Report does not meet verification criteria',
      });
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error declining report:', error);
      alert('Failed to decline report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(reportId);
      await api.delete(`/admin/reports/${reportId}`);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      unverified: 'bg-yellow-100 text-yellow-800',
      'admin-verified': 'bg-green-100 text-green-800',
      'ai-verified': 'bg-blue-100 text-blue-800',
      declined: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Reports</h1>
          <p className="text-gray-600 mt-2">Review and verify hazard reports</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'unverified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('admin-verified')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'admin-verified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified
            </button>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-600">No reports found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{report.type}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.verificationStatus)}`}>
                        {report.verificationStatus}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Severity: {report.severity}/10
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Reported by: {report.reportedBy?.name || 'Unknown'} ({report.reportedBy?.email || 'N/A'})
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {report.imageUrl && (
                    <img
                      src={report.imageUrl}
                      alt="Report"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>

                <p className="text-gray-700 mb-3">{report.description || 'No description provided'}</p>

                <div className="text-sm text-gray-600 mb-4">
                  Location: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                </div>

                {report.declineReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Decline Reason:</strong> {report.declineReason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {report.verificationStatus === 'unverified' && (
                    <>
                      <button
                        onClick={() => handleVerify(report._id)}
                        disabled={actionLoading === report._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {actionLoading === report._id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          <>✓ Verify</>
                        )}
                      </button>
                      <button
                        onClick={() => openDeclineModal(report)}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✗ Decline
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(report._id)}
                    disabled={actionLoading === report._id}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === report._id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>🗑 Delete</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border rounded-lg">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Decline Report</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for declining this report:
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
              rows={4}
              placeholder="e.g., Insufficient evidence, duplicate report, etc."
            />
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Declining...
                  </>
                ) : (
                  'Decline Report'
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setSelectedReport(null);
                }}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
