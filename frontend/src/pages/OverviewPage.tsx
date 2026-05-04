import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  IndianRupee, TrendingUp, TrendingDown, Clock, 
  Landmark, FileText, FileCheck, AlertCircle, Activity, Download, 
  Building, ShieldCheck, FileSpreadsheet, LucideIcon
} from 'lucide-react';

interface Trend {
  isUp: boolean;
  isPositive: boolean;
  val: number;
}

interface TopCardProps {
  title: string;
  amount: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  trend?: Trend;
}

const TopCard: React.FC<TopCardProps> = ({ title, amount, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-full ${color} text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend.isUp ? '↑' : '↓'} {trend.val}%
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</p>
      <h3 className="text-xl font-black text-slate-800 mt-0.5">{amount}</h3>
      <p className="text-[10px] text-slate-400 font-semibold mt-1">{subtitle}</p>
    </div>
  </div>
);

interface DonutItem {
  label: string;
  val: number;
  route?: string;
}

interface DonutChartProps {
  data: DonutItem[];
  total: number;
  colors: string[];
  onNavigate?: (route: string) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, total, colors, onNavigate }) => {
  let currentPct = 0;
  const gradients = data.map((item, i) => {
    const pct = total > 0 ? (item.val / total) * 100 : 0;
    const gradient = `${colors[i]} ${currentPct}% ${currentPct + pct}%`;
    currentPct += pct;
    return gradient;
  }).join(', ');

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-6">
      <div className="relative shrink-0 w-32 h-32 rounded-full flex items-center justify-center shadow-sm" 
           style={{ background: total > 0 ? `conic-gradient(${gradients})` : '#f1f5f9' }}>
        <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner text-center px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Total</span>
          <span className="text-xs font-black text-slate-800 truncate w-full">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {data.map((item, i) => {
          const pct = total > 0 ? (item.val / total) * 100 : 0;
          return (
            <div 
              key={item.label} 
              onClick={() => onNavigate && item.route && onNavigate(item.route)}
              className={`flex justify-between items-center text-xs p-1.5 -mx-1.5 rounded-lg transition-all ${item.route ? 'cursor-pointer hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-slate-100 group' : ''}`}
              title={item.route ? `View ${item.label} transactions` : ''}
            >
              <div className="flex items-center text-slate-600 font-semibold group-hover:text-primary-600 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: colors[i] }}></div>
                {item.label}
              </div>
              <div className="font-bold text-slate-800 group-hover:text-primary-700">{pct.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface OverviewData {
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    pendingRequisitions: number;
    pendingUtilisation: number;
    openingBalance: number;
    totalInflow: number;
    totalOutflow: number;
    closingBalance: number;
    overBudgetAlerts: string[];
    trends?: {
      income: number;
      fundsReleased: number;
      expenses: number;
      netBalance: number;
    };
  };
  revenueSplit: {
    fees: number;
    donors: number;
    other: number;
  };
  expenseSplit: {
    salaries: number;
    requisitions: number;
    refunds: number;
    other: number;
  };
  topReceivables: Array<{
    id: string;
    client: string;
    amount: number;
    status: string;
  }>;
  topPayables: Array<{
    id: string;
    vendor: string;
    amount: number;
  }>;
  budgets: Array<{
    id: string;
    vertical: string;
    allocated: number;
    used: number;
  }>;
}

const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (startDate && endDate) {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }
        const response = await api.get('/finance/reports/overview', { params });
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch overview data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-500 font-medium">Loading Dashboard Data...</div>;
  }

  if (!data) return <div className="text-center p-8 text-slate-500">No data available</div>;

  const { stats, revenueSplit, expenseSplit, topReceivables, topPayables, budgets } = data;
  
  const revData: DonutItem[] = [
    { label: 'Student Fees', val: revenueSplit?.fees || 0, route: '/fee-collections' },
    { label: 'Donor Funds', val: revenueSplit?.donors || 0, route: '/donors' },
    { label: 'Other', val: revenueSplit?.other || 0, route: '/reports' }
  ];
  
  const expData: DonutItem[] = [
    { label: 'Salaries', val: expenseSplit?.salaries || 0, route: '/salaries' },
    { label: 'Requisitions', val: expenseSplit?.requisitions || 0, route: '/requisitions' },
    { label: 'Refunds', val: expenseSplit?.refunds || 0, route: '/refunds' },
    { label: 'Other', val: expenseSplit?.other || 0, route: '/reports' }
  ];

  const criticalBudgets = budgets?.filter(b => {
    const pct = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0;
    return pct >= 90;
  }) || [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto bg-[#f8fafb] min-h-screen pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1e293b]">Finance / Accounts Dashboard</h2>
          <p className="text-sm text-slate-500">Welcome back, {user?.role === 'ADMIN' ? 'Admin Team' : 'Finance Team'}!</p>
        </div>
        <div className="flex gap-3 z-10">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 shadow-sm flex items-center hover:bg-slate-50 transition-colors">
            <Clock className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
              isClearable={true}
              placeholderText="Filter by Date Range"
              className="bg-transparent border-none focus:outline-none w-48 text-sm font-semibold cursor-pointer text-slate-700 placeholder:text-slate-400"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>
      </div>

      {/* Budget Overspend Warning Banner */}
      {criticalBudgets.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-red-800">⚠️ Budget Alert — {criticalBudgets.length} vertical{criticalBudgets.length > 1 ? 's' : ''} near or over limit</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {criticalBudgets.map(b => {
                  const pct = Math.round((b.used / b.allocated) * 100);
                  const remaining = b.allocated - b.used;
                  const isOver = pct >= 100;
                  return (
                    <div key={b.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isOver ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                      <span>{b.vertical}</span>
                      <span className="font-black">{pct}%</span>
                      <span className="text-[10px] font-medium opacity-75">
                        ({remaining <= 0 ? 'Exhausted' : `${formatCurrency(remaining)} left`})
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-red-600/70 mt-2 font-medium">
                Verticals at or above 90% utilisation are flagged. New requisitions exceeding the remaining balance will be rejected.
                <span onClick={() => navigate('/budget')} className="ml-1 text-red-700 underline cursor-pointer hover:text-red-900 font-bold">View Budget Details →</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <TopCard title="Total Revenue" amount={formatCurrency(stats.totalIncome)} subtitle="Total Inflow" icon={IndianRupee} color="bg-emerald-500" trend={{isUp: (stats.trends?.income ?? 0) >= 0, isPositive: (stats.trends?.income ?? 0) >= 0, val: Math.abs(stats.trends?.income || 0)}} />
        <TopCard title="Funds Released" amount={formatCurrency(expenseSplit.requisitions)} subtitle="Total Outflow" icon={Download} color="bg-blue-500" trend={{isUp: (stats.trends?.fundsReleased ?? 0) >= 0, isPositive: (stats.trends?.fundsReleased ?? 0) >= 0, val: Math.abs(stats.trends?.fundsReleased || 0)}} />
        <TopCard title="Total Expenses" amount={formatCurrency(stats.totalExpenses)} subtitle="Operating Costs" icon={TrendingDown} color="bg-amber-500" trend={{isUp: (stats.trends?.expenses ?? 0) >= 0, isPositive: (stats.trends?.expenses ?? 0) <= 0, val: Math.abs(stats.trends?.expenses || 0)}} />
        <TopCard title="Net Surplus" amount={formatCurrency(stats.netBalance)} subtitle="Income - Expense" icon={TrendingUp} color="bg-teal-500" trend={{isUp: (stats.trends?.netBalance ?? 0) >= 0, isPositive: (stats.trends?.netBalance ?? 0) >= 0, val: Math.abs(stats.trends?.netBalance || 0)}} />
        <TopCard title="Pending Requisitions" amount={stats.pendingRequisitions.toString()} subtitle="Pending Approvals" icon={Clock} color="bg-purple-500" />
        <TopCard title="Pending Utilisations" amount={stats.pendingUtilisation.toString()} subtitle="Awaiting Verification" icon={FileCheck} color="bg-rose-500" />
      </div>

      {/* Row 2: Charts and Budget Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Revenue Split Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Revenue Split</h4>
          <DonutChart data={revData} total={stats.totalIncome} colors={['#3b82f6', '#10b981', '#f59e0b']} onNavigate={navigate} />
        </div>

        {/* Expense Split Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Expense Breakdown</h4>
          <DonutChart data={expData} total={stats.totalExpenses} colors={['#8b5cf6', '#ef4444', '#f97316', '#64748b']} onNavigate={navigate} />
        </div>

        {/* Scheme / Vertical Wise Revenue/Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full overflow-hidden">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Vertical Wise Budget (Top 4)</h4>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Vertical</th>
                  <th className="pb-2 font-semibold text-right">Allocated</th>
                  <th className="pb-2 font-semibold text-right">Used</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {budgets?.slice(0, 4).map(b => {
                  const isOver = b.used > b.allocated;
                  return (
                    <tr key={b.id}>
                      <td className="py-2.5 font-bold text-slate-700">{b.vertical}</td>
                      <td className="py-2.5 text-right font-medium text-slate-600">{formatCurrency(b.allocated)}</td>
                      <td className="py-2.5 text-right font-bold text-slate-800">{formatCurrency(b.used)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isOver ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isOver ? 'Over Budget' : 'In Limits'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 3: Receivables, Payables, Center Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Receivables Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800">Receivables (Top 5 Due)</h4>
            <span onClick={() => navigate('/fee-collections')} className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">View All →</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Student</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topReceivables?.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 font-semibold text-slate-700 truncate max-w-[120px]">{r.client}</td>
                    <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(r.amount)}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-600">{r.status}</span>
                    </td>
                  </tr>
                ))}
                {(!topReceivables || topReceivables.length === 0) && <tr><td colSpan={3} className="py-6 text-center text-slate-400">No pending receivables</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payables Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800">Payables (Top 5 Pending)</h4>
            <span onClick={() => navigate('/requisitions')} className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">View All →</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Requisition / Vendor</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topPayables?.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 font-semibold text-slate-700 truncate max-w-[120px]">{r.vendor}</td>
                    <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(r.amount)}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-rose-50 text-rose-600">Pending</span>
                    </td>
                  </tr>
                ))}
                {(!topPayables || topPayables.length === 0) && <tr><td colSpan={3} className="py-6 text-center text-slate-400">No pending payables</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Flow summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800">Cash Flow</h4>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase">Opening Balance</span>
              <span className="font-bold text-slate-800">{formatCurrency(stats.openingBalance)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Total Inflow</span>
              <span className="font-black text-emerald-600">+{formatCurrency(stats.totalInflow)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-red-500 uppercase">Total Outflow</span>
              <span className="font-black text-red-500">-{formatCurrency(stats.totalOutflow)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-sm font-black text-slate-700 uppercase">Closing Balance</span>
              <span className="text-xl font-black text-[#1e293b]">{formatCurrency(stats.closingBalance)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Compliance & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Compliance & Statutory Tracker</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">GST Filing</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Filed</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <AlertCircle className="w-5 h-5 mx-auto text-amber-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">TDS Payment</p>
              <p className="text-xs font-bold text-amber-600 mt-1">Due in 5 Days</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">PF Payment</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Paid</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <AlertCircle className="w-5 h-5 mx-auto text-amber-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Audit FY 24-25</p>
              <p className="text-xs font-bold text-amber-600 mt-1">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-rose-500" /> Alerts & Action Required</h4>
          <ul className="space-y-3">
            {stats.overBudgetAlerts?.map(v => (
              <li key={v} className="text-xs font-medium text-slate-600 flex items-start">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 mr-2 shrink-0"></span>
                <span className="font-bold text-slate-800">{v}</span> is over budget.
              </li>
            ))}
            {stats.pendingRequisitions > 0 && (
              <li className="text-xs font-medium text-slate-600 flex items-start">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 mr-2 shrink-0"></span>
                {stats.pendingRequisitions} requisitions pending approval.
              </li>
            )}
            {stats.pendingUtilisation > 0 && (
              <li className="text-xs font-medium text-slate-600 flex items-start">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 mr-2 shrink-0"></span>
                {stats.pendingUtilisation} utilisations pending verification.
              </li>
            )}
            {(!stats.overBudgetAlerts || stats.overBudgetAlerts.length === 0) && stats.pendingRequisitions === 0 && stats.pendingUtilisation === 0 && (
              <li className="text-xs font-medium text-slate-500">No pending alerts. All caught up!</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Reports Shortcuts</h4>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
              <FileSpreadsheet className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">P&L Report</span>
            </button>
            <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100">
              <Building className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Balance Sheet</span>
            </button>
            <button onClick={() => navigate('/budget')} className="flex flex-col items-center justify-center p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100">
              <Activity className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Cash Flow</span>
            </button>
            <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100">
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Trial Balance</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OverviewPage;
