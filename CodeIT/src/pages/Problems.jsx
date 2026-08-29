import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Layers, CheckCircle, Flame, Sparkles, BookOpen, X, Check, Clock } from 'lucide-react';
import { getAllProblems, getAllTopics, getProblemStats } from '../utils/problemLoader';
import ProblemCard from '../components/ProblemCard';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Problems() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // User-specific progress state
  const [progressMap, setProgressMap] = useState({});
  const [userStats, setUserStats] = useState(null);

  // Discover problems and metadata dynamically
  const problems = useMemo(() => getAllProblems(), []);
  const allTopics = useMemo(() => getAllTopics(), []);
  const stats = useMemo(() => getProblemStats(), []);

  // Fetch authenticated progress and stats
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setProgressMap({});
      setUserStats(null);
      return;
    }

    let isMounted = true;

    async function loadUserProgress() {
      try {
        const [progressRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/progress`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/progress/stats`, { credentials: 'include' })
        ]);

        if (progressRes.ok) {
          const data = await progressRes.json();
          if (data.success && Array.isArray(data.progress) && isMounted) {
            const map = {};
            data.progress.forEach((item) => {
              map[item.problemId] = item;
            });
            setProgressMap(map);
          }
        }

        if (statsRes.ok) {
          const sData = await statsRes.json();
          if (sData.success && sData.stats && isMounted) {
            setUserStats(sData.stats);
          }
        }
      } catch (err) {
        console.warn('Could not fetch user progress:', err.message);
      }
    }

    loadUserProgress();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading]);

  // Filter problems based on user criteria
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search matching (title, id, topics)
      const matchesSearch =
        searchQuery.trim() === '' ||
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Difficulty matching
      const matchesDifficulty =
        selectedDifficulty === 'All' ||
        problem.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      // Topic matching
      const matchesTopic =
        selectedTopic === 'All' ||
        problem.topics.some((t) => t.toLowerCase() === selectedTopic.toLowerCase());

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedTopic]);

  const hasActiveFilters = searchQuery !== '' || selectedDifficulty !== 'All' || selectedTopic !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedTopic('All');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#21262d]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                Infosys Practice Bank
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Problems
            </h1>
            <p className="mt-1.5 text-sm text-neutral-400">
              Practice coding problems and prepare for technical interviews.
            </p>
          </div>

          {/* Quick Stats Overview */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAuthenticated && userStats && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300">
                <span className="text-blue-300 font-medium">Your Solved:</span>
                <span className="font-bold text-white font-mono">{userStats.totalSolved} / {stats.total}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="text-neutral-400">Total:</span>
              <span className="font-semibold text-white font-mono">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-neutral-400">Easy:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {userStats ? `${userStats.easySolved}/` : ''}{stats.easy}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-neutral-400">Med:</span>
              <span className="font-semibold text-amber-400 font-mono">
                {userStats ? `${userStats.mediumSolved}/` : ''}{stats.medium}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-neutral-400">Hard:</span>
              <span className="font-semibold text-rose-400 font-mono">
                {userStats ? `${userStats.hardSolved}/` : ''}{stats.hard}
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-6 lg:col-span-6">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, topic, or #id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-10 pr-9 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Topic Filter */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="All">All Topics ({allTopics.length})</option>
                {allTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-neutral-500">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] text-neutral-200 border border-[#30363d]">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDifficulty !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] text-neutral-200 border border-[#30363d]">
                  <span>Difficulty: {selectedDifficulty}</span>
                  <button onClick={() => setSelectedDifficulty('All')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTopic !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] text-neutral-200 border border-[#30363d]">
                  <span>Topic: {selectedTopic}</span>
                  <button onClick={() => setSelectedTopic('All')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Problems List */}
        <div className="space-y-3">
          {/* Table Header row */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#21262d]/60">
            <div className="flex items-center gap-3">
              <span className="w-12 text-left">Status</span>
              <span>Problem</span>
            </div>
            <div className="flex items-center gap-6 pr-2">
              <span className="w-16 text-center">Difficulty</span>
              <span className="w-4"></span>
            </div>
          </div>

          {/* List or Empty State */}
          {filteredProblems.length > 0 ? (
            <div className="space-y-2">
              {filteredProblems.map((problem, index) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  index={index}
                  progress={progressMap[problem.id]}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-[#161b22]/40 border border-[#21262d] space-y-3">
              <Layers className="w-8 h-8 text-neutral-500 mx-auto" />
              <h3 className="text-base font-semibold text-neutral-300">No problems found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No problems matched your current filter criteria. Try searching for different keywords or resetting filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#21262d]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <span>
            Showing <strong className="text-neutral-300 font-mono">{filteredProblems.length}</strong> of{' '}
            <strong className="text-neutral-300 font-mono">{problems.length}</strong> total problems
          </span>
          <span className="font-mono text-[11px]">
            Place new JSON files in <code className="text-neutral-400">src/problems/</code> to auto-load
          </span>
        </div>
      </div>
    </div>
  );
}
