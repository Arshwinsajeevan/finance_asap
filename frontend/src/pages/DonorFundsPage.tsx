import React, { useState, useEffect } from 'react';
import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';
import { HeartHandshake, Building2, User, Globe2 } from 'lucide-react';

interface DonorFund {
  id: string;
  donorName: string;
  donorType: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT' | 'OTHER';
  amount: number;
  purpose?: string;
  vertical?: string;
  project?: string;
  receivedAt: string;
  reference?: string;
}

interface DonorSummary {
  totals: {
    _sum: { amount: number | null };
    _count: number;
  };
  byType: Array<{
    donorType: string;
    _sum: { amount: number | null };
  }>;
}

const DonorFundsPage: React.FC = () => {
  // const { user } = useAuth();
  const [funds, setFunds] = useState<DonorFund[]>([]);
  const [summary, setSummary] = useState<DonorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fundsRes, sumRes] = await Promise.all([
        api.get('/finance/donors'),
        api.get('/finance/donors/summary')
      ]);
      setFunds(fundsRes.data.data);
      setSummary(sumRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDonorIcon = (type: string) => {
    switch(type) {
      case 'CORPORATE': return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'GOVERNMENT': return <Globe2 className="w-5 h-5 text-emerald-500" />;
      case 'INDIVIDUAL': return <User className="w-5 h-5 text-blue-500" />;
      default: return <HeartHandshake className="w-5 h-5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Donor Funds</h2>
          <p className="text-sm text-slate-500 mt-1">Track sponsorships and external contributions</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium p-6 col-span-1 md:col-span-2 flex items-center bg-gradient-to-br from-indigo-50 to-white">
            <div className="p-4 bg-indigo-100 rounded-2xl mr-6">
              <HeartHandshake className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800 mb-1">Total Funds Raised</p>
              <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(summary.totals._sum.amount || 0)}</h3>
              <p className="text-sm text-slate-500 mt-1">From {summary.totals._count} contributions</p>
            </div>
          </div>
          
          <div className="card-premium p-5 col-span-1 md:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">Contributions by Source</p>
            <div className="space-y-3">
              {summary.byType.map(type => (
                <div key={type.donorType} className="flex justify-between items-center">
                  <div className="flex items-center text-sm">
                    {getDonorIcon(type.donorType)}
                    <span className="ml-2 font-medium text-slate-600">{type.donorType}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(type._sum.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Donor Details</th>
              <th className="px-6 py-4 font-semibold">Purpose & Vertical</th>
              <th className="px-6 py-4 font-semibold">Date Received</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : funds.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">No donor funds recorded yet</td></tr>
            ) : (
              funds.map((fund) => (
                <tr key={fund.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getDonorIcon(fund.donorType)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{fund.donorName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{fund.donorType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">{fund.purpose || 'General Fund'}</div>
                    {fund.vertical && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{fund.vertical}</span>
                        {fund.project && <span className="ml-2">• {fund.project}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(fund.receivedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-emerald-600 text-base">{formatCurrency(fund.amount)}</div>
                    {fund.reference && <div className="text-xs text-slate-400 mt-1">Ref: {fund.reference}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default DonorFundsPage;
