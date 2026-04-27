import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IndianRupee, FileText, PieChart, Clock, ArrowRightLeft, Landmark, TrendingUp, TrendingDown, FileCheck } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="card-premium p-5 xl:p-6 flex items-center justify-between group cursor-default">
    <div className="pr-2">
      <p className="text-xs xl:text-sm font-semibold text-gray-500 mb-1">{title}</p>
      <h3 className="text-xl xl:text-2xl font-bold text-gray-900 group-hover:text-[#00B4D8] transition-colors whitespace-nowrap">{value}</h3>
    </div>
    <div className={`p-2.5 xl:p-3 rounded-full shrink-0 flex items-center justify-center ${colorClass}`}>
      <Icon className="w-5 h-5 xl:w-6 xl:h-6" />
    </div>
  </div>
);

const OverviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get('/finance/reports/overview');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch overview data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
      case 'APPROVED':
      case 'PAID':
        return <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-green-100 text-green-700">{status}</span>;
      case 'FAILED':
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-red-100 text-red-700">{status}</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-orange-100 text-orange-700">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-500 font-medium">Loading Dashboard Data...</div>;
  }

  if (!data) return <div className="text-center p-8 text-slate-500">No data available</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner */}
      <div className={`rounded-2xl p-8 text-white shadow-md relative overflow-hidden ${user?.role === 'ADMIN' ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-[#00B4D8] to-[#FF6900]'}`}>
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-wider uppercase mb-1 opacity-80">
            {user?.role === 'ADMIN' ? 'Admin Oversight Panel' : 'Finance Officer Portal'}
          </div>
          <h2 className="text-3xl font-bold mb-2">Finance Management Dashboard</h2>
          <p className="text-white/90 text-sm max-w-2xl">
            {user?.role === 'ADMIN' 
              ? 'High-level monitoring and audit view of all financial operations across ASAP Kerala.' 
              : 'Manage funds, track budgets and control financial operations centrally.'}
          </p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Budget (Allocated)" 
          value={formatCurrency(data.stats.totalBudget)} 
          icon={IndianRupee} 
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Total Income" 
          value={formatCurrency(data.stats.totalIncome)} 
          icon={TrendingUp} 
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(data.stats.totalExpenses)} 
          icon={TrendingDown} 
          colorClass="bg-red-50 text-red-600"
        />
        <StatCard 
          title="Net Balance" 
          value={formatCurrency(data.stats.netBalance)} 
          icon={Landmark} 
          colorClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-6 flex items-center border-l-4 border-amber-500 bg-amber-50/20">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl mr-4"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Requisitions</p>
            <h3 className="text-2xl font-bold text-slate-800">{data.stats.pendingRequisitions} <span className="text-sm text-slate-500 font-medium ml-1">awaiting approval</span></h3>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center border-l-4 border-purple-500 bg-purple-50/20">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl mr-4"><FileCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Utilisations</p>
            <h3 className="text-2xl font-bold text-slate-800">{data.stats.pendingUtilisation} <span className="text-sm text-slate-500 font-medium ml-1">awaiting verification</span></h3>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className={`grid grid-cols-1 gap-8 ${user?.role === 'FINANCE_OFFICER' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        
        {/* Left Column: Table */}
        <div className={`${user?.role === 'FINANCE_OFFICER' ? 'lg:col-span-2' : ''} card-premium p-6`}>
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Recent Ledger Activity</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-sm font-bold text-[#00B4D8] hover:text-[#0096B7] transition-colors"
            >
              View Full Ledger →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 font-bold tracking-wider">
                  <th className="px-4 py-3">Type & Source</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{tx.transactionType.replace('_', ' ')}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{tx.source}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{tx.description}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-800">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
                {data.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No recent transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Actions (ONLY for Finance Officer) */}
        {user?.role === 'FINANCE_OFFICER' && (
          <div className="card-premium p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Quick Actions</h3>
            <div className="flex-1 flex flex-col gap-4">
              
              <button 
                onClick={() => navigate('/requisitions')}
                className="flex items-center p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 text-sm">Review Requisitions</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{data.stats.pendingRequisitions} pending approvals</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/utilisations')}
                className="flex items-center p-4 rounded-xl bg-white border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 text-sm">Verify Utilisations</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{data.stats.pendingUtilisation} pending verifications</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/reports')}
                className="flex items-center p-4 rounded-xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm transition-all group mt-auto"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <PieChart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 text-sm">Financial Reports</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Annual & Vertical reports</p>
                </div>
              </button>
              
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OverviewPage;
