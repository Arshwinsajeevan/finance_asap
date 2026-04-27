import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Check, X, Search, FileImage, ShieldAlert, Eye } from 'lucide-react';

const UtilisationPage = () => {
  const { user } = useAuth();
  const [utilisations, setUtilisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedUtil, setSelectedUtil] = useState(null);
  
  // Review Actions
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/utilisations');
      setUtilisations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/finance/utilisations/${selectedUtil.id}/verify`, {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejectionNote: actionType === 'REJECTED' ? rejectionNote : undefined
      });
      setShowReviewModal(false);
      fetchData();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openReviewModal = (util) => {
    setSelectedUtil(util);
    setRejectionNote('');
    setActionType('');
    setShowReviewModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = {
      APPROVED: 'Verified & Approved',
      PENDING: 'Submitted (Review Pending)',
      REJECTED: 'Rejected'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredData = filter === 'ALL' 
    ? utilisations 
    : utilisations.filter(r => r.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Utilisation Reports (Audit)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and verify utilisation reports submitted by verticals after fund release
          </p>
        </div>
      </div>

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl overflow-x-auto">
          <div className="flex space-x-2 shrink-0">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  filter === status 
                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                {status === 'PENDING' ? 'SUBMITTED' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-4">Expense Details</th>
                <th className="px-6 py-4">Linked Requisition</th>
                <th className="px-6 py-4 text-right">Amount Utilised</th>
                <th className="px-6 py-4 text-center">Audit Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading records...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No utilisation reports found for this filter.</td></tr>
              ) : (
                filteredData.map((util) => (
                  <tr key={util.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{util.description}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1 text-slate-400" />
                        Bill/Invoice No: {util.billNo || 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium line-clamp-1">{util.requisition?.purpose}</div>
                      <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mt-1 uppercase font-bold tracking-wider">{util.vertical}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800 text-base">
                      {formatCurrency(util.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        {getStatusBadge(util.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {util.status === 'PENDING' ? (
                        <button 
                          onClick={() => openReviewModal(util)}
                          className="flex items-center mx-auto px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Review & Audit
                        </button>
                      ) : (
                        <button 
                          onClick={() => openReviewModal(util)}
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

      {/* Review Modal */}
      {showReviewModal && selectedUtil && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-primary-600" /> Utilisation Audit Review
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Vertical / Dept</p>
                  <p className="font-bold text-slate-800">{selectedUtil.vertical}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fund Released</p>
                  <p className="font-bold text-blue-600">{formatCurrency(selectedUtil.requisition?.releasedAmount || 0)}</p>
                </div>
                <div className={`p-4 rounded-xl border ${selectedUtil.amount > (selectedUtil.requisition?.releasedAmount || 0) ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Amount Utilised</p>
                  <p className={`font-bold ${selectedUtil.amount > (selectedUtil.requisition?.releasedAmount || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatCurrency(selectedUtil.amount)}
                  </p>
                </div>
              </div>

              {/* Validation Warnings */}
              {selectedUtil.status === 'PENDING' && selectedUtil.amount > (selectedUtil.requisition?.releasedAmount || 0) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start">
                  <ShieldAlert className="w-5 h-5 mr-2 shrink-0 text-red-500" />
                  <div>
                    <p className="font-bold">Compliance Failure</p>
                    <p>Utilised amount exceeds the approved released funds. Approval is blocked.</p>
                  </div>
                </div>
              )}

              {selectedUtil.status === 'PENDING' && !selectedUtil.billNo && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm flex items-start">
                  <ShieldAlert className="w-5 h-5 mr-2 shrink-0 text-amber-500" />
                  <div>
                    <p className="font-bold">Missing Documentation</p>
                    <p>No bill or invoice number provided. Please verify proof before approving.</p>
                  </div>
                </div>
              )}

              {/* Expense Details */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Expense Breakdown & Proof</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Description / Purpose</p>
                    <p className="text-sm font-medium text-slate-800">{selectedUtil.description}</p>
                    
                    <p className="text-xs text-slate-500 font-medium mt-4 mb-1">Linked Requisition</p>
                    <p className="text-sm font-medium text-slate-800">{selectedUtil.requisition?.purpose}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-2">Uploaded Proof</p>
                    <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 text-slate-500 h-24">
                      <FileImage className="w-6 h-6 mb-2 text-slate-400" />
                      <span className="text-xs font-medium">Invoice Document (Demo)</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUtil.status === 'REJECTED' && selectedUtil.rejectionNote && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-bold uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{selectedUtil.rejectionNote}</p>
                </div>
              )}

              {/* Action Form (Only if PENDING) */}
              {selectedUtil.status === 'PENDING' && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Audit Decision</h4>
                  <form onSubmit={handleAction} className="space-y-4">
                    <div className="flex gap-4">
                      <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${actionType === 'APPROVE' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center">
                          <input type="radio" name="action" value="APPROVE" onChange={() => setActionType('APPROVE')} className="mr-3 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                          <div>
                            <p className="font-bold text-emerald-700 text-sm">Approve & Verify</p>
                            <p className="text-xs text-emerald-600/70 mt-0.5">Marks requisition as completed</p>
                          </div>
                        </div>
                      </label>

                      <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${actionType === 'REJECT' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 hover:border-red-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center">
                          <input type="radio" name="action" value="REJECT" onChange={() => setActionType('REJECT')} className="mr-3 text-red-600 focus:ring-red-500 w-4 h-4" />
                          <div>
                            <p className="font-bold text-red-700 text-sm">Reject Submission</p>
                            <p className="text-xs text-red-600/70 mt-0.5">Sends back for resubmission</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {actionType === 'REJECT' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <textarea 
                          required 
                          value={rejectionNote} 
                          onChange={e => setRejectionNote(e.target.value)} 
                          className="input-field min-h-[100px]" 
                          placeholder="Please provide the exact reason for rejection (e.g., 'Invoice mismatch', 'Missing GST number')..." 
                        />
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={!actionType || (actionType === 'APPROVE' && selectedUtil.amount > (selectedUtil.requisition?.releasedAmount || 0))}
                        className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          actionType === 'REJECT' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 
                          'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        }`}
                      >
                        Confirm Decision
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilisationPage;
