import { useState, useEffect } from 'react';
import codeitIcon from '../assets/codeit-icon.png';

export default function LandingLoader({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1.8s loading presentation before starting fade-out transition
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    // 400ms fade-out duration before completing
    const finishTimer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="Loading CodeIT"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1117] transition-all duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle background ambient glowing orbs */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none animate-float-orb-1" />
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none animate-float-orb-2" />

      {/* Subtle developer grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Floating subtle ambient code fragments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-1/4 left-1/6 text-xs font-mono text-neutral-600/30 animate-float-token-1 hidden sm:inline-block">
          &lt;algorithm /&gt;
        </span>
        <span className="absolute top-2/3 right-1/6 text-xs font-mono text-neutral-600/30 animate-float-token-2 hidden sm:inline-block">
          const solve = async () =&gt; &#123; &#125;
        </span>
        <span className="absolute bottom-1/5 left-1/4 text-xs font-mono text-neutral-600/30 animate-float-token-2 hidden md:inline-block">
          test_suite: ready
        </span>
      </div>

      {/* Center Branding Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Glow & Logo */}
        <div className="relative flex items-center justify-center">
          {/* Subtle radiating glow */}
          <div className="absolute w-24 h-24 rounded-2xl bg-red-600/20 blur-xl animate-pulse-glow" />
          
          <img
            src={codeitIcon}
            alt="CodeIT"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_24px_rgba(220,38,38,0.35)] transition-transform duration-700 ease-out scale-100 hover:scale-105"
          />
        </div>

        {/* Status indicator & Progress Line */}
        <div className="flex flex-col items-center gap-2.5 w-48 sm:w-56">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Initializing Workspace</span>
          </div>

          {/* Glowing mini progress bar */}
          <div className="w-full h-1 bg-[#161b22] border border-[#21262d] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-red-500 rounded-full animate-loader-progress shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
