import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShoppingBag, LogOut } from "lucide-react";
import "./customer.css";
import { toast } from "react-toastify";
import { customerAxios } from "../../axios/customerAxios";
import { drpCrmBaseUrl } from "../../axios/urls";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Dashboard" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await customerAxios.post(`${drpCrmBaseUrl}/customer/auth/logout`);
      navigate("/customer/login");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-90 bg-white border-r border-gray-100 flex-shrink-0">

        {/* Logo */}
         <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div className="flex items-center justify-center gap-3">
            <img src="/Orderzup.png" alt="Logo Icon" className="w-15" />
            <span className="font-bold text-[#000967] text-5xl">
              Orderz<span className="text-[#F5891E]">Up</span>
            </span>
          </div>
         
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <Link
            to="/customer/order"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              isActive("/customer/order")
                ? "bg-amber-50 text-amber-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <ShoppingBag size={20} />
            All Orders
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center">
            AB
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-3 text-center text-xs text-gray-400">
          © 2026 OrderzUp Customer Portal
        </footer>

      </div>
    </div>
  );
};

export default Layout;
