import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, Building2, User, Globe2, Plus, X } from 'lucide-react';

const DonorFundsPage = () => {
  const { user } = useAuth();
  const [funds, setFunds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    donorName: '', donorType: 'INDIVIDUAL', amount: '',
    vertical: '', project: '', purpose: '', reference: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fundsRes, sumRes] = await Promise.all([
        api.get('/finance/donors'),
        api.get('/finance/donors/summary')
      ]);
      setFunds(fundsRes.data.data);
      setSummary(sumRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        donorName: formData.donorName,
        donorType: formData.donorType,
        amount: Number(formData.amount),
      };
      if (formData.vertical) payload.vertical = formData.vertical;
      if (formData.project) payload.project = formData.project;
      if (formData.purpose) payload.purpose = formData.purpose;
      if (formData.reference) payload.reference = formData.reference;

      await api.post('/finance/donors', payload);
      setShowModal(false);
      setFormData({ donorName: '', donorType: 'INDIVIDUAL', amount: '', vertical: '', project: '', purpose: '', reference: '' });
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDonorIcon = (type) => {
    switch(type) {
      case 'CORPORATE': return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'GOVERNMENT': return <Globe2 className="w-5 h-5 text-emerald-500" />;
      case 'INDIVIDUAL': return <User className="w-5 h-5 text-blue-500" />;
      default: return <HeartHandshake className="w-5 h-5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Donor Funds</h2>
          <p className="text-sm text-slate-500 mt-1">Track sponsorships and external contributions</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Record Fund
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium p-6 col-span-1 md:col-span-2 flex items-center bg-gradient-to-br from-indigo-50 to-white">
            <div className="p-4 bg-indigo-100 rounded-2xl mr-6">
              <HeartHandshake className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800 mb-1">Total Funds Raised</p>
              <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(summary.totals._sum.amount || 0)}</h3>
              <p className="text-sm text-slate-500 mt-1">From {summary.totals._count} contributions</p>
            </div>
          </div>
          
          <div className="card-premium p-5 col-span-1 md:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">Contributions by Source</p>
            <div className="space-y-3">
              {summary.byType.map(type => (
                <div key={type.donorType} className="flex justify-between items-center">
                  <div className="flex items-center text-sm">
                    {getDonorIcon(type.donorType)}
                    <span className="ml-2 font-medium text-slate-600">{type.donorType}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(type._sum.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Donor Details</th>
              <th className="px-6 py-4 font-semibold">Purpose & Vertical</th>
              <th className="px-6 py-4 font-semibold">Date Received</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : funds.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-slate-500">No donor funds recorded yet</td></tr>
            ) : (
              funds.map((fund) => (
                <tr key={fund.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getDonorIcon(fund.donorType)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{fund.donorName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{fund.donorType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">{fund.purpose || 'General Fund'}</div>
                    {fund.vertical && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{fund.vertical}</span>
                        {fund.project && <span className="ml-2">• {fund.project}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(fund.receivedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-emerald-600 text-base">{formatCurrency(fund.amount)}</div>
                    {fund.reference && <div className="text-xs text-slate-400 mt-1">Ref: {fund.reference}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Donor Fund Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Record Donor Fund</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Donor Name</label>
                <input type="text" required value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} className="input-field" placeholder="e.g. Infosys Foundation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Donor Type</label>
                  <select value={formData.donorType} onChange={e => setFormData({...formData, donorType: e.target.value})} className="input-field">
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="GOVERNMENT">Government</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vertical (optional)</label>
                  <select value={formData.vertical} onChange={e => setFormData({...formData, vertical: e.target.value})} className="input-field">
                    <option value="">General</option>
                    <option value="TRAINING">Training</option>
                    <option value="CSP">CSP</option>
                    <option value="SDC">SDC</option>
                    <option value="FUND_RAISING">Fund Raising</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project (optional)</label>
                  <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="input-field" placeholder="e.g. Lab Setup" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="input-field" placeholder="e.g. Scholarship Fund" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (optional)</label>
                <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input-field" placeholder="e.g. DON-2025-001" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Record Fund</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorFundsPage;
