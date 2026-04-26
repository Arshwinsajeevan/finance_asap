import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Check, X, Search, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    FUNDS_RELEASED: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const RequisitionsPage = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'APPROVE', 'REJECT', 'CREATE'
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/finance/requisitions');
      setRequisitions(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'APPROVE') {
        await api.patch(`/finance/requisitions/${selectedReq.id}/approve`, {
          approvedAmount: Number(amount) || selectedReq.amount
        });
      } else if (modalType === 'REJECT') {
        await api.patch(`/finance/requisitions/${selectedReq.id}/reject`, {
          rejectionNote: note
        });
      } else if (modalType === 'CREATE') {
        await api.post('/finance/requisitions', {
          vertical: user.vertical,
          amount: Number(amount),
          purpose,
          financialYear: '2025-26', // hardcoded for demo
          description: note
        });
      }
      
      setShowModal(false);
      fetchRequisitions();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const openModal = (type, req = null) => {
    setModalType(type);
    setSelectedReq(req);
    setAmount(req ? req.amount : '');
    setPurpose('');
    setNote('');
    setShowModal(true);
  };

  const filteredData = filter === 'ALL' 
    ? requisitions 
    : requisitions.filter(r => r.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Requisitions</h2>
          <p className="text-sm text-slate-500 mt-1">Manage budget requests from verticals</p>
        </div>
        
        {user.role === 'VERTICAL_USER' && (
          <button 
            onClick={() => openModal('CREATE')}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Requisition
          </button>
        )}
      </div>

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
          <div className="flex space-x-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'FUNDS_RELEASED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === status 
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search requisitions..." 
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Purpose & Vertical</th>
                <th className="px-6 py-4 font-semibold text-right">Requested</th>
                <th className="px-6 py-4 font-semibold text-right">Approved</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No requisitions found</td></tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{req.purpose}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <span className="font-medium text-slate-700 mr-2">{req.vertical}</span>
                        <span>• FY {req.financialYear}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-primary-700">
                      {req.approvedAmount ? `₹${req.approvedAmount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'FINANCE_OFFICER' && req.status === 'PENDING' ? (
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => openModal('APPROVE', req)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openModal('REJECT', req)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button className="text-slate-400 hover:text-primary-600 font-medium text-xs underline">
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

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">
                {modalType === 'APPROVE' && 'Approve Requisition'}
                {modalType === 'REJECT' && 'Reject Requisition'}
                {modalType === 'CREATE' && 'Raise New Requisition'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAction} className="p-6 space-y-4">
              {modalType === 'CREATE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                    <input 
                      type="text" required value={purpose} onChange={e => setPurpose(e.target.value)}
                      className="input-field" placeholder="e.g. Server Infrastructure"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Requested Amount (₹)</label>
                    <input 
                      type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)}
                      className="input-field" placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={note} onChange={e => setNote(e.target.value)}
                      className="input-field min-h-[100px]" placeholder="Additional details..."
                    />
                  </div>
                </>
              )}

              {modalType === 'APPROVE' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800">
                    <p className="font-medium">Requested: ₹{selectedReq?.amount.toLocaleString('en-IN')}</p>
                    <p className="mt-1">For: {selectedReq?.purpose}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₹)</label>
                    <input 
                      type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs text-slate-500 mt-1">You can approve a partial amount.</p>
                  </div>
                </>
              )}

              {modalType === 'REJECT' && (
                <>
                  <div className="bg-red-50 p-4 rounded-lg mb-4 text-sm text-red-800">
                    <p className="font-medium">Rejecting: {selectedReq?.purpose}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
                    <textarea 
                      required value={note} onChange={e => setNote(e.target.value)}
                      className="input-field min-h-[100px]" placeholder="Please provide a reason for rejection..."
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                  modalType === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
                }`}>
                  {modalType === 'CREATE' ? 'Submit' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionsPage;
