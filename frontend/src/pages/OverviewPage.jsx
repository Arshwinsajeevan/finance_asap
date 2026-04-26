import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IndianRupee, FileText, PieChart, Clock, ArrowRightLeft, CreditCard } from 'lucide-react';

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

    if (user?.role === 'FINANCE_OFFICER' || user?.role === 'ADMIN') {
      fetchOverview();
    }
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
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">{status}</span>;
      case 'FAILED':
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{status}</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#00B4D8] to-[#FF6900] rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-wider uppercase mb-1 opacity-80">
            {user?.role === 'ADMIN' ? 'Admin Panel' : 'Finance Officer Portal'}
          </div>
          <h2 className="text-3xl font-bold mb-2">Finance Management Dashboard</h2>
          <p className="text-white/90 text-sm max-w-2xl">
            Manage funds, track budgets and control financial operations centrally across all ASAP Kerala verticals.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Budget" 
          value={formatCurrency(data.stats.totalFunds)} 
          icon={IndianRupee} 
          colorClass="bg-blue-50 text-[#00B4D8]"
        />
        <StatCard 
          title="Funds Spent" 
          value={formatCurrency(data.stats.fundsSpent)} 
          icon={PieChart} 
          colorClass="bg-orange-50 text-[#FF6900]"
        />
        <StatCard 
          title="Remaining Balance" 
          value={formatCurrency(data.stats.fundsRemaining)} 
          icon={CreditCard} 
          colorClass="bg-green-50 text-green-600"
        />
        <StatCard 
          title="Pending Requests" 
          value={data.stats.pendingRequisitions} 
          icon={Clock} 
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Table */}
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-sm font-medium text-[#00B4D8] hover:text-[#0096B7] transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-3 font-semibold">Type & Source</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-gray-900">{tx.transactionType.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 mt-1">{tx.source}</div>
                    </td>
                    <td className="py-4 text-gray-600">{tx.description}</td>
                    <td className="py-4 text-right font-bold text-gray-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
                {data.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">No recent transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="card-premium p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="flex-1 flex flex-col gap-4">
            
            {user.role === 'FINANCE_OFFICER' && (
              <>
                <button 
                  onClick={() => navigate('/requisitions')}
                  className="flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#00B4D8] flex items-center justify-center mr-4 group-hover:bg-[#00B4D8] group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Review Requisitions</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{data.stats.pendingRequisitions} pending approvals</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/transactions')}
                  className="flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Record Transaction</h4>
                    <p className="text-sm text-gray-500 mt-0.5">Add a manual entry</p>
                  </div>
                </button>
              </>
            )}

            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF6900] flex items-center justify-center mr-4 group-hover:bg-[#FF6900] group-hover:text-white transition-colors">
                <PieChart className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Financial Reports</h4>
                <p className="text-sm text-gray-500 mt-0.5">Annual & Vertical reports</p>
              </div>
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewPage;
