import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, GraduationCap, DollarSign, RefreshCw, Plus, X, ArrowDownCircle } from 'lucide-react';

const StudentPaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    studentId: '', courseName: '', totalFee: '', paidAmount: '', paymentType: 'FEE', reference: ''
  });
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
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

  const fetchStudents = async () => {
    try {
      // Assuming there's an endpoint to get students, or we can just get all users
      // But since we don't have a specific endpoint for fetching students, we'll fetch them from a mockup or if there is an endpoint.
      // For now, let's just allow manual entry or if there's a way. Let's assume we can fetch users by role.
      // We don't have a get users endpoint exposed in our controllers list, so let's just make the user type the student ID.
      // Actually, since we seeded the DB, let's just leave it as text input for student ID for the demo.
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/student-payments', {
        ...formData,
        totalFee: Number(formData.totalFee),
        paidAmount: Number(formData.paidAmount)
      });
      setShowCreateModal(false);
      setFormData({ studentId: '', courseName: '', totalFee: '', paidAmount: '', paymentType: 'FEE', reference: '' });
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInstallment = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/finance/student-payments/${selectedPayment.id}/installment`, {
        paidAmount: Number(installmentAmount),
        reference: actionReference
      });
      setShowInstallmentModal(false);
      setInstallmentAmount('');
      setActionReference('');
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/finance/student-payments/${selectedPayment.id}/refund`, {
        refundAmount: Number(refundAmount),
        reference: actionReference
      });
      setShowRefundModal(false);
      setRefundAmount('');
      setActionReference('');
      fetchData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openInstallmentModal = (payment) => {
    setSelectedPayment(payment);
    setInstallmentAmount('');
    setActionReference('');
    setShowInstallmentModal(true);
  };

  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount('');
    setActionReference('');
    setShowRefundModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
      PENDING: 'bg-slate-50 text-slate-700 border-slate-200',
      REFUNDED: 'bg-red-50 text-red-700 border-red-200',
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
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Student Payments</h2>
          <p className="text-sm text-slate-500 mt-1">Track fee collections, installments, and refunds</p>
        </div>
        {user.role === 'FINANCE_OFFICER' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Record Fee Payment
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-5 flex items-center">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl mr-4"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Collected</p>
              <h3 className="text-xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.paidAmount || 0)}</h3>
            </div>
          </div>
          <div className="card-premium p-5 flex items-center border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl mr-4"><GraduationCap className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Expected</p>
              <h3 className="text-xl font-bold text-slate-800">{formatCurrency(summary.totals._sum.totalFee || 0)}</h3>
            </div>
          </div>
          <div className="card-premium p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-2">By Status</p>
            <div className="flex space-x-4">
              {summary.byStatus.map(s => (
                <div key={s.status}>
                  <p className="text-xs text-slate-400">{s.status}</p>
                  <p className="text-sm font-bold text-slate-700">{s._count} students</p>
                </div>
              ))}
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
                <th className="px-6 py-4 font-semibold text-right">Paid Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No student payments recorded yet</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{payment.student.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{payment.courseName}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{payment.student.vertical}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      {formatCurrency(payment.totalFee)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-emerald-600">{formatCurrency(payment.paidAmount)}</div>
                      {payment.paidAmount < payment.totalFee && payment.status !== 'REFUNDED' && (
                        <div className="text-xs text-amber-600 mt-0.5">Due: {formatCurrency(payment.totalFee - payment.paidAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        {getStatusBadge(payment.status)}
                        {payment.installmentNo > 1 && (
                          <span className="text-[10px] text-slate-400 mt-1">{payment.installmentNo} Installments</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'FINANCE_OFFICER' ? (
                        <div className="flex justify-center space-x-2">
                          {payment.status !== 'PAID' && payment.status !== 'REFUNDED' && (
                            <button 
                              onClick={() => openInstallmentModal(payment)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                              title="Record Installment"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                          )}
                          {payment.paidAmount > 0 && payment.status !== 'REFUNDED' && (
                            <button 
                              onClick={() => openRefundModal(payment)}
                              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                              title="Issue Refund"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
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

      {/* Record Fee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Record Initial Fee</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (UUID)</label>
                <input type="text" required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="input-field font-mono text-sm" placeholder="User ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Name</label>
                <input type="text" required value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} className="input-field" placeholder="e.g. Full Stack Web Development" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Fee (₹)</label>
                  <input type="number" required min="1" value={formData.totalFee} onChange={e => setFormData({...formData, totalFee: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Payment (₹)</label>
                  <input type="number" min="0" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (optional)</label>
                <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input-field" placeholder="Transaction Reference" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Record Fee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Installment Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Record Installment</h3>
              <button onClick={() => setShowInstallmentModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInstallment} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800">
                <p className="font-medium">Student: {selectedPayment?.student.name}</p>
                <p className="mt-1">Due Amount: {formatCurrency(selectedPayment?.totalFee - selectedPayment?.paidAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Installment Amount (₹)</label>
                <input type="number" required min="1" max={selectedPayment?.totalFee - selectedPayment?.paidAmount} value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                <input type="text" value={actionReference} onChange={e => setActionReference(e.target.value)} className="input-field" placeholder="Transaction Reference" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowInstallmentModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-primary-600 hover:bg-primary-700 transition-colors">Record Installment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="font-semibold text-red-800">Issue Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRefund} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm text-slate-800">
                <p className="font-medium">Student: {selectedPayment?.student.name}</p>
                <p className="mt-1">Max Refundable: {formatCurrency(selectedPayment?.paidAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount (₹)</label>
                <input type="number" required min="1" max={selectedPayment?.paidAmount} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                <input type="text" value={actionReference} onChange={e => setActionReference(e.target.value)} className="input-field" placeholder="Refund Reference" />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowRefundModal(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-colors">Process Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentsPage;
