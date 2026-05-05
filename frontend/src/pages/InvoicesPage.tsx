import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X, CheckCircle, Receipt, ArrowDownToLine, ArrowUpFromLine, Clock, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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
  direction: 'INBOUND' | 'OUTBOUND';
  createdAt: string;
}

const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totals, setTotals] = useState({ outbound: 0, inbound: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'OUTBOUND' | 'INBOUND' | 'REQUESTS'>('OUTBOUND');
  const location = useLocation();

  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  
  const [outboundForm, setOutboundForm] = useState({
    vertical: 'TRAINING', clientName: '', baseAmount: '', gstPercent: 0, description: '', panGstin: '', tdsPercent: 0, requestId: ''
  });

  const [inboundForm, setInboundForm] = useState({
    vertical: 'TRAINING', vendorName: '', invoiceNumber: '', baseAmount: '', gstPercent: 0, description: '', panGstin: '', tdsPercent: 0
  });

  const [requestForm, setRequestForm] = useState({
    clientName: '', amount: '', description: '', direction: 'OUTBOUND', category: 'GENERAL', attachmentUrl: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'REQUESTS') {
        const res = await api.get('/finance/invoices/requests');
        setRequests(res.data.data);
      } else {
        const res = await api.get(`/finance/invoices?direction=${activeTab}`);
        setInvoices(res.data.data.invoices);
        setTotals(res.data.data.totals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'requests') {
      setActiveTab('REQUESTS');
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateOutbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', {
        ...outboundForm,
        direction: 'OUTBOUND',
        baseAmount: Number(outboundForm.baseAmount),
        gstPercent: Number(outboundForm.gstPercent),
        requestId: outboundForm.requestId || undefined
      });
      setShowOutboundModal(false);
      setOutboundForm({ vertical: 'TRAINING', clientName: '', baseAmount: '', gstPercent: 0, description: '', panGstin: '', tdsPercent: 0, requestId: '' });
      fetchData();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', {
        ...inboundForm,
        clientName: inboundForm.vendorName,
        invoiceNumber: inboundForm.invoiceNumber || undefined,
        direction: 'INBOUND',
        baseAmount: Number(inboundForm.baseAmount),
        gstPercent: Number(inboundForm.gstPercent)
      });
      setShowInboundModal(false);
      setInboundForm({ vertical: 'TRAINING', vendorName: '', invoiceNumber: '', baseAmount: '', gstPercent: 0, description: '', panGstin: '', tdsPercent: 0 });
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
  const handleProcessRequest = (req: any) => {
    setOutboundForm({
      ...outboundForm,
      vertical: req.vertical,
      clientName: req.clientName,
      baseAmount: req.amount.toString(),
      description: req.description || '',
      requestId: req.id
    });
    setShowOutboundModal(true);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices/requests', {
        ...requestForm,
        vertical: user?.vertical,
        amount: Number(requestForm.amount)
      });
      setShowRequestModal(false);
      setRequestForm({ clientName: '', amount: '', description: '', direction: 'OUTBOUND', category: 'GENERAL', attachmentUrl: '' });
      alert('Invoice request submitted to Finance!');
      fetchData();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const isOverdue = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours > 48;
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

  // Derived values for outbound form
  const obBase = Number(outboundForm.baseAmount) || 0;
  const obGstPct = Number(outboundForm.gstPercent) || 0;
  const obGstAmt = (obBase * obGstPct) / 100;
  const obTotal = obBase + obGstAmt;
  const obTdsAmt = (obBase * (Number(outboundForm.tdsPercent) || 0)) / 100;
  const obNetReceivable = obTotal - obTdsAmt;
  const obIsPanGstValid = outboundForm.panGstin.length === 10 || outboundForm.panGstin.length === 15 || outboundForm.panGstin.length === 0;

  // Derived values for inbound form
  const ibBase = Number(inboundForm.baseAmount) || 0;
  const ibGstPct = Number(inboundForm.gstPercent) || 0;
  const ibGstAmt = (ibBase * ibGstPct) / 100;
  const ibTotal = ibBase + ibGstAmt;
  const ibTdsAmt = (ibBase * (Number(inboundForm.tdsPercent) || 0)) / 100;
  const ibNetPayable = ibTotal - ibTdsAmt;
  const ibIsPanGstValid = inboundForm.panGstin.length === 10 || inboundForm.panGstin.length === 15 || inboundForm.panGstin.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoice Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage receivables, payables and vertical requests</p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role === 'FINANCE_OFFICER' && (
            <>
              <button onClick={() => setShowInboundModal(true)} className="btn-primary flex items-center shadow-md bg-rose-600 hover:bg-rose-700 text-white border-none">
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Record Inbound Bill
              </button>
              <button onClick={() => setShowOutboundModal(true)} className="btn-primary flex items-center shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                <ArrowUpFromLine className="w-4 h-4 mr-2" /> Create Outbound Invoice
              </button>
            </>
          )}
          {user?.role === 'VERTICAL_USER' && (
            <button onClick={() => setShowRequestModal(true)} className="btn-primary flex items-center bg-[#FF6900] hover:bg-[#E65F00] border-none shadow-lg shadow-orange-200">
              <Receipt className="w-4 h-4 mr-2" /> Request Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6 border-l-4 border-l-indigo-500 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Receivables</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totals.outbound)}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ArrowUpFromLine className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="card-premium p-6 border-l-4 border-l-rose-500 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Payables</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totals.inbound)}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownToLine className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="card-premium p-6 border-l-4 border-l-amber-500 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Requests</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{requests.filter(r => r.status === 'PENDING').length}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="card-premium bg-white shadow-md border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex space-x-2">
            {[
              { id: 'OUTBOUND', label: 'Receivables' },
              { id: 'INBOUND', label: 'Payables' },
              { id: 'REQUESTS', label: 'Vertical Requests' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                {tab.label}
                {tab.id === 'REQUESTS' && requests.filter(r => r.status === 'PENDING').length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] animate-pulse">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'REQUESTS' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 font-black">
                <tr>
                  <th className="px-6 py-4">Vertical & Requester</th>
                  <th className="px-6 py-4">Client / Purpose</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-bold">Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">No requests found</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${req.direction === 'OUTBOUND' ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                          <div className="font-black text-slate-800 tracking-tight uppercase text-xs">{req.vertical}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{req.requestedBy?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                            req.direction === 'OUTBOUND' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {req.direction === 'OUTBOUND' ? 'Income' : 'Expense'}
                          </span>
                          <div className="text-slate-700 font-bold text-xs">{req.clientName}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{req.description}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          {req.category && <span className="text-[9px] text-slate-400 font-medium italic">#{req.category}</span>}
                          {req.attachmentUrl && (
                            <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 font-bold hover:underline flex items-center">
                              <FileText className="w-2.5 h-2.5 mr-0.5" /> View Bill
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                        {formatCurrency(req.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {req.status === 'PENDING' && isOverdue(req.createdAt) ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 border border-red-200 uppercase tracking-widest mb-1">
                              OVERDUE
                            </span>
                            <div className="flex items-center text-[9px] text-red-400 font-bold">
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              {Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60))}h ago
                            </div>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            req.status === 'PROCESSED' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' && user?.role === 'FINANCE_OFFICER' && (
                          <button 
                            onClick={() => handleProcessRequest(req)}
                            className="text-[10px] font-black text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-all uppercase tracking-tight shadow-sm"
                          >
                            Process Request
                          </button>
                        )}
                        {req.status === 'PROCESSED' && (
                          <div className="text-[10px] text-emerald-600 font-black flex items-center justify-end uppercase">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {req.invoice?.invoiceNumber}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                <tr>
                  <th className="px-6 py-4">Invoice No & Date</th>
                  <th className="px-6 py-4">{activeTab === 'OUTBOUND' ? 'Client' : 'Vendor'}</th>
                  <th className="px-6 py-4 text-right">Base Amount</th>
                  <th className="px-6 py-4 text-right">GST Amount</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">No {activeTab.toLowerCase()} records found.</td></tr>
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
                        <div className={`font-bold text-base ${activeTab === 'OUTBOUND' ? 'text-indigo-600' : 'text-rose-600'}`}>
                          {formatCurrency(inv.totalAmount)}
                        </div>
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
          )}
        </div>
      </div>

      {/* Outbound Create Modal */}
      {showOutboundModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-indigo-900 flex items-center"><FileText className="w-5 h-5 mr-2" /> Create Outbound Invoice (Receivable)</h3>
              <button onClick={() => setShowOutboundModal(false)} className="text-indigo-400 hover:text-indigo-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateOutbound} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Client / Entity Name</label>
                  <input 
                    type="text" required value={outboundForm.clientName} 
                    onChange={e => setOutboundForm({...outboundForm, clientName: e.target.value})} 
                    className="input-field" placeholder="E.g. Training Partner" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vertical / Department</label>
                  <select className="input-field" value={outboundForm.vertical} onChange={e => setOutboundForm({...outboundForm, vertical: e.target.value})}>
                    <option value="TRAINING">Training</option>
                    <option value="CSP">CSP</option>
                    <option value="SDC">SDC</option>
                    <option value="FUND_RAISING">Fund Raising</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">PAN / GSTIN</label>
                  <input 
                    type="text" value={outboundForm.panGstin} 
                    onChange={e => setOutboundForm({...outboundForm, panGstin: e.target.value.toUpperCase()})} 
                    className={`input-field font-mono uppercase ${!obIsPanGstValid && outboundForm.panGstin.length > 0 ? 'border-red-400' : ''}`} 
                    placeholder="10-digit PAN or 15-digit GSTIN" maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">TDS Deduction %</label>
                  <select className="input-field" value={outboundForm.tdsPercent} onChange={e => setOutboundForm({...outboundForm, tdsPercent: Number(e.target.value)})}>
                    <option value="0">0%</option>
                    <option value="2">2% (Sec 194C)</option>
                    <option value="10">10% (Sec 194J)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description of Service</label>
                <input type="text" value={outboundForm.description} onChange={e => setOutboundForm({...outboundForm, description: e.target.value})} className="input-field" placeholder="Provided services..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base Amount (₹)</label>
                  <input type="number" required min="1" value={outboundForm.baseAmount} onChange={e => setOutboundForm({...outboundForm, baseAmount: e.target.value})} className="input-field font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">GST Percentage</label>
                  <select className="input-field" value={outboundForm.gstPercent} onChange={e => setOutboundForm({...outboundForm, gstPercent: Number(e.target.value)})}>
                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500">Base Amount</span>
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(obBase)}</span>
                </div>
                {obGstPct > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-400 pl-2">GST ({obGstPct}%)</span>
                    <span className="text-xs font-bold text-slate-600">+{formatCurrency(obGstAmt)}</span>
                  </div>
                )}
                {obTdsAmt > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-500">TDS Deducted ({outboundForm.tdsPercent}%)</span>
                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(obTdsAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Net Receivable</span>
                  <span className="text-xl font-black text-emerald-600">{formatCurrency(obNetReceivable)}</span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button type="button" onClick={() => setShowOutboundModal(false)} className="flex-1 py-2.5 px-4 border rounded-xl text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inbound Create Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-bold text-rose-900 flex items-center"><FileText className="w-5 h-5 mr-2" /> Record Inbound Bill (Payable)</h3>
              <button onClick={() => setShowInboundModal(false)} className="text-rose-400 hover:text-rose-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateInbound} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vendor / Trainer Name</label>
                  <input 
                    type="text" required value={inboundForm.vendorName} 
                    onChange={e => setInboundForm({...inboundForm, vendorName: e.target.value})} 
                    className="input-field" placeholder="E.g. CloudHost Inc" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vertical / Department</label>
                  <select className="input-field" value={inboundForm.vertical} onChange={e => setInboundForm({...inboundForm, vertical: e.target.value})}>
                    <option value="TRAINING">Training</option>
                    <option value="CSP">CSP</option>
                    <option value="SDC">SDC</option>
                    <option value="FUND_RAISING">Fund Raising</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vendor Invoice No. (Optional)</label>
                  <input 
                    type="text" value={inboundForm.invoiceNumber} 
                    onChange={e => setInboundForm({...inboundForm, invoiceNumber: e.target.value.toUpperCase()})} 
                    className="input-field font-mono uppercase" placeholder="E.g. INV-1029" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">PAN / GSTIN</label>
                  <input 
                    type="text" value={inboundForm.panGstin} 
                    onChange={e => setInboundForm({...inboundForm, panGstin: e.target.value.toUpperCase()})} 
                    className={`input-field font-mono uppercase ${!ibIsPanGstValid && inboundForm.panGstin.length > 0 ? 'border-red-400' : ''}`} 
                    placeholder="10-digit PAN or 15-digit GSTIN" maxLength={15}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description of Service/Goods</label>
                <input type="text" value={inboundForm.description} onChange={e => setInboundForm({...inboundForm, description: e.target.value})} className="input-field" placeholder="Server hosting fees..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base Amount</label>
                  <input type="number" required min="1" value={inboundForm.baseAmount} onChange={e => setInboundForm({...inboundForm, baseAmount: e.target.value})} className="input-field font-bold" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">GST %</label>
                  <select className="input-field" value={inboundForm.gstPercent} onChange={e => setInboundForm({...inboundForm, gstPercent: Number(e.target.value)})}>
                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">TDS Deduct %</label>
                  <select className="input-field" value={inboundForm.tdsPercent} onChange={e => setInboundForm({...inboundForm, tdsPercent: Number(e.target.value)})}>
                    <option value="0">0%</option><option value="2">2%</option><option value="10">10%</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500">Base Amount</span>
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(ibBase)}</span>
                </div>
                {ibGstPct > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-400 pl-2">GST Added ({ibGstPct}%)</span>
                    <span className="text-xs font-bold text-slate-600">+{formatCurrency(ibGstAmt)}</span>
                  </div>
                )}
                {ibTdsAmt > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-500">TDS to Deduct ({inboundForm.tdsPercent}%)</span>
                    <span className="text-sm font-bold text-emerald-600">-{formatCurrency(ibTdsAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Net Payable</span>
                  <span className="text-xl font-black text-rose-600">{formatCurrency(ibNetPayable)}</span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button type="button" onClick={() => setShowInboundModal(false)} className="flex-1 py-2.5 px-4 border rounded-xl text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold bg-rose-600 hover:bg-rose-700">Record Draft Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Invoice Modal (for Verticals) */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#FF6900]/10 text-[#FF6900] rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Request New Invoice</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-5">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRequestForm({...requestForm, direction: 'OUTBOUND'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${requestForm.direction === 'OUTBOUND' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  OUTBOUND (Client Invoice)
                </button>
                <button
                  type="button"
                  onClick={() => setRequestForm({...requestForm, direction: 'INBOUND'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${requestForm.direction === 'INBOUND' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  INBOUND (Claim / Bill)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select 
                    value={requestForm.category}
                    onChange={e => setRequestForm({...requestForm, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent transition-all outline-none text-sm font-medium"
                  >
                    <option value="GENERAL">General</option>
                    <option value="SALARY_CLAIM">Salary / Expert Claim</option>
                    <option value="VENDOR_BILL">Vendor Bill</option>
                    <option value="STUDENT_FEE">Student Fee</option>
                    <option value="INSTITUTE_ASSISTANCE">Institute Assistance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{requestForm.direction === 'OUTBOUND' ? 'Client / Project' : 'Teacher / Vendor'}</label>
                  <input 
                    type="text" required 
                    value={requestForm.clientName} 
                    onChange={e => setRequestForm({...requestForm, clientName: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent transition-all outline-none text-sm font-medium"
                    placeholder="Name of the entity" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Estimated Base Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" required 
                    value={requestForm.amount} 
                    onChange={e => setRequestForm({...requestForm, amount: e.target.value})} 
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent transition-all outline-none text-sm font-medium"
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description / Purpose</label>
                <textarea 
                  value={requestForm.description} 
                  onChange={e => setRequestForm({...requestForm, description: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent transition-all outline-none text-sm font-medium min-h-[80px]"
                  placeholder="Explain why this is needed..."
                />
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 flex items-start space-x-3 border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Finance will review this request and generate the final GST invoice. You will be notified once the status changes to <span className="font-bold">PROCESSED</span>.
                </p>
              </div>

              <div className="pt-2 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)} 
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 rounded-xl text-white font-black bg-[#FF6900] hover:bg-[#E65F00] shadow-lg shadow-[#FF6900]/20 transition-all text-sm tracking-tight"
                >
                  Send Request
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
