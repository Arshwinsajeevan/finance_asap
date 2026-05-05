import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Check, X, Eye, Clock, Send } from 'lucide-react';

interface Requisition {
  id: string;
  purpose: string;
  description?: string;
  amount: number;
  approvedAmount?: number;
  releasedAmount?: number;
  status: 'PENDING' | 'APPROVED' | 'FUNDS_RELEASED' | 'UTILISATION_PENDING' | 'REJECTED' | 'COMPLETED';
  vertical: string;
  financialYear: string;
  createdAt: string;
  rejectionNote?: string;
  documentUrl?: string;
  raisedBy: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedById?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    FUNDS_RELEASED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    UTILISATION_PENDING: 'bg-purple-50 text-purple-700 border-purple-200',
    COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const labels: Record<string, string> = {
    PENDING: 'Pending Approval',
    APPROVED: 'Approved',
    FUNDS_RELEASED: 'Funds Released',
    REJECTED: 'Rejected',
    UTILISATION_PENDING: 'Awaiting Utilisation',
    COMPLETED: 'Completed'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
};

const RequisitionsPage: React.FC = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'APPROVE', 'REJECT', 'RELEASE', 'DETAILS'
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  
  // Form state
  const [amount, setAmount] = useState('');
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

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      if (modalType === 'APPROVE') {
        await api.patch(`/finance/requisitions/${selectedReq.id}/approve`, {
          approvedAmount: Number(amount) || selectedReq.amount
        });
      } else if (modalType === 'REJECT') {
        await api.patch(`/finance/requisitions/${selectedReq.id}/reject`, {
          rejectionNote: note
        });
      } else if (modalType === 'RELEASE') {
        await api.patch(`/finance/requisitions/${selectedReq.id}/release`, {
          releasedAmount: selectedReq.approvedAmount || selectedReq.amount
        });
      }
      
