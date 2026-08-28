import { useState, useEffect, useMemo, useCallback } from 'react';
import { CircleDot, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { getProblemStats } from '../utils/problemLoader';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export default function ProgressOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Total problems metadata from problem bank
  const bankStats = useMemo(() => getProblemStats(), []);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load user progress statistics.');
      }

      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Invalid statistics response.');
      }
    } catch (err) {
      console.warn('Could not load user progress overview:', err.message);
      setError(err.message || 'Unable to load progress data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Derived metrics
  const totalBankProblems = bankStats.total || 0;
  const totalSolved = stats?.totalSolved || 0;
  const totalAttempted = stats?.totalAttempted || 0;
  const remaining = Math.max(0, totalBankProblems - totalSolved);
  const completionPercentage = totalBankProblems > 0 ? Math.round((totalSolved / totalBankProblems) * 100) : 0;

  // SVG Circular progress calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[#161b22]/70 border border-[#21262d] animate-pulse">
        <div className="h-5 w-40 bg-neutral-800 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-neutral-800/60 rounded-xl" />
          <div className="h-28 bg-neutral-800/60 rounded-xl" />
          <div className="h-28 bg-neutral-800/60 rounded-xl" />
          <div className="h-28 bg-neutral-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[#161b22]/70 border border-[#21262d] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-neutral-300">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-neutral-200">Unable to load progress statistics</p>
            <p className="text-xs text-neutral-500">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchProgress}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#161b22]/80 border border-[#21262d] shadow-sm space-y-6">
      {/* Section Title */}
      <div className="flex items-center justify-between border-b border-[#21262d]/60 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Your Coding Progress
          </h2>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          {completionPercentage}% Solved
        </span>
      </div>

      {/* Main Grid: Circular Progress Summary + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Interactive Progress Ring / Stat Summary */}
        <div className="lg:col-span-4 flex items-center justify-center sm:justify-start gap-5 p-4 rounded-xl bg-[#0d1117]/80 border border-[#21262d]">
          {/* Radial progress ring */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-[#21262d]"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress stroke */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold font-mono text-white leading-none">
                {totalSolved}
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider mt-0.5">
                of {totalBankProblems}
              </span>
            </div>
          </div>

          {/* Quick numbers */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Problems Solved</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {remaining === 0
                ? 'All available problems solved!'
                : `${remaining} problem${remaining === 1 ? '' : 's'} remaining in bank.`}
            </p>
          </div>
        </div>

        {/* Right: Metrics & Difficulty Breakdown */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Attempted */}
          <div className="p-3.5 rounded-xl bg-[#0d1117]/60 border border-[#21262d] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <CircleDot className="w-3.5 h-3.5 text-blue-400" />
              <span>Attempted</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {totalAttempted}
            </div>
            <div className="text-[11px] text-neutral-500">
              In progress
            </div>
          </div>

          {/* Easy breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0d1117]/60 border border-[#21262d] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Easy</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {stats?.easySolved || 0}
              <span className="text-xs text-neutral-500 font-normal"> / {bankStats.easy}</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {bankStats.easy > 0 ? Math.round(((stats?.easySolved || 0) / bankStats.easy) * 100) : 0}% complete
            </div>
          </div>

          {/* Medium breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0d1117]/60 border border-[#21262d] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {stats?.mediumSolved || 0}
              <span className="text-xs text-neutral-500 font-normal"> / {bankStats.medium}</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {bankStats.medium > 0 ? Math.round(((stats?.mediumSolved || 0) / bankStats.medium) * 100) : 0}% complete
            </div>
          </div>

          {/* Hard breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0d1117]/60 border border-[#21262d] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Hard</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-400">
              {stats?.hardSolved || 0}
              <span className="text-xs text-neutral-500 font-normal"> / {bankStats.hard}</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {bankStats.hard > 0 ? Math.round(((stats?.hardSolved || 0) / bankStats.hard) * 100) : 0}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
