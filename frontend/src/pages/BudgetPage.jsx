import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, PieChart, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';

const BudgetPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState('2025-26');

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/finance/budget/utilisation?financialYear=${financialYear}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [financialYear]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!data) return <div>No budget data available</div>;

  const { summary, byVertical } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Budget & Allocations</h2>
          <p className="text-sm text-slate-500 mt-1">Track financial resources across all verticals</p>
        </div>
        
        <select 
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="2025-26">FY 2025-26</option>
          <option value="2026-27">FY 2026-27</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Budget</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalAllocated)}</p>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-orange-50 text-accent rounded-lg">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Used</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalUsed)}</p>
          <p className="text-xs text-slate-500 mt-1">{Math.round((summary.totalUsed / summary.totalAllocated) * 100) || 0}% of allocated</p>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Available Balance</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalRemaining)}</p>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Released</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalReleased)}</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Vertical Allocations</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {byVertical.map((budget) => (
          <div key={budget.vertical} className="card-premium p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{budget.vertical}</h4>
                <p className="text-xs font-medium text-slate-500">FY {budget.financialYear}</p>
              </div>
              {budget.isOverExhausted && (
                <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Over Exhausted
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Used</span>
              <span className="font-semibold text-slate-800">{formatCurrency(budget.used)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${budget.isOverExhausted ? 'bg-red-500' : 'bg-primary-500'}`} 
                style={{ width: `${Math.min(budget.utilizationPercent, 100)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 uppercase">Allocated</p>
                <p className="font-semibold text-slate-800">{formatCurrency(budget.allocated)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Remaining</p>
                <p className={`font-semibold ${budget.isOverExhausted ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(budget.remaining)}
                </p>
              </div>
            </div>
            {user.role === 'FINANCE_OFFICER' && (
              <div className="mt-4 flex justify-end">
                 <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">Manage Allocation</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetPage;
