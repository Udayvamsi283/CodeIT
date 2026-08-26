import { useState, useMemo } from 'react';
import { Search, Filter, Layers, CheckCircle, Flame, Sparkles, BookOpen, X } from 'lucide-react';
import { getAllProblems, getAllTopics, getProblemStats } from '../utils/problemLoader';
import ProblemCard from '../components/ProblemCard';

export default function Problems() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Discover problems and metadata dynamically
  const problems = useMemo(() => getAllProblems(), []);
  const allTopics = useMemo(() => getAllTopics(), []);
  const stats = useMemo(() => getProblemStats(), []);

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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="text-neutral-400">Total:</span>
              <span className="font-semibold text-white font-mono">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-neutral-400">Easy:</span>
              <span className="font-semibold text-emerald-400 font-mono">{stats.easy}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-neutral-400">Med:</span>
              <span className="font-semibold text-amber-400 font-mono">{stats.medium}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-neutral-400">Hard:</span>
              <span className="font-semibold text-rose-400 font-mono">{stats.hard}</span>
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

            {/* Difficulty Selector */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Topic Selector */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
              <span>Filtering by:</span>
              {selectedDifficulty !== 'All' && (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                  Difficulty: {selectedDifficulty}
                </span>
              )}
              {selectedTopic !== 'All' && (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                  Topic: {selectedTopic}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                  Query: "{searchQuery}"
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1 cursor-pointer font-medium"
              >
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* Problem List Section */}
        <div className="space-y-3">
          {/* Table column headers (Desktop) */}
          <div className="hidden md:flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 border-b border-[#21262d]/60">
            <div className="flex items-center gap-3.5">
              <span className="w-7">#</span>
              <span>Title</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="w-20 text-center">Difficulty</span>
              <span className="w-48 text-right pr-6">Topics</span>
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
