import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart3, Download, PieChart, TrendingUp, IndianRupee } from 'lucide-react';

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

  if (loading) return <div className="flex justify-center p-12">Loading...</div>;
  if (!report) return null;

  const totalAllocated = report.budgets.reduce((s, b) => s + b.allocated, 0);
  const totalUsed = report.budgets.reduce((s, b) => s + b.used, 0);
  const totalSalaries = report.salaries._sum.amount || 0;
  const totalDonors = report.donors._sum.amount || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Financial Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive annual overview</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={year} onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="2025-26">FY 2025-26</option>
            <option value="2026-27">FY 2026-27</option>
          </select>
          <button 
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><PieChart className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold text-slate-800">Budget Execution</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 font-medium">Total Allocated</span>
                <span className="font-bold">{formatCurrency(totalAllocated)}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 font-medium">Total Utilised</span>
                <span className="font-bold text-accent">{formatCurrency(totalUsed)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
                <div className="bg-accent h-2.5 rounded-full" style={{ width: `${Math.min((totalUsed/totalAllocated)*100, 100) || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><BarChart3 className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold text-slate-800">Key Metrics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Salary Expense</p>
              <h4 className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totalSalaries)}</h4>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Donor Funds</p>
              <h4 className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalDonors)}</h4>
            </div>
          </div>
        </div>
      </div>
      
      {/* End of simple report representation */}
    </div>
  );
};

export default ReportsPage;
