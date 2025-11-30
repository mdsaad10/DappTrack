import { Link, useLocation } from "react-router-dom";
import { WalletSelector } from "./WalletSelector";

export function Header() {
  const location = useLocation();

  const navLinks = [
    { path: "/track", label: "Track" },
    { path: "/donate", label: "Donate" },
    { path: "/verify-expenses", label: "Verify" },
    { path: "/deliver", label: "Deliver" },
    { path: "/audit", label: "Audit" },
    { path: "/organizations", label: "Organizations" },
    { path: "/admin", label: "Admin" },
    { path: "/guide", label: "📖 Guide" },
  ];

  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto w-full flex-wrap gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
            🔗 DappTrack
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location.pathname === link.path
                    ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <WalletSelector />
        </div>
      </div>
    </div>
  );
}
