import { Link, Outlet, useLocation } from "react-router-dom";

export const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔔</span>
              </div>
              <span className="text-xl font-bold text-slate-800">
                Notification
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                to="/user"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/user")
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                User
              </Link>
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/admin")
                    ? "bg-purple-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <Outlet />
    </div>
  );
};
