import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Wallet, Plus, Check, X, Eye, IndianRupee, FileText } from 'lucide-react';

interface PettyCashAccount {
  id: string;
  vertical: string;
  balance: number;
  allottedAmount: number;
  lastReplenishedAt: string | null;
}

interface PettyCashVoucher {
  id: string;
  amount: number;
  purpose: string;
  date: string;
  documentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionNote?: string;
  account: { vertical: string };
  submittedBy: { name: string; vertical: string };
  verifiedBy?: { name: string };
  createdAt: string;
}

const PettyCashPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PettyCashAccount[]>([]);
  const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [selectedVoucher, setSelectedVoucher] = useState<PettyCashVoucher | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  
  // Forms
  const [advanceForm, setAdvanceForm] = useState({ vertical: '', amount: '' });
  const [voucherForm, setVoucherForm] = useState({ amount: '', purpose: '', documentUrl: '' });
  const [actionNote, setActionNote] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, vouRes] = await Promise.all([
        api.get('/finance/petty-cash/accounts'),
        api.get('/finance/petty-cash/vouchers')
      ]);
      setAccounts(accRes.data.data);
      setVouchers(vouRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/petty-cash/advance', {
        vertical: advanceForm.vertical,
        amount: Number(advanceForm.amount)
      });
      alert('Advance issued successfully');
      setShowAdvanceModal(false);
      setAdvanceForm({ vertical: '', amount: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to issue advance');
    }
  };

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/petty-cash/vouchers', {
        amount: Number(voucherForm.amount),
        purpose: voucherForm.purpose,
        documentUrl: voucherForm.documentUrl || undefined
      });
      alert('Voucher submitted successfully');
      setShowVoucherModal(false);
      setVoucherForm({ amount: '', purpose: '', documentUrl: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit voucher');
    }
  };

  const handleActionVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;
    try {
      await api.patch(`/finance/petty-cash/vouchers/${selectedVoucher.id}/action`, {
        status: actionType,
        rejectionNote: actionType === 'REJECTED' ? actionNote : undefined
      });
      alert(`Voucher ${actionType.toLowerCase()} successfully`);
      setShowActionModal(false);
      setActionNote('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process voucher');
    }
  };

  const isFinance = user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Cash & Arrears Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage departmental petty cash, advances, and expense vouchers</p>
        </div>
        <div className="flex gap-3">
          {isFinance ? (
            <button 
              onClick={() => setShowAdvanceModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              Issue Advance
            </button>
          ) : (
            <button 
              onClick={() => setShowVoucherModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Voucher
            </button>
          )}
        </div>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full card p-6 text-center text-slate-500">No active petty cash accounts found.</div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="card-premium p-5 flex flex-col justify-between border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-600 tracking-wider mb-1">{acc.vertical}</p>
                  <p className="text-sm text-slate-500 font-medium">Available Balance</p>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">{formatCurrency(acc.balance)}</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Total Allotted: {formatCurrency(acc.allottedAmount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vouchers Table */}
      <div className="card-premium mt-6">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-400" />
            Recent Expense Vouchers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Purpose & Vertical</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading vouchers...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No vouchers found.</td></tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{v.purpose}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded mr-2 font-medium">
                          {v.account.vertical}
                        </span>
                        <span>by {v.submittedBy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(v.date)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {formatCurrency(v.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        v.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button 
                          onClick={() => { setSelectedVoucher(v); setShowDetailsModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isFinance && v.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => { setSelectedVoucher(v); setActionType('APPROVED'); setShowActionModal(true); }}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors shadow-sm"
                              title="Approve Voucher"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedVoucher(v); setActionType('REJECTED'); setShowActionModal(true); }}
                              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors shadow-sm"
                              title="Reject Voucher"
                            >
                              <X className="w-4 h-4" />
                            </button>
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

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Issue Petty Cash Advance</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleIssueAdvance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Vertical</label>
                <select 
                  required value={advanceForm.vertical} onChange={e => setAdvanceForm({...advanceForm, vertical: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select Department...</option>
                  <option value="TRAINING">TRAINING</option>
                  <option value="SDC">SDC</option>
                  <option value="CSP">CSP</option>
                  <option value="FUND_RAISING">FUND_RAISING</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" required min="1" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})}
                  className="input-field" placeholder="e.g. 10000"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="flex-1 py-2.5 border rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">Issue Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Submit Expense Voucher</h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose / Description</label>
                <input 
                  type="text" required value={voucherForm.purpose} onChange={e => setVoucherForm({...voucherForm, purpose: e.target.value})}
                  className="input-field" placeholder="e.g. Office tea and snacks"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Spent (₹)</label>
                <input 
                  type="number" required min="1" value={voucherForm.amount} onChange={e => setVoucherForm({...voucherForm, amount: e.target.value})}
                  className="input-field" placeholder="e.g. 500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proof Document URL (Optional)</label>
                <input 
                  type="url" value={voucherForm.documentUrl} onChange={e => setVoucherForm({...voucherForm, documentUrl: e.target.value})}
                  className="input-field" placeholder="https://..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowVoucherModal(false)} className="flex-1 py-2.5 border rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Submit Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject) */}
      {showActionModal && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${actionType === 'APPROVED' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${actionType === 'APPROVED' ? 'text-emerald-800' : 'text-red-800'}`}>
                {actionType === 'APPROVED' ? 'Approve Voucher' : 'Reject Voucher'}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleActionVoucher} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Voucher Details</p>
                <p className="font-semibold text-slate-800">{selectedVoucher.purpose}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(selectedVoucher.amount)}</p>
              </div>
              
              {actionType === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rejection Reason</label>
                  <textarea 
                    required value={actionNote} onChange={e => setActionNote(e.target.value)}
                    className="input-field min-h-[100px] resize-none" placeholder="Explain why..."
                  />
                </div>
              )}
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowActionModal(false)} className="flex-1 py-2.5 border rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className={`flex-1 py-2.5 text-white rounded-xl font-bold ${actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Voucher Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Vertical</p>
                  <p className="font-medium text-slate-800">{selectedVoucher.account.vertical}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Submitted By</p>
                  <p className="font-medium text-slate-800">{selectedVoucher.submittedBy.name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Purpose</p>
                <p className="text-sm text-slate-800 font-medium">{selectedVoucher.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Amount</p>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(selectedVoucher.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block mt-1 ${
                    selectedVoucher.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    selectedVoucher.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {selectedVoucher.status}
                  </span>
                </div>
              </div>

              {selectedVoucher.documentUrl && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs text-slate-500 uppercase font-semibold mb-2">Attached Bill / Proof</h4>
                  <div className="aspect-video bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col relative">
                    <iframe 
                      src={selectedVoucher.documentUrl} 
                      className="w-full h-full border-none min-h-[220px]"
                      title="Proof Document"
                    />
                    <div className="absolute bottom-2 right-2">
                      <a href={selectedVoucher.documentUrl} target="_blank" rel="noreferrer" className="bg-white px-3 py-1.5 rounded text-xs font-semibold shadow border">Open</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashPage;
