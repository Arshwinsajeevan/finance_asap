import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X, Search, ArrowDownCircle, CheckCircle } from 'lucide-react';

const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [totals, setTotals] = useState({ inboundTotal: 0, outboundTotal: 0 });
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterDirection, setFilterDirection] = useState('');
  
  const [formData, setFormData] = useState({
    direction: 'INBOUND',
    vertical: 'TRAINING',
    issuedTo: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = filterDirection ? `/finance/invoices?direction=${filterDirection}` : '/finance/invoices';
      const res = await api.get(url);
      setInvoices(res.data.data.invoices);
      setTotals(res.data.data.totals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDirection]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      });
      setShowCreateModal(false);
      setFormData({ direction: 'INBOUND', vertical: 'TRAINING', issuedTo: '', amount: '', description: '', dueDate: '' });
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/finance/invoices/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      SANCTIONED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ISSUED: 'bg-blue-50 text-blue-700 border-blue-200',
      CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Invoice Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage inbound (vendor/vertical) and outbound (student/donor) invoices</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-5 flex items-center border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4"><ArrowDownCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Inbound Invoices (To Pay / Sanction)</p>
            <h3 className="text-xl font-bold text-slate-800">{formatCurrency(totals.inboundTotal)}</h3>
          </div>
        </div>
        <div className="card-premium p-5 flex items-center border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl mr-4"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Outbound Invoices (Issued)</p>
            <h3 className="text-xl font-bold text-slate-800">{formatCurrency(totals.outboundTotal)}</h3>
          </div>
        </div>
      </div>

      <div className="card-premium">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilterDirection('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDirection === '' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              All Invoices
            </button>
            <button 
              onClick={() => setFilterDirection('INBOUND')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDirection === 'INBOUND' ? 'bg-white shadow-sm text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Inbound (Payable)
            </button>
            <button 
              onClick={() => setFilterDirection('OUTBOUND')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDirection === 'OUTBOUND' ? 'bg-white shadow-sm text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Outbound (Receivable)
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice Details</th>
                <th className="px-6 py-4 font-semibold">Issued To</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No invoices found</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {inv.direction === 'INBOUND' ? 
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">INBOUND</span> : 
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">OUTBOUND</span>
                        }
                        <span className="font-mono text-xs font-semibold text-slate-700">{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{inv.description}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Dept: {inv.vertical}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{inv.issuedTo || '-'}</div>
                      {inv.dueDate && (
                        <div className="text-xs text-slate-500 mt-0.5">Due: {formatDate(inv.dueDate)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${inv.direction === 'INBOUND' ? 'text-slate-800' : 'text-emerald-600'}`}>
                        {formatCurrency(inv.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'FINANCE_OFFICER' && inv.status === 'ISSUED' && (
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => updateStatus(inv.id, inv.direction === 'INBOUND' ? 'SANCTIONED' : 'PAID')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                            title={inv.direction === 'INBOUND' ? 'Sanction Invoice' : 'Mark as Paid'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateStatus(inv.id, 'CANCELLED')}
                            className="p-1.5 bg-slate-50 text-slate-600 rounded hover:bg-slate-100 transition-colors"
                            title="Cancel Invoice"
                          >
                            <X className="w-4 h-4" />
                          </button>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Create New Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                  <select 
                    className="input-field" 
                    value={formData.direction} 
                    onChange={e => setFormData({...formData, direction: e.target.value})}
                  >
                    <option value="INBOUND">Inbound (To Pay / Vertical Bill)</option>
                    <option value="OUTBOUND">Outbound (To Receive / Student)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department / Vertical</label>
                  <select 
                    className="input-field" 
                    value={formData.vertical} 
                    onChange={e => setFormData({...formData, vertical: e.target.value})}
                  >
                    <option value="TRAINING">Training</option>
                    <option value="CSP">CSP</option>
                    <option value="SDC">SDC</option>
                    <option value="TBB">TBB</option>
                    <option value="FUND_RAISING">Fund Raising</option>
                    <option value="SECRETARIAT">Secretariat</option>
                    <option value="FINANCE">Finance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issued To (Name)</label>
                <input 
                  type="text" 
                  required 
                  value={formData.issuedTo} 
                  onChange={e => setFormData({...formData, issuedTo: e.target.value})} 
                  className="input-field" 
                  placeholder="e.g. Student Name, Vendor Name, or Department Head" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    className="input-field" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Purpose</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="input-field min-h-[80px] py-2" 
                  placeholder="Details of the goods, services, or fees..." 
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
