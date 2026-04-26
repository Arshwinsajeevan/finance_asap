import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  ArrowRightLeft, 
  PieChart, 
  Users, 
  HeartHandshake, 
  Landmark, 
  LogOut,
  GraduationCap,
  ClipboardCheck,
  RefreshCcw,
  Receipt
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-6 py-3.5 text-sm font-medium transition-all ${
        isActive 
          ? 'bg-blue-50 text-[#00B4D8] border-r-4 border-[#00B4D8]' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`
    }
  >
    <Icon className={`w-5 h-5 mr-3 ${({isActive}) => isActive ? 'text-[#00B4D8]' : 'text-gray-400'}`} />
    {label}
  </NavLink>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col shadow-md z-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <img src="/kerala-logo.png" alt="Kerala Govt Logo" className="h-14 w-auto object-contain mr-3" />
          <div className="h-10 w-px bg-slate-200"></div>
          <img src="/asap-logo.png" alt="ASAP Kerala Logo" className="h-10 w-auto object-contain ml-3" />
        </div>
        
        <div className="p-6 border-b border-gray-100 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00B4D8] to-[#FF6900] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm text-gray-800 font-bold truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#00B4D8]">
              {user.role}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Overview" />
          <SidebarItem to="/budget" icon={PieChart} label="Budget & Allocations" />
          <SidebarItem to="/requisitions" icon={FileText} label="Requisitions" />
          <SidebarItem to="/utilisations" icon={ClipboardCheck} label="Utilisation Reports" />
          <SidebarItem to="/transactions" icon={ArrowRightLeft} label="Transactions" />
          <SidebarItem to="/salaries" icon={Users} label="Salaries & Payouts" />
          <SidebarItem to="/donors" icon={HeartHandshake} label="Donor Funds" />
          <SidebarItem to="/bank" icon={Landmark} label="Bank Records" />
          <SidebarItem to="/fee-collections" icon={GraduationCap} label="Fee Collections" />
          <SidebarItem to="/refunds" icon={RefreshCcw} label="Refunds" />
          <SidebarItem to="/invoices" icon={Receipt} label="Invoices" />
          <SidebarItem to="/reports" icon={FileText} label="Financial Reports" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
