import React, { useState, useEffect } from 'react';
import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';
import { Search, Download } from 'lucide-react';

interface Transaction {
  id: string;
  transactionType: string;
  source: string;
  amount: number;
  description?: string;
  status: string;
  reference?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface TransactionSummary {
  totals: {
    _sum: { amount: number | null };
    _count: number;
  };
  byType: Array<{
    transactionType: string;
    _sum: { amount: number | null };
  }>;
}

const TransactionsPage: React.FC = () => {
  // const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.append('type', typeFilter);
      if (sourceFilter) queryParams.append('source', sourceFilter);
      if (searchQuery) queryParams.append('search', searchQuery);
      
      const [txRes, summaryRes] = await Promise.all([
        api.get(`/finance/transactions?${queryParams.toString()}`),
        api.get('/finance/transactions/summary')
      ]);
      
      setTransactions(txRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err: any) {
      console.error('Fetch Transactions Error:', err);
      alert('Failed to load transactions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [typeFilter, sourceFilter, searchQuery]);


  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Source', 'Description', 'Amount', 'Status', 'Reference'];
    const rows = transactions.map(tx => [
      new Date(tx.createdAt).toLocaleDateString('en-IN'),
      tx.transactionType,
      tx.source,
      tx.description || '',
      tx.amount.toString(),
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
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
                  <p className="text-sm font-bold text-primary-600">{formatCurrency(type._sum.amount || 0)}</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No transactions found</td></tr>
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


    </div>
  );
};

export default TransactionsPage;
