import React, { useState, useEffect } from 'react';
import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';
import { IndianRupee, PieChart, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';

interface Budget {
  id: string;
  vertical: string;
  allocated: number;
  used: number;
  released: number;
  financialYear: string;
}

interface BudgetSummary {
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  totalReleased: number;
}

interface BudgetData {
  summary: BudgetSummary;
  byVertical: Budget[];
}

interface ProcessedBudget extends Budget {
  allocatedAmount: number;
  usedAmount: number;
  remaining: number;
  usedPercentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  exceededAmount: number;
}

const BudgetPage: React.FC = () => {
  // const { user } = useAuth();
  const [data, setData] = useState<BudgetData | null>(null);
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

  const formatCurrency = (amount: number) => {
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

  const sortedVerticals: ProcessedBudget[] = [...byVertical].map(budget => {
    const allocatedAmount = budget.allocated || 0;
    const usedAmount = budget.used || 0;
    const remaining = allocatedAmount - usedAmount;
    const usedPercentage = allocatedAmount > 0 ? (usedAmount / allocatedAmount) * 100 : (usedAmount > 0 ? 100 : 0);
    const isOverBudget = usedAmount > allocatedAmount;
    const isNearLimit = usedPercentage >= 90 && !isOverBudget;
    const exceededAmount = isOverBudget ? usedAmount - allocatedAmount : 0;
    
    return {
      ...budget,
      allocatedAmount,
      usedAmount,
      remaining,
      usedPercentage,
      isOverBudget,
      isNearLimit,
      exceededAmount
    };
  }).sort((a, b) => b.usedPercentage - a.usedPercentage);

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-600';
    if (percentage > 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getBadgeStyle = (percentage: number) => {
    if (percentage > 100) return 'bg-red-100 text-red-700 border-red-200';
    if (percentage >= 90) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

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
        {sortedVerticals.map((budget) => (
          <div 
            key={budget.vertical} 
            className={`p-6 rounded-xl border shadow-sm transition-all duration-300 ${
              budget.isOverBudget 
                ? 'bg-red-50 border-red-500 shadow-red-100/50' 
                : 'bg-white border-slate-100 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{budget.vertical}</h4>
                <p className="text-xs font-medium text-slate-500">FY {budget.financialYear}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(budget.usedPercentage)}`}>
                {Math.round(budget.usedPercentage)}% Used
              </div>
            </div>

            {budget.isOverBudget && (
              <div className="mb-4 bg-white/60 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">Over Budget</p>
                  <p className="text-xs text-red-600 font-medium">Budget exceeded by {formatCurrency(budget.exceededAmount)}</p>
                </div>
              </div>
            )}
            
            {!budget.isOverBudget && budget.isNearLimit && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-yellow-700">Near Limit</p>
                  <p className="text-xs text-yellow-600 font-medium">Approaching maximum allocation</p>
                </div>
              </div>
            )}

            <div className="flex justify-between text-sm mb-1.5 mt-2">
              <span className="font-medium text-slate-600">Utilization</span>
              {budget.usedPercentage > 100 && (
                <span className="text-xs font-bold text-red-600">+{Math.round(budget.usedPercentage - 100)}% over</span>
              )}
            </div>
            
            <div className="w-full bg-slate-200/60 rounded-full h-2.5 mb-5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ${getProgressBarColor(budget.usedPercentage)}`} 
                style={{ width: `${Math.min(budget.usedPercentage, 100)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Allocated</p>
                <p className="font-bold text-slate-800 text-sm">{formatCurrency(budget.allocatedAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Used</p>
                <p className="font-bold text-slate-800 text-sm">{formatCurrency(budget.usedAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Remaining</p>
                <p className={`font-bold text-sm ${budget.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {budget.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(budget.remaining))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetPage;
