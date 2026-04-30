import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, AlertCircle, FileText, Download, 
  Search, Filter, CheckCircle2, FileSpreadsheet, Building 
} from 'lucide-react';

// Mock Data for frontend visualization
const MOCK_GST_RECORDS = [
  { id: 'GST-001', month: 'April 2026', totalInvoices: 45, cgst: 125000, sgst: 125000, status: 'FILED', date: '2026-05-10' },
  { id: 'GST-002', month: 'May 2026', totalInvoices: 62, cgst: 180000, sgst: 180000, status: 'PENDING', date: 'Due 2026-06-20' },
];

const MOCK_TDS_RECORDS = [
  { id: 'TDS-001', vendor: 'XYZ Tech Solutions', pan: 'ABCDE1234F', section: '194J', amountPaid: 500000, tdsDeducted: 50000, date: '2026-05-15', status: 'DEDUCTED' },
  { id: 'TDS-002', vendor: 'Deepak R (Trainer)', pan: 'ZYXWV9876Q', section: '192', amountPaid: 65000, tdsDeducted: 6500, date: '2026-05-28', status: 'DEPOSITED' },
  { id: 'TDS-003', vendor: 'Kerala Builders', pan: 'PKLMN5678Z', section: '194C', amountPaid: 200000, tdsDeducted: 4000, date: '2026-06-02', status: 'DEDUCTED' },
];

const MOCK_EMPLOYEES = [
  { id: 'EMP-001', name: 'Arun Kumar', role: 'Finance Officer', pan: 'ARUNK1234P', fy: '2025-26', status: 'READY' },
  { id: 'EMP-002', name: 'Meera Nair', role: 'Admin', pan: 'MEERA5678Q', fy: '2025-26', status: 'READY' },
  { id: 'EMP-003', name: 'Rahul S', role: 'Training Head', pan: 'RAHUL9012R', fy: '2025-26', status: 'PENDING_FINAL_PAYROLL' },
];

const TaxationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('GST');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleGenerateForm16 = (empName) => {
    alert(`Mock: Generating Form 16 PDF for ${empName}...`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Taxation & Compliance</h2>
          <p className="text-sm text-slate-500">Manage GST filings, TDS deductions, and Form 16 generation</p>
        </div>
        {user?.role === 'FINANCE_OFFICER' && (
          <div className="flex gap-3">
            <button className="btn-primary flex items-center bg-emerald-600 hover:bg-emerald-700">
              <ShieldCheck className="w-4 h-4 mr-2" />
              File Return
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('GST')}
          className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'GST' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          GST Tracking
        </button>
        <button 
          onClick={() => setActiveTab('TDS')}
          className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'TDS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          TDS Deductions
        </button>
        <button 
          onClick={() => setActiveTab('FORM16')}
          className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'FORM16' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Form 16 Generation
        </button>
      </div>

      {/* Tab Content: GST */}
      {activeTab === 'GST' && (
        <div className="card-premium">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-500" />
              Monthly GST Filings (GSTR-1 & GSTR-3B)
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Month</th>
                  <th className="px-6 py-4 font-bold">Invoices</th>
                  <th className="px-6 py-4 font-bold text-right">CGST</th>
                  <th className="px-6 py-4 font-bold text-right">SGST</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold">Action/Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_GST_RECORDS.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{record.month}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{record.totalInvoices}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-right">{formatCurrency(record.cgst)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-right">{formatCurrency(record.sgst)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${record.status === 'FILED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {record.status === 'FILED' ? (
                        <div className="flex items-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mr-1"/> {record.date}</div>
                      ) : (
                        <div className="flex items-center text-amber-600"><AlertCircle className="w-4 h-4 mr-1"/> {record.date}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: TDS */}
      {activeTab === 'TDS' && (
        <div className="card-premium">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-800 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-500" />
              TDS Deductions Ledger
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search PAN or Vendor..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Vendor / Payee</th>
                  <th className="px-6 py-4 font-bold">PAN</th>
                  <th className="px-6 py-4 font-bold">Section</th>
                  <th className="px-6 py-4 font-bold text-right">Amount Paid</th>
                  <th className="px-6 py-4 font-bold text-right text-red-600">TDS Deducted</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_TDS_RECORDS.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{record.vendor}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600 font-mono tracking-wide">{record.pan}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">Sec {record.section}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-right">{formatCurrency(record.amountPaid)}</td>
                    <td className="px-6 py-4 font-black text-red-600 text-right">-{formatCurrency(record.tdsDeducted)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${record.status === 'DEPOSITED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: FORM 16 */}
      {activeTab === 'FORM16' && (
        <div className="card-premium">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-rose-500" />
              Employee Form 16 Generation
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Employee Name</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">PAN</th>
                  <th className="px-6 py-4 font-bold">Financial Year</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_EMPLOYEES.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{emp.role}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600 font-mono tracking-wide">{emp.pan}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{emp.fy}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${emp.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {emp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleGenerateForm16(emp.name)}
                        disabled={emp.status !== 'READY'}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          emp.status === 'READY' 
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Generate PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaxationPage;
