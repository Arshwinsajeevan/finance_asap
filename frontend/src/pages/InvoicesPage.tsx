import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X, CheckCircle, Receipt } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  vertical: string;
  baseAmount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  createdAt: string;
}

const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totals, setTotals] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    vertical: 'TRAINING',
    clientName: '',
    baseAmount: '',
    gstPercent: 0,
    description: '',
    panGstin: '',
    tdsPercent: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/invoices');
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
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', {
        ...formData,
        baseAmount: Number(formData.baseAmount),
        gstPercent: Number(formData.gstPercent)
      });
      setShowCreateModal(false);
      setFormData({ vertical: 'TRAINING', clientName: '', baseAmount: '', gstPercent: 0, description: '', panGstin: '', tdsPercent: 0 });
      fetchData();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/finance/invoices/${id}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status: 'DRAFT' | 'APPROVED' | 'PAID') => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
      DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Derived values for the form
  const formBase = Number(formData.baseAmount) || 0;
  const formGstPct = Number(formData.gstPercent) || 0;
  const formGstAmt = (formBase * formGstPct) / 100;
  const formTotal = formBase + formGstAmt;
  const formTdsAmt = (formBase * (Number(formData.tdsPercent) || 0)) / 100;
  const netReceivable = formTotal - formTdsAmt;
  
  const isPanGstValid = formData.panGstin.length === 10 || formData.panGstin.length === 15 || formData.panGstin.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Invoice Management</h2>
          <p className="text-sm text-slate-500 mt-1">Create and manage tax invoices with automatic GST calculation</p>
        </div>
        {user?.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </button>
        )}
      </div>

      <div className="card-premium p-6 border-l-4 border-indigo-500 bg-indigo-50/30 w-full md:w-1/3">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Receipt className="w-5 h-5" /></div>
          <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Total Invoiced Amount</h3>
        </div>
        <p className="text-3xl font-bold text-indigo-700 mt-3">{formatCurrency(totals)}</p>
      </div>

      <div className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-4">Invoice No & Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4 text-right">Base Amount</th>
                <th className="px-6 py-4 text-right">GST Amount</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No invoices found</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-slate-700">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{formatDate(inv.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{inv.clientName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase">{inv.vertical}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-600">{formatCurrency(inv.baseAmount)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-600">{formatCurrency(inv.gstAmount)} <span className="text-[10px] text-slate-400 ml-1">({inv.gstPercent}%)</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-emerald-600 text-base">{formatCurrency(inv.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user?.role === 'FINANCE_OFFICER' ? (
                        <div className="flex justify-center">
                          {inv.status === 'DRAFT' && (
                            <button 
                              onClick={() => updateStatus(inv.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {inv.status === 'APPROVED' && (
                            <button 
                              onClick={() => updateStatus(inv.id, 'PAID')}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors flex items-center"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Mark Paid
                            </button>
                          )}
                          {inv.status === 'PAID' && (
                            <span className="text-xs font-bold text-slate-400">Paid</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View Only</span>
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-indigo-900 flex items-center"><FileText className="w-5 h-5 mr-2" /> Create GST Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-indigo-400 hover:text-indigo-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Client / Entity Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.clientName} 
                    onChange={e => setFormData({...formData, clientName: e.target.value})} 
                    className="input-field" 
                    placeholder="E.g. Acme Corp" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vertical / Department</label>
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
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">PAN / GSTIN</label>
                  <input 
                    type="text" 
                    value={formData.panGstin} 
                    onChange={e => setFormData({...formData, panGstin: e.target.value.toUpperCase()})} 
                    className={`input-field font-mono uppercase ${!isPanGstValid && formData.panGstin.length > 0 ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`} 
                    placeholder="10-digit PAN or 15-digit GSTIN" 
                    maxLength={15}
                  />
                  {!isPanGstValid && formData.panGstin.length > 0 && <p className="text-[10px] text-red-500 mt-1">Invalid length. Must be 10 (PAN) or 15 (GSTIN) chars.</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">TDS Deduction %</label>
                  <select 
                    className="input-field" 
                    value={formData.tdsPercent} 
                    onChange={e => setFormData({...formData, tdsPercent: Number(e.target.value)})}
                  >
                    <option value="0">0%</option>
                    <option value="2">2% (Sec 194C)</option>
                    <option value="10">10% (Sec 194J)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description of Service</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="input-field" 
                  placeholder="Software development services..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={formData.baseAmount} 
                    onChange={e => setFormData({...formData, baseAmount: e.target.value})} 
                    className="input-field font-bold text-slate-800" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">GST Percentage</label>
                  <select 
                    className="input-field" 
                    value={formData.gstPercent} 
                    onChange={e => setFormData({...formData, gstPercent: Number(e.target.value)})}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
              </div>

              {/* Auto Calculated Totals Panel */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500">Base Amount</span>
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(formBase)}</span>
                </div>
                {formGstPct > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-400 pl-2">CGST ({formGstPct / 2}%)</span>
                      <span className="text-xs font-bold text-slate-600">+{formatCurrency(formGstAmt / 2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-400 pl-2">SGST ({formGstPct / 2}%)</span>
                      <span className="text-xs font-bold text-slate-600">+{formatCurrency(formGstAmt / 2)}</span>
                    </div>
                  </>
                )}
                {formTdsAmt > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-500">TDS Deducted ({formData.tdsPercent}%)</span>
                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(formTdsAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Net Receivable</span>
                  <span className="text-xl font-black text-emerald-600">{formatCurrency(netReceivable)}</span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20">
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
