import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Landmark, FileText, ShieldAlert, Plus, Calendar, X } from 'lucide-react';

const BankRecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    entryType: 'EMD', bankName: '', amount: '',
    description: '', reference: '', validUntil: '', status: 'ACTIVE'
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'ALL' ? '/finance/bank' : `/finance/bank?entryType=${activeTab}`;
      const res = await api.get(url);
      setRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entryType: formData.entryType,
        amount: Number(formData.amount),
      };
      if (formData.bankName) payload.bankName = formData.bankName;
      if (formData.description) payload.description = formData.description;
      if (formData.reference) payload.reference = formData.reference;
      if (formData.validUntil) payload.validUntil = new Date(formData.validUntil).toISOString();
      if (formData.status) payload.status = formData.status;

      await api.post('/finance/bank', payload);
      setShowModal(false);
      setFormData({ entryType: 'EMD', bankName: '', amount: '', description: '', reference: '', validUntil: '', status: 'ACTIVE' });
      fetchRecords();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPIRED': return 'bg-red-50 text-red-700 border-red-200';
      case 'RELEASED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FORFEITED': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Calculate summary stats from records
  const activeFDs = records.filter(r => r.entryType === 'FD' && r.status === 'ACTIVE');
  const activeGuarantees = records.filter(r => r.entryType === 'BANK_GUARANTEE' && r.status === 'ACTIVE');
  const activeEMDs = records.filter(r => r.entryType === 'EMD' && r.status === 'ACTIVE');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Bank & Guarantees</h2>
          <p className="text-sm text-slate-500 mt-1">Manage EMDs, Bank Guarantees, and Statements</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Record
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-premium p-5 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4"><Landmark className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active FDs</p>
            <h3 className="text-xl font-bold text-slate-800">{activeFDs.length} — {formatCurrency(activeFDs.reduce((s, r) => s + r.amount, 0))}</h3>
          </div>
        </div>
        <div className="card-premium p-5 flex items-center border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl mr-4"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Guarantees</p>
            <h3 className="text-xl font-bold text-slate-800">{activeGuarantees.length}</h3>
          </div>
        </div>
        <div className="card-premium p-5 flex items-center border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl mr-4"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active EMDs</p>
            <h3 className="text-xl font-bold text-slate-800">{activeEMDs.length}</h3>
          </div>
        </div>
      </div>

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex space-x-2">
            {['ALL', 'EMD', 'BANK_GUARANTEE', 'FD', 'STATEMENT'].map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === type 
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Type & Bank</th>
                <th className="px-6 py-4 font-semibold">Description / Ref</th>
                <th className="px-6 py-4 font-semibold">Validity</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No bank records found</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{record.entryType.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-500 mt-1">{record.bankName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{record.description}</div>
                      {record.reference && <div className="text-xs font-mono text-slate-400 mt-1">Ref: {record.reference}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {record.validUntil ? (
                        <div className="flex items-center text-slate-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          Till {new Date(record.validUntil).toLocaleDateString('en-IN')}
                        </div>
                      ) : <span className="text-slate-400 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Add Bank Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Entry Type</label>
                  <select value={formData.entryType} onChange={e => setFormData({...formData, entryType: e.target.value})} className="input-field">
                    <option value="EMD">EMD</option>
                    <option value="BANK_GUARANTEE">Bank Guarantee</option>
                    <option value="FD">Fixed Deposit</option>
                    <option value="STATEMENT">Statement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field">
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="RELEASED">Released</option>
                    <option value="FORFEITED">Forfeited</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="input-field" placeholder="e.g. SBI" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field min-h-[70px]" placeholder="Details about this record..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input-field" placeholder="e.g. BG-2025-01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valid Until</label>
                  <input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankRecordsPage;
