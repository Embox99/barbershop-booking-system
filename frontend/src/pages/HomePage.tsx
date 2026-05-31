import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { LogOut, CalendarDays, ShieldCheck, Scissors, User } from "lucide-react";

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      <nav className="relative z-50 flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
        <div
          className="text-2xl font-black tracking-tighter uppercase cursor-pointer"
          onClick={() => navigate("/")}
        >
          Barber<span className="text-yellow-500">Shop</span>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer"
              >
                <User size={16} className="text-yellow-500" />
                <span className="text-sm font-medium">{user.name}</span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                  <Link
                    to="/my-appointments"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2 transition"
                  >
                    <CalendarDays size={16} className="text-yellow-500" />
                    My Appointments
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition border-t border-white/10"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-bold bg-white text-black px-5 py-2 rounded-full hover:bg-gray-200 transition"
            >
              Log in
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <p className="text-yellow-500 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">
          Est. 2024 • Tel Aviv
        </p>

        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none">
          Sharp <br /> & Classic
        </h1>

        <p className="text-gray-300 text-lg max-w-lg mb-10 font-light">
          Premium cuts, hot towel shaves, and a true gentleman's atmosphere.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => navigate("/services")}
            className="flex-1 bg-yellow-500 text-black py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transform hover:scale-[1.02] transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            <Scissors size={20} />
            Book Now
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="flex-1 bg-gray-900 text-white border border-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              Dashboard
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
