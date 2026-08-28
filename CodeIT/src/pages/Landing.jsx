import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code2, Sparkles, Terminal, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import codeitLogo from '../assets/codeit-logo.png';
import LandingLoader from '../components/LandingLoader';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Show initial loading presentation once per page load/session
  const [showLoader, setShowLoader] = useState(() => {
    const hasSeenLoader = sessionStorage.getItem('codeit_has_loaded');
    return !hasSeenLoader;
  });

  const handleLoaderFinish = () => {
    sessionStorage.setItem('codeit_has_loaded', 'true');
    setShowLoader(false);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      {showLoader && <LandingLoader onFinish={handleLoaderFinish} />}

      <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center overflow-hidden bg-[#0d1117] text-[#e6edf3] px-4 py-12 sm:py-16">
        {/* Ambient background glowing orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[540px] sm:h-[540px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none animate-float-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none animate-float-orb-2" />

        {/* Subtle developer grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        {/* Floating subtle code snippets */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none max-w-7xl mx-auto">
          <div className="absolute top-12 left-6 sm:left-12 p-3 rounded-lg bg-[#161b22]/60 border border-[#21262d] text-[11px] font-mono text-neutral-400 backdrop-blur-xs animate-float-token-1 hidden md:block shadow-lg">
            <span className="text-blue-400">const</span> solve = <span className="text-amber-400">(target, nums)</span> =&gt; &#123;
            <div className="text-emerald-400 pl-3">// Optimized O(N) lookup</div>
            &#125;;
          </div>

          <div className="absolute bottom-16 right-6 sm:right-12 p-3 rounded-lg bg-[#161b22]/60 border border-[#21262d] text-[11px] font-mono text-neutral-400 backdrop-blur-xs animate-float-token-2 hidden md:block shadow-lg">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>12/12 Test Cases Passed</span>
            </div>
            <div className="text-neutral-500">Runtime: 14ms | Memory: 42.1MB</div>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161b22]/90 border border-[#30363d] text-xs font-mono text-neutral-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Developer Interview Preparation Platform</span>
          </div>

          {/* Full CodeIT Logo */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-125 pointer-events-none" />
            <img
              src={codeitLogo}
              alt="CodeIT"
              className="h-16 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Ambitious Motivating Headline & Copy */}
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Master the Code. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-red-400 bg-clip-text text-transparent">
                Conquer the Interview.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto">
              Practice smarter with real interview problems, instant execution feedback, and hidden evaluation suites designed for serious developers.
            </p>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGetStarted}
              className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm sm:text-base shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:shadow-[0_0_32px_rgba(59,130,246,0.5)] transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Feature Highlights Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl text-left">
            <div className="p-3 rounded-xl bg-[#161b22]/50 border border-[#21262d] flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-300">Monaco Engine</span>
            </div>
            <div className="p-3 rounded-xl bg-[#161b22]/50 border border-[#21262d] flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-300">C++, Java, Python</span>
            </div>
            <div className="p-3 rounded-xl bg-[#161b22]/50 border border-[#21262d] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-300">Hidden Test Suites</span>
            </div>
            <div className="p-3 rounded-xl bg-[#161b22]/50 border border-[#21262d] flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-300">Judge0 Execution</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
