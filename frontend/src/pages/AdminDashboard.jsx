import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight,
  ChevronRight,
  Download
} from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="card-premium p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-2xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await api.get('/finance/reports/overview');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch admin dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Admin Dashboard...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Error loading dashboard</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Oversight</h2>
          <p className="text-slate-500 mt-1 font-medium">Financial Monitoring & Analytics Platform</p>
        </div>
        <button className="flex items-center px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
          <Download className="w-4 h-4 mr-2" />
          Generate Annual Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Budget" 
          value={formatCurrency(data.stats.totalFunds)} 
          subtext="Allocated for FY 2025-26"
          icon={BarChart3} 
          colorClass="bg-blue-50 text-blue-600"
        />
        <MetricCard 
          title="System Utilisation" 
          value={`${Math.round((data.stats.fundsSpent / data.stats.totalFunds) * 100)}%`}
          subtext="Total expenditure vs budget"
          icon={TrendingUp} 
          colorClass="bg-orange-50 text-accent"
        />
        <MetricCard 
          title="Active Requisitions" 
          value={data.stats.pendingRequisitions} 
          subtext="Pending officer approval"
          icon={AlertCircle} 
          colorClass="bg-red-50 text-red-600"
        />
        <MetricCard 
          title="Donor Contributions" 
          value={formatCurrency(data.stats.donorFunds)} 
          subtext="Total external sponsorships"
          icon={ShieldCheck} 
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity Ledger */}
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-primary-500" />
                Global Transaction Ledger
              </h3>
              <button className="text-sm font-bold text-primary-600 hover:text-primary-700">Audit All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Transaction</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Vertical</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{tx.transactionType.replace('_', ' ')}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold">{tx.source}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="inline-flex items-center text-emerald-600 text-xs font-bold">
                           <ShieldCheck className="w-3 h-3 mr-1" />
                           Verified
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium p-6 bg-primary-600 text-white">
            <h3 className="text-lg font-bold mb-4">Financial Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 opacity-90">
                  <span>Budget Utilisation</span>
                  <span>{Math.round((data.stats.fundsSpent / data.stats.totalFunds) * 100)}%</span>
                </div>
                <div className="w-full bg-primary-700/50 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full shadow-sm" style={{ width: `${Math.round((data.stats.fundsSpent / data.stats.totalFunds) * 100)}%` }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-primary-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Total Transactions</span>
                  <span className="text-xl font-bold">{data.stats.totalTransactions}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-bold text-slate-800 mb-4">Vertical Performance</h3>
            <div className="space-y-4">
              {['TRAINING', 'CSP', 'SDC'].map((v) => (
                <div key={v} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mr-3"></div>
                    <span className="text-sm font-bold text-slate-600">{v}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
