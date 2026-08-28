import { Link } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

export default function ProblemCard({ problem, index, progress }) {
  const formattedIndex = String(index + 1).padStart(2, '0');
  const status = typeof progress === 'object' ? progress?.status : progress;

  return (
    <Link
      to={`/problem/${problem.id}`}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#161b22]/70 hover:bg-[#1c2128] border border-[#21262d] hover:border-[#38424d] transition-all duration-150 shadow-xs hover:shadow-md"
    >
      {/* Left section: Number + Progress Status + Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          {status === 'SOLVED' ? (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0"
              title="Solved"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
          ) : status === 'ATTEMPTED' ? (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 text-[10px]"
              title="Attempted"
            >
              ◐
            </span>
          ) : (
            <span className="w-5 h-5 flex items-center justify-center text-neutral-600 shrink-0 text-[10px]">
              ○
            </span>
          )}
          <span className="font-mono text-xs font-semibold text-neutral-500 group-hover:text-blue-400 transition-colors w-6">
            {formattedIndex}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white group-hover:underline underline-offset-4 decoration-blue-500/40 transition-colors truncate">
              {problem.title}
            </h3>
            <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500 opacity-60">
              #{problem.id}
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Difficulty + Topics + Arrow */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap justify-between md:justify-end">
        {/* Difficulty Badge */}
        <DifficultyBadge difficulty={problem.difficulty} size="sm" />

        {/* Topics Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {problem.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#0d1117] text-neutral-400 border border-[#21262d] group-hover:border-neutral-700/80 transition-colors"
            >
              {topic}
            </span>
          ))}
          {problem.topics.length > 3 && (
            <span className="text-[10px] font-mono text-neutral-500">
              +{problem.topics.length - 3}
            </span>
          )}
        </div>

        {/* Action arrow */}
        <div className="hidden sm:flex items-center text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
