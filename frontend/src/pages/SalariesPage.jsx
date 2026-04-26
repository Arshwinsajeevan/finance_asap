import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, Users, Briefcase, Award, Headphones, CheckCircle2, Plus, X } from 'lucide-react';

const SalariesPage = () => {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    employeeName: '', employeeType: 'EMPLOYEE', amount: '', commission: '0',
    month: '', vertical: 'SECRETARIAT'
  });

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const url = filterType === 'ALL' ? '/finance/salaries' : `/finance/salaries?employeeType=${filterType}`;
      const [salRes, sumRes] = await Promise.all([
        api.get(url),
        api.get('/finance/salaries/summary')
      ]);
      
      setSalaries(salRes.data.data);
      setSummary(sumRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [filterType]);

  const handleMarkPaid = async (id) => {
    try {
      await api.patch(`/finance/salaries/${id}/pay`, { reference: `REF-${Date.now()}` });
      fetchSalaries();
    } catch (err) {
      alert('Failed to mark as paid: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/salaries', {
        ...formData,
        amount: Number(formData.amount),
        commission: Number(formData.commission) || 0,
      });
      setShowModal(false);
      setFormData({ employeeName: '', employeeType: 'EMPLOYEE', amount: '', commission: '0', month: '', vertical: 'SECRETARIAT' });
      fetchSalaries();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'EMPLOYEE': return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'TRAINER': return <Award className="w-5 h-5 text-emerald-500" />;
      case 'MENTOR': return <Users className="w-5 h-5 text-purple-500" />;
      case 'AGENT': return <Headphones className="w-5 h-5 text-orange-500" />;
      default: return <Users className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Salaries & Payouts</h2>
          <p className="text-sm text-slate-500 mt-1">Manage payments for employees, trainers, and agents</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Record
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-premium p-4 md:col-span-1 flex flex-col justify-center bg-primary-50/50 border-primary-100">
            <p className="text-sm font-semibold text-primary-800 mb-1">Total Payouts</p>
            <h3 className="text-2xl font-bold text-primary-600">{formatCurrency(summary.totals._sum.amount || 0)}</h3>
          </div>
          
          {['EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'].map(type => {
            const stat = summary.byType.find(t => t.employeeType === type);
            return (
              <div key={type} className="card-premium p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getTypeIcon(type)}
                  <p className="text-xs font-semibold text-slate-600">{type}</p>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{stat ? formatCurrency(stat._sum.amount) : '₹0'}</h3>
                <p className="text-xs text-slate-500 mt-1">{stat ? stat._count : 0} records</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-premium">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 rounded-t-xl">
          <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {['ALL', 'EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === type 
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Recipient</th>
                <th className="px-6 py-4 font-semibold">Period & Vertical</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : salaries.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No records found</td></tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getTypeIcon(salary.employeeType)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{salary.employeeName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{salary.employeeType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{salary.month}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{salary.vertical || 'Secretariat'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-slate-900">{formatCurrency(salary.amount)}</div>
                      {salary.commission > 0 && (
                        <div className="text-xs text-emerald-600 mt-0.5">+ {formatCurrency(salary.commission)} comm.</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        salary.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {salary.status === 'PENDING' && user.role === 'FINANCE_OFFICER' ? (
                        <button 
                          onClick={() => handleMarkPaid(salary.id)}
                          className="flex items-center mx-auto px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-md text-xs font-semibold transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Mark Paid
                        </button>
                      ) : (
                        <div className="text-xs text-slate-400 font-medium">
                          {salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString('en-IN') : '-'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Add Payment Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name</label>
                <input type="text" required value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} className="input-field" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={formData.employeeType} onChange={e => setFormData({...formData, employeeType: e.target.value})} className="input-field">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TRAINER">Trainer</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="AGENT">Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vertical</label>
                  <select value={formData.vertical} onChange={e => setFormData({...formData, vertical: e.target.value})} className="input-field">
                    <option value="SECRETARIAT">Secretariat</option>
                    <option value="TRAINING">Training</option>
                    <option value="CSP">CSP</option>
                    <option value="SDC">SDC</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission (₹)</label>
                  <input type="number" min="0" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <input type="text" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="input-field" placeholder="e.g. April 2025" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalariesPage;
