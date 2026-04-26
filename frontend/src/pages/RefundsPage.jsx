import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCcw, Search, ArrowDownCircle, X } from 'lucide-react';

const RefundsPage = () => {
  const { user } = useAuth();
  const [refundHistory, setRefundHistory] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const [refundAmount, setRefundAmount] = useState('');
  const [actionReference, setActionReference] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch refund transactions
      const txRes = await api.get('/finance/transactions?type=REFUND&limit=50');
      setRefundHistory(txRes.data.data.data || []);
      
      // Fetch all student payments to allow issuing new refunds
      const payRes = await api.get('/finance/student-payments');
      setStudentPayments(payRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await api.patch(`/finance/student-payments/${selectedPayment.id}/refund`, {
        refundAmount: Number(refundAmount),
        reference: actionReference
      });
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundAmount('');
      setActionReference('');
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter payments for the modal search (must have paid something, and not be fully refunded)
  const eligiblePayments = studentPayments.filter(p => 
    p.paidAmount > 0 && 
    (p.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.courseName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Refunds Management</h2>
          <p className="text-sm text-slate-500 mt-1">Process and track student fee refunds</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowRefundModal(true)} className="btn-primary bg-red-600 hover:bg-red-700 shadow-red-600/20 flex items-center border-none">
            <RefreshCcw className="w-4 h-4 mr-2" /> Issue New Refund
          </button>
        )}
      </div>

      <div className="card-premium">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Refund History</h3>
          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            {refundHistory.length} Refunds Processed
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Amount Refunded</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : refundHistory.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No refunds recorded yet</td></tr>
              ) : (
                refundHistory.map((tx) => (
                  <tr key={tx.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500">{formatDate(tx.createdAt)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{tx.reference || tx.id.substring(0,8)}</td>
                    <td className="px-6 py-4 text-slate-800">{tx.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-red-600">{formatCurrency(tx.amount)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50 shrink-0">
              <h3 className="font-semibold text-red-800">Issue a Refund</h3>
              <button onClick={() => {
                setShowRefundModal(false);
                setSelectedPayment(null);
                setSearchQuery('');
              }} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedPayment ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search Student or Course</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="Search by name or course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                    <div className="max-h-64 overflow-y-auto bg-slate-50">
                      {eligiblePayments.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No eligible payments found.</div>
                      ) : (
                        eligiblePayments.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPayment(p)}
                            className="p-3 border-b border-slate-200 hover:bg-red-50 cursor-pointer flex justify-between items-center transition-colors bg-white"
                          >
                            <div>
                              <div className="font-medium text-slate-800">{p.student.name}</div>
                              <div className="text-xs text-slate-500">{p.courseName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-600">Paid: {formatCurrency(p.paidAmount)}</div>
                              <div className="text-xs text-slate-400">{p.status}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form id="refundForm" onSubmit={handleRefund} className="space-y-5">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Selected Student</p>
                      <p className="font-semibold text-slate-800">{selectedPayment.student.name}</p>
                      <p className="text-sm text-slate-600">{selectedPayment.courseName}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedPayment(null)} className="text-sm text-blue-600 hover:text-blue-800 underline">Change</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <p className="text-xs text-emerald-600 mb-1">Total Paid</p>
                      <p className="font-bold text-emerald-800 text-lg">{formatCurrency(selectedPayment.paidAmount)}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <p className="text-xs text-red-600 mb-1">Max Refundable</p>
                      <p className="font-bold text-red-800 text-lg">{formatCurrency(selectedPayment.paidAmount)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      max={selectedPayment.paidAmount} 
                      value={refundAmount} 
                      onChange={e => setRefundAmount(e.target.value)} 
                      className="input-field text-lg" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference / Reason</label>
                    <input 
                      type="text" 
                      required
                      value={actionReference} 
                      onChange={e => setActionReference(e.target.value)} 
                      className="input-field" 
                      placeholder="Why is this refund being issued?" 
                    />
                  </div>
                </form>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => {
                setShowRefundModal(false);
                setSelectedPayment(null);
              }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors font-medium">Cancel</button>
              {selectedPayment && (
                <button type="submit" form="refundForm" className="px-4 py-2 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsPage;
