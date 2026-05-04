import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, DollarSign, X, Calendar } from 'lucide-react';

interface StudentPayment {
  id: string;
  student: {
    id: string;
    name: string;
  };
  courseName: string;
  totalFee: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'REFUNDED';
  createdAt: string;
}

interface StudentPaymentSummary {
  totals: {
    _sum: {
      totalFee: number | null;
      paidAmount: number | null;
    };
  };
}

const StudentPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [summary, setSummary] = useState<StudentPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);

  // Forms
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionReference, setActionReference] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, sumRes] = await Promise.all([
        api.get('/finance/student-payments'),
        api.get('/finance/student-payments/summary')
      ]);
      setPayments(payRes.data.data);
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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    
    const pendingAmount = selectedPayment.totalFee - selectedPayment.paidAmount;
    
    if (Number(paymentAmount) > pendingAmount) {
      alert(`Payment cannot exceed pending amount of ₹${pendingAmount}`);
      return;
    }

    try {
      await api.patch(`/finance/student-payments/${selectedPayment.id}/installment`, {
        paidAmount: Number(paymentAmount),
        reference: actionReference
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setActionReference('');
      fetchData();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openPaymentModal = (payment: StudentPayment) => {
    setSelectedPayment(payment);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setActionReference('');
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PARTIAL: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      PENDING: 'bg-red-50 text-red-700 border-red-200',
      REFUNDED: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    
    const labels: Record<string, string> = {
      PENDING: 'UNPAID',
      PARTIAL: 'PARTIAL',
      PAID: 'PAID',
      REFUNDED: 'REFUNDED'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Fee Collections</h2>
          <p className="text-sm text-slate-500 mt-1">Track core student fee payments and dues</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-5 flex items-center">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl mr-4"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.paidAmount || 0)}</h3>
            </div>
          </div>
          <div className="card-premium p-5 flex items-center border-l-4 border-l-yellow-500">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl mr-4"><GraduationCap className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Expected</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.totalFee || 0)}</h3>
            </div>
          </div>
          <div className="card-premium p-5 flex items-center border-l-4 border-l-red-500">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl mr-4"><Calendar className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pending</p>
              <h3 className="text-2xl font-bold text-red-600">
                {formatCurrency((summary.totals._sum.totalFee || 0) - (summary.totals._sum.paidAmount || 0))}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="card-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Student & Course</th>
                <th className="px-6 py-4 font-semibold text-right">Total Fee</th>
                <th className="px-6 py-4 font-semibold text-right">Paid</th>
                <th className="px-6 py-4 font-semibold text-right">Pending</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No student fee records found</td></tr>
              ) : (
                payments.map((payment) => {
                  const pendingAmount = payment.totalFee - payment.paidAmount;
                  
                  return (
                    <tr key={payment.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{payment.student.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">{payment.courseName}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        {formatCurrency(payment.totalFee)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-emerald-600">{formatCurrency(payment.paidAmount)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatCurrency(pendingAmount)}
                        </div>
                        {pendingAmount > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 uppercase">Next Due: N/A</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user?.role === 'FINANCE_OFFICER' ? (
                          <div className="flex justify-center">
                            {pendingAmount > 0 && payment.status !== 'REFUNDED' ? (
                              <button 
                                onClick={() => openPaymentModal(payment)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Clear</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-bold text-blue-800 flex items-center">
                Record Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-blue-400 hover:text-blue-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Student</p>
                <p className="font-bold text-slate-800 text-sm mb-3">{selectedPayment.student.name}</p>
                
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Pending Amount</p>
                <p className="font-bold text-red-600 text-lg">{formatCurrency(selectedPayment.totalFee - selectedPayment.paidAmount)}</p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max={selectedPayment.totalFee - selectedPayment.paidAmount} 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    className="input-field text-lg font-bold text-emerald-700" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Date</label>
                  <input 
                    type="date" 
                    required 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Reference No.</label>
                  <input 
                    type="text" 
                    value={actionReference} 
                    onChange={e => setActionReference(e.target.value)} 
                    className="input-field" 
                    placeholder="Transaction ID / Receipt No." 
                  />
                </div>
                
                <div className="pt-2 flex space-x-3">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPaymentsPage;
