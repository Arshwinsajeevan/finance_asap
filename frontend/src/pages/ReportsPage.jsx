import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, TrendingUp, TrendingDown, Landmark, Building2 } from 'lucide-react';

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2025-26');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/finance/reports/annual?year=${year}`);
        setReport(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) return <div className="flex justify-center p-12 text-slate-500 font-medium">Loading financial data...</div>;
  if (!report) return null;

  const { income, expenses, netBalance, budgets } = report;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Reports</h2>
          <p className="text-sm text-slate-500 mt-1">High-level income, expense, and budget summary</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={year} onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025-26">FY 2025-26</option>
            <option value="2026-27">FY 2026-27</option>
          </select>
          <button 
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6 border-l-4 border-emerald-500 bg-emerald-50/30">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Total Income</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-3">{formatCurrency(income.total)}</p>
        </div>

        <div className="card-premium p-6 border-l-4 border-red-500 bg-red-50/30">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown className="w-5 h-5" /></div>
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mt-3">{formatCurrency(expenses.total)}</p>
        </div>

        <div className="card-premium p-6 border-l-4 border-blue-500 bg-blue-50/30">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Landmark className="w-5 h-5" /></div>
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Net Balance</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700 mt-3">{formatCurrency(netBalance)}</p>
        </div>
      </div>

      {/* 2. BREAKDOWN VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Income Breakdown */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Income Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 font-bold">Fee Collections</span>
              <span className="font-bold text-emerald-600">{formatCurrency(income.fees)}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 font-bold">Donor Funds</span>
              <span className="font-bold text-emerald-600">{formatCurrency(income.donors)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg mt-2 pt-4 border-t border-slate-200">
              <span className="text-slate-800 font-black">Total</span>
              <span className="font-black text-emerald-700 text-lg">{formatCurrency(income.total)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Expense Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 font-bold">Salaries & Payouts</span>
              <span className="font-bold text-red-500">{formatCurrency(expenses.salaries)}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 font-bold">Fund Releases (Requisitions)</span>
              <span className="font-bold text-red-500">{formatCurrency(expenses.requisitions)}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 font-bold">Refunds</span>
              <span className="font-bold text-red-500">{formatCurrency(expenses.refunds)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg mt-2 pt-4 border-t border-slate-200">
              <span className="text-slate-800 font-black">Total</span>
              <span className="font-black text-red-600 text-lg">{formatCurrency(expenses.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VERTICAL-WISE REPORT */}
      <div className="card-premium">
        <div className="p-6 border-b border-slate-100 flex items-center">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3"><Building2 className="w-5 h-5" /></div>
          <h3 className="text-lg font-bold text-slate-800">Vertical-Wise Budget Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Vertical Name</th>
                <th className="px-6 py-4 text-right">Allocated Budget</th>
                <th className="px-6 py-4 text-right">Used Amount</th>
                <th className="px-6 py-4 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No budget data available</td></tr>
              ) : (
                budgets.map((b) => {
                  const remaining = b.allocated - b.used;
                  return (
                    <tr key={b.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{b.vertical}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">{formatCurrency(b.allocated)}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-500">{formatCurrency(b.used)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(remaining)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ReportsPage;
