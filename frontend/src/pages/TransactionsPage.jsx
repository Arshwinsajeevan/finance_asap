import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, Download, Plus, X } from 'lucide-react';

const TransactionsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    amount: '', transactionType: 'EXPENSE', source: 'SECRETARIAT', description: '', reference: ''
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.append('type', typeFilter);
      if (sourceFilter) queryParams.append('source', sourceFilter);
      
      const [txRes, summaryRes] = await Promise.all([
        api.get(`/finance/transactions?${queryParams.toString()}`),
        api.get('/finance/transactions/summary')
      ]);
      
      setTransactions(txRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, sourceFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/transactions', {
        ...formData,
        amount: Number(formData.amount),
      });
      setShowModal(false);
      setFormData({ amount: '', transactionType: 'EXPENSE', source: 'SECRETARIAT', description: '', reference: '' });
      fetchTransactions();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Source', 'Description', 'Amount', 'Status', 'Reference'];
    const rows = transactions.map(tx => [
      new Date(tx.createdAt).toLocaleDateString('en-IN'),
      tx.transactionType,
      tx.source,
      tx.description || '',
      tx.amount,
      tx.status,
      tx.reference || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Transactions</h2>
          <p className="text-sm text-slate-500 mt-1">Unified ledger for all financial movements</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          {user.role === 'FINANCE_OFFICER' && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Transaction
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Volume</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.amount || 0)}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 mb-1">Transactions</p>
              <h3 className="text-xl font-semibold text-slate-700">{summary.totals._count}</h3>
            </div>
          </div>
          
          <div className="card-premium p-5 md:col-span-2">
            <p className="text-sm font-medium text-slate-500 mb-3">By Transaction Type</p>
            <div className="flex space-x-6 overflow-x-auto pb-2">
              {summary.byType.map((type) => (
                <div key={type.transactionType} className="min-w-fit">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{type.transactionType.replace('_', ' ')}</p>
                  <p className="text-sm font-bold text-primary-600">{formatCurrency(type._sum.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 rounded-t-xl">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search description or reference..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="STUDENT_PAYMENT">Student Payment</option>
                <option value="DONOR_FUND">Donor Fund</option>
                <option value="SALARY">Salary</option>
                <option value="EXPENSE">Expense</option>
                <option value="FUND_RELEASE">Fund Release</option>
              </select>
              
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500"
              >
                <option value="">All Sources</option>
                <option value="TRAINING">Training</option>
                <option value="CSP">CSP</option>
                <option value="SDC">SDC</option>
                <option value="FUND_RAISING">Fund Raising</option>
                <option value="TBB">TBB</option>
                <option value="SECRETARIAT">Secretariat</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & ID</th>
                <th className="px-6 py-4 font-semibold">Type & Source</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No transactions found</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{formatDate(tx.createdAt)}</div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {tx.reference || tx.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{tx.transactionType.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-500 mt-1">{tx.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 line-clamp-2">{tx.description || '-'}</div>
                      {tx.user && (
                        <div className="text-xs text-slate-400 mt-1">User: {tx.user.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className={`font-semibold ${tx.transactionType === 'EXPENSE' || tx.transactionType === 'SALARY' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tx.transactionType === 'EXPENSE' || tx.transactionType === 'SALARY' ? '-' : '+'}
                        {formatCurrency(tx.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        tx.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Record New Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                <select 
                  value={formData.transactionType} 
                  onChange={e => setFormData({...formData, transactionType: e.target.value})}
                  className="input-field"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="STUDENT_PAYMENT">Student Payment</option>
                  <option value="DONOR_FUND">Donor Fund</option>
                  <option value="FUND_RELEASE">Fund Release</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Vertical</label>
                <select 
                  value={formData.source}
                  onChange={e => setFormData({...formData, source: e.target.value})}
                  className="input-field"
                >
                  <option value="SECRETARIAT">Secretariat</option>
                  <option value="TRAINING">Training</option>
                  <option value="CSP">CSP</option>
                  <option value="SDC">SDC</option>
                  <option value="FUND_RAISING">Fund Raising</option>
                  <option value="TBB">TBB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" required min="1" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="input-field" placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="input-field min-h-[80px]" placeholder="Transaction details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (optional)</label>
                <input 
                  type="text"
                  value={formData.reference}
                  onChange={e => setFormData({...formData, reference: e.target.value})}
                  className="input-field" placeholder="e.g. INV-2025-001"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