      setShowModal(false);
      fetchRequisitions();
    } catch (err: any) {
      alert('Action failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const openModal = (type: string, req: Requisition) => {
    setModalType(type);
    setSelectedReq(req);
    setAmount(req ? (type === 'APPROVE' ? req.amount.toString() : (req.approvedAmount?.toString() || '')) : '');
    setNote('');
    setShowModal(true);
  };

  const filteredData = filter === 'ALL' 
    ? requisitions 
    : requisitions.filter(r => r.status === filter);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Requisitions Management</h2>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and release funds for departmental requests</p>
        </div>
      </div>

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl overflow-x-auto">
          <div className="flex space-x-2 shrink-0">
            {['ALL', 'PENDING', 'APPROVED', 'FUNDS_RELEASED', 'UTILISATION_PENDING', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === status 
                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Requisition Details</th>
                <th className="px-6 py-4 font-semibold text-right">Requested</th>
                <th className="px-6 py-4 font-semibold text-right">Approved</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No requisitions found matching the filter</td></tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.purpose}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded mr-2 font-medium">{req.vertical}</span>
                        <span>• FY {req.financialYear}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary-700">
                      {req.approvedAmount ? formatCurrency(req.approvedAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button 
                          onClick={() => openModal('DETAILS', req)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {user?.role === 'FINANCE_OFFICER' && (
                          <>
                            {req.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => openModal('APPROVE', req)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors shadow-sm"
                                  title="Approve Requisition"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => openModal('REJECT', req)}
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors shadow-sm"
                                  title="Reject Requisition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {req.status === 'APPROVED' && (
                              <button 
                                onClick={() => openModal('RELEASE', req)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                                title="Release Funds"
                              >
                                <Send className="w-3 h-3 mr-1.5" /> Release Funds
                              </button>
                            )}
                            {(req.status === 'FUNDS_RELEASED' || req.status === 'UTILISATION_PENDING') && (
                              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Funds Released</span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-50 px-2 py-1 rounded">Rejected</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {showModal && selectedReq && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 ${
            modalType === 'DETAILS' ? 'max-w-2xl' : 'max-w-lg'
          }`}>
            
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              modalType === 'APPROVE' ? 'bg-emerald-50 border-emerald-100' : 
              modalType === 'REJECT' ? 'bg-red-50 border-red-100' :
              modalType === 'RELEASE' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'
            }`}>
              <h3 className={`font-semibold ${
                modalType === 'APPROVE' ? 'text-emerald-800' : 
                modalType === 'REJECT' ? 'text-red-800' : 
                modalType === 'RELEASE' ? 'text-blue-800' : 'text-slate-800'
              }`}>
                {modalType === 'APPROVE' && 'Approve Requisition'}
                {modalType === 'REJECT' && 'Reject Requisition'}
                {modalType === 'RELEASE' && 'Release Funds'}
                {modalType === 'DETAILS' && 'Requisition Details'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              {modalType === 'DETAILS' ? (
                <div className="space-y-6 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Vertical</p>
                      <p className="font-medium text-slate-800">{selectedReq.vertical}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Submitted On</p>
                      <p className="font-medium text-slate-800">{formatDate(selectedReq.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Purpose</p>
                    <p className="text-sm text-slate-800 font-medium">{selectedReq.purpose}</p>
                    {selectedReq.description && <p className="text-sm text-slate-600 mt-2">{selectedReq.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Requested Amount</p>
                      <p className="text-lg font-bold text-slate-800">{formatCurrency(selectedReq.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Approved Amount</p>
                      <p className="text-lg font-bold text-primary-600">{selectedReq.approvedAmount ? formatCurrency(selectedReq.approvedAmount) : '-'}</p>
                    </div>
                  </div>

                  {/* Sanction Document Viewer */}
                  {selectedReq.documentUrl && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs text-slate-500 uppercase font-semibold mb-2">Sanction Document / Request Paper</h4>
                      <div className="aspect-video bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                        <iframe 
                          src={selectedReq.documentUrl} 
                          className="w-full h-full border-none min-h-[220px]"
                          title="Sanction Document"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <a 
                            href={selectedReq.documentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 shadow-sm flex items-center transition-colors"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs text-slate-500 uppercase font-semibold mb-3">Processing Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mr-3"><Check className="w-3 h-3" /></div>
                        <span className="text-slate-600">Submitted by <span className="font-medium">{selectedReq.raisedBy.name}</span></span>
                      </div>
                      <div className={`flex items-center text-sm ${selectedReq.status !== 'PENDING' ? '' : 'opacity-40'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${selectedReq.status === 'REJECTED' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                          {selectedReq.status === 'REJECTED' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-slate-600">
                          {selectedReq.status === 'REJECTED' ? 'Rejected' : selectedReq.approvedById ? 'Approved' : 'Awaiting Approval'}
                        </span>
                      </div>
                      <div className={`flex items-center text-sm ${['UTILISATION_PENDING', 'COMPLETED', 'FUNDS_RELEASED'].includes(selectedReq.status) ? '' : 'opacity-40'}`}>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mr-3"><Send className="w-3 h-3" /></div>
                        <span className="text-slate-600">Funds Released</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedReq.status === 'REJECTED' && selectedReq.rejectionNote && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-4">
                      <p className="text-xs text-red-600 font-bold uppercase mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-800">{selectedReq.rejectionNote}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAction} className="space-y-5">
                  {modalType === 'APPROVE' && (
                    <>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Requested Amount</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(selectedReq.amount)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Approved Amount (₹)</label>
                        <input 
                          type="number" required min="1" max={selectedReq.amount} value={amount} onChange={e => setAmount(e.target.value)}
                          className="input-field text-lg"
                        />
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center"><Clock className="w-3 h-3 mr-1"/> You can approve a partial amount.</p>
                      </div>
                    </>
                  )}

                  {modalType === 'REJECT' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Rejection Reason</label>
                      <textarea 
                        required value={note} onChange={e => setNote(e.target.value)}
                        className="input-field min-h-[120px] resize-none" placeholder="Explain why this request is being rejected..."
                      />
                    </div>
                  )}

                  {modalType === 'RELEASE' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <p className="text-sm text-blue-600 font-semibold mb-1">Amount to Release</p>
                        <p className="text-3xl font-bold text-blue-800">{formatCurrency(selectedReq.approvedAmount || selectedReq.amount)}</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800">
                        <strong>Warning:</strong> This will deduct the amount from the {selectedReq.vertical} budget and mark the status as Awaiting Utilisation.
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex space-x-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold transition-all shadow-sm ${
                      modalType === 'REJECT' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 
                      modalType === 'RELEASE' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' :
                      'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}>
                      {modalType === 'APPROVE' && 'Confirm Approval'}
                      {modalType === 'REJECT' && 'Confirm Rejection'}
                      {modalType === 'RELEASE' && 'Confirm Release'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionsPage;
