import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCcw, Eye, ShieldAlert, X } from 'lucide-react';

const RefundsPage = () => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/refunds');
      setRefunds(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (status) => {
    try {
      if (status === 'REJECTED' && !rejectionNote) {
        alert('Rejection note is required');
        return;
      }
      await api.patch(`/finance/refunds/${selectedRefund.id}/verify`, {
        status,
        rejectionNote: status === 'REJECTED' ? rejectionNote : undefined
      });
      setShowReviewModal(false);
      setShowRejectModal(false);
      setRejectionNote('');
      fetchData();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openReviewModal = (refund) => {
    setSelectedRefund(refund);
    setShowReviewModal(true);
  };

  const openRejectModal = (refund) => {
    setSelectedRefund(refund);
    setRejectionNote('');
    setShowRejectModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = {
      APPROVED: 'Refunded',
      PENDING: 'Pending',
      REJECTED: 'Rejected'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Refund Approvals</h2>
          <p className="text-sm text-slate-500 mt-1">Review and process student refund requests from Training</p>
        </div>
      </div>

      <div className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4 text-right">Paid Amount</th>
                <th className="px-6 py-4 text-right">Refund Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Request Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">Loading records...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No refund requests found</td></tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{refund.studentPayment.student.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{refund.studentPayment.courseName}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      {formatCurrency(refund.studentPayment.paidAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-red-600">{formatCurrency(refund.refundAmount)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 text-xs font-medium">
                      {new Date(refund.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {refund.status === 'PENDING' && user.role === 'FINANCE_OFFICER' ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleAction('APPROVED')} 
                            onMouseEnter={() => setSelectedRefund(refund)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => openRejectModal(refund)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => openReviewModal(refund)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openReviewModal(refund)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review / Reject Modal */}
      {showReviewModal && selectedRefund && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <RefreshCcw className="w-5 h-5 mr-2 text-primary-600" /> Refund Details
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Student</p>
                    <p className="font-bold text-slate-800">{selectedRefund.studentPayment.student.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Course</p>
                    <p className="font-bold text-slate-800">{selectedRefund.studentPayment.courseName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Original Payment</p>
                    <p className="font-bold text-slate-600">{formatCurrency(selectedRefund.studentPayment.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Requested Refund</p>
                    <p className="font-bold text-red-600 text-lg">{formatCurrency(selectedRefund.refundAmount)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Refund Reason</p>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 min-h-[60px]">
                  {selectedRefund.reason}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Payment Reference</p>
                <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded inline-block text-slate-700">
                  {selectedRefund.studentPayment.reference || selectedRefund.studentPayment.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              {selectedRefund.status === 'REJECTED' && selectedRefund.rejectionNote && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-bold uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{selectedRefund.rejectionNote}</p>
                </div>
              )}

              {selectedRefund.status === 'PENDING' && user.role === 'FINANCE_OFFICER' && (
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={() => openRejectModal(selectedRefund)}
                    className="px-6 py-2.5 rounded-xl text-red-600 font-bold border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction('APPROVED')}
                    className="px-6 py-2.5 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRefund && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
              <h3 className="font-bold text-red-800 text-lg flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2" /> Reject Refund
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                You are about to reject the refund request for <strong>{selectedRefund.studentPayment.student.name}</strong>. This action requires a mandatory rejection reason.
              </p>
              <textarea 
                required
                value={rejectionNote} 
                onChange={e => setRejectionNote(e.target.value)} 
                className="input-field min-h-[100px] mb-4 border-red-200 focus:border-red-500 focus:ring-red-500" 
                placeholder="Type the exact reason for rejection here..." 
              />
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAction('REJECTED')}
                  disabled={!rejectionNote.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsPage;
