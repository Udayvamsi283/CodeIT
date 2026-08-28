import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Info, X, Sparkles, BookOpen, LogIn, LogOut, UserPlus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();

  const isProblemsActive = location.pathname.startsWith('/problems') || location.pathname.startsWith('/problem');

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d1117]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-6">
            <Link
              to="/problems"
              className="group flex items-center gap-2.5 text-white font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 group-hover:border-blue-500/50 transition-all shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent font-bold">
                  CodeIT
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-neutral-400 font-normal">
                  Coding Practice
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-1">
              <Link
                to="/problems"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isProblemsActive
                    ? 'text-white bg-[#21262d] border border-[#30363d]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Problems
                </span>
              </Link>
            </nav>
          </div>

          {/* Nav Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 rounded-md transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              <span>About</span>
            </button>

            {/* Auth Controls */}
            {!loading && (
              <div className="flex items-center gap-2 pl-2 border-l border-[#21262d]">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-[#161b22] border border-[#30363d] rounded-md text-xs text-neutral-300">
                      <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-white max-w-[120px] truncate">
                        {user.username}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 rounded-md transition-all cursor-pointer"
                      title="Log out"
                    >
                      <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 rounded-md transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs shadow-blue-600/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#21262d]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">About CodeIT</h3>
                  <p className="text-xs text-neutral-400">Personal Coding Practice Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3.5 text-sm text-neutral-300 leading-relaxed">
              <p>
                <strong className="text-white">CodeIT</strong> is a dedicated developer-grade competitive programming and interview preparation platform.
              </p>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-[#21262d] space-y-2 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dynamic JSON Problem System</span>
                </div>
                <p className="text-neutral-400 leading-normal">
                  Drop converted Infosys coding question JSON files into <code className="text-amber-400">src/problems/</code>. CodeIT automatically discovers, indexes, and renders them instantly.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 pt-1">
                <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d]">
                  <span className="font-semibold text-neutral-200 block mb-1">Editor</span>
                  Monaco VS Code Engine (C++, Java, Python)
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d]">
                  <span className="font-semibold text-neutral-200 block mb-1">Privacy</span>
                  Hidden test cases protected for judge execution
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#21262d] flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
