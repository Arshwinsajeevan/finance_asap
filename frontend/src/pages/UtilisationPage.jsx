import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, FileText, CheckCircle2, XCircle, Plus, X } from 'lucide-react';

const UtilisationPage = () => {
  const { user } = useAuth();
  const [utilisations, setUtilisations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState([]); // For the dropdown when submitting

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedUtilisation, setSelectedUtilisation] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    requisitionId: '', amount: '', description: '', billNo: ''
  });
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [rejectionNote, setRejectionNote] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [utRes, sumRes] = await Promise.all([
        api.get('/finance/utilisations'),
        api.get('/finance/utilisations/summary')
      ]);
      setUtilisations(utRes.data.data);
      setSummary(sumRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequisitions = async () => {
    try {
      const res = await api.get('/finance/requisitions');
      // Filter only FUNDS_RELEASED requisitions
      const released = res.data.data.filter(r => r.status === 'FUNDS_RELEASED');
      // If vertical user, filter their own (backend might already do this but just to be sure)
      const allowed = user.role === 'VERTICAL_USER' ? released.filter(r => r.vertical === user.vertical) : released;
      setRequisitions(allowed);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    if (user.role === 'VERTICAL_USER' || user.role === 'FINANCE_OFFICER') {
      fetchRequisitions();
    }
  }, [user.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/utilisations', {
        ...formData,
        amount: Number(formData.amount)
      });
      setShowSubmitModal(false);
      setFormData({ requisitionId: '', amount: '', description: '', billNo: '' });
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/finance/utilisations/${selectedUtilisation.id}/verify`, {
        status: verifyStatus,
        rejectionNote: verifyStatus === 'REJECTED' ? rejectionNote : undefined
      });
      setShowVerifyModal(false);
      setVerifyStatus('VERIFIED');
      setRejectionNote('');
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openVerifyModal = (utilisation) => {
    setSelectedUtilisation(utilisation);
    setVerifyStatus('VERIFIED');
    setRejectionNote('');
    setShowVerifyModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Utilisation Reports</h2>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === 'VERTICAL_USER' 
              ? 'Submit and track expense bills against released funds' 
              : 'Review and verify vertical expense submissions'}
          </p>
        </div>
        {(user.role === 'VERTICAL_USER' || user.role === 'FINANCE_OFFICER') && (
          <button onClick={() => setShowSubmitModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Submit Expense
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium p-5 col-span-1 md:col-span-2 flex items-center bg-blue-50/50">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Utilisation Submitted</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.amount || 0)}</h3>
            </div>
          </div>
          <div className="card-premium p-5 col-span-1 md:col-span-2 flex flex-col justify-center border-l-4 border-l-amber-500">
            <p className="text-sm font-medium text-slate-500 mb-2">Submissions by Status</p>
            <div className="flex space-x-6">
              {summary.byStatus.map(s => (
                <div key={s.status}>
                  <p className="text-xs text-slate-400">{s.status}</p>
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(s._sum.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Expense Details</th>
                <th className="px-6 py-4 font-semibold">Requisition Link</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : utilisations.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No utilisation reports submitted yet</td></tr>
              ) : (
                utilisations.map((util) => (
                  <tr key={util.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{util.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Bill: {util.billNo || 'N/A'} • By: {util.submittedBy.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 line-clamp-1">{util.requisition?.purpose}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{util.vertical}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      {formatCurrency(util.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        {getStatusBadge(util.status)}
                        {util.status === 'REJECTED' && util.rejectionNote && (
                          <span className="text-[10px] text-red-500 mt-1 line-clamp-1 max-w-[120px]" title={util.rejectionNote}>
                            {util.rejectionNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'FINANCE_OFFICER' && util.status === 'PENDING' ? (
                        <button 
                          onClick={() => openVerifyModal(util)}
                          className="flex items-center mx-auto px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors"
                        >
                          Verify/Reject
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {util.status === 'PENDING' ? 'Awaiting Verification' : `Verified by ${util.verifiedBy?.name || 'Admin'}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Utilisation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Submit Expense Detail</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Requisition</label>
                <select required value={formData.requisitionId} onChange={e => setFormData({...formData, requisitionId: e.target.value})} className="input-field">
                  <option value="">-- Choose Released Requisition --</option>
                  {requisitions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.purpose} ({formatCurrency(r.releasedAmount)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Description</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" placeholder="e.g. Purchased 10 Monitors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount Spent (₹)</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bill / Invoice No.</label>
                  <input type="text" value={formData.billNo} onChange={e => setFormData({...formData, billNo: e.target.value})} className="input-field" placeholder="Optional" />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-semibold text-blue-800">Verify Utilisation</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-blue-400 hover:text-blue-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleVerify} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm text-slate-800 border border-slate-200">
                <p className="font-medium text-slate-600 text-xs uppercase mb-1">Submission Details</p>
                <p className="font-medium">{selectedUtilisation?.description}</p>
                <p className="mt-1">Amount: <span className="font-bold">{formatCurrency(selectedUtilisation?.amount)}</span></p>
                <p className="mt-1">Bill No: {selectedUtilisation?.billNo || 'None provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="status" value="VERIFIED" checked={verifyStatus === 'VERIFIED'} onChange={() => setVerifyStatus('VERIFIED')} className="mr-2 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">Approve & Verify</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="status" value="REJECTED" checked={verifyStatus === 'REJECTED'} onChange={() => setVerifyStatus('REJECTED')} className="mr-2 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-red-700">Reject</span>
                  </label>
                </div>
              </div>

              {verifyStatus === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
                  <textarea required value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} className="input-field min-h-[80px]" placeholder="Explain why this expense is rejected..." />
                </div>
              )}

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowVerifyModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${verifyStatus === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilisationPage;
