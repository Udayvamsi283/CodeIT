import { Link } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

export default function ProblemCard({ problem, index, progress }) {
  const formattedIndex = String(index + 1).padStart(2, '0');
  const status = typeof progress === 'object' ? progress?.status : progress;

  // Maximum number of topic pills before grouping with +N
  const maxDisplayTopics = 4;
  const visibleTopics = problem.topics ? problem.topics.slice(0, maxDisplayTopics) : [];
  const remainingCount = problem.topics && problem.topics.length > maxDisplayTopics
    ? problem.topics.length - maxDisplayTopics
    : 0;

  return (
    <Link
      to={`/problem/${problem.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-[#161b22]/70 hover:bg-[#1c2128] border border-[#21262d] hover:border-[#30363d] transition-all duration-150 shadow-xs hover:shadow-md"
    >
      {/* Left: Status + Number + Title (Top) + Topics (Bottom) */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Status & Problem Number */}
        <div className="flex items-center gap-2 pt-0.5 shrink-0">
          {status === 'SOLVED' ? (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0"
              title="Solved"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
          ) : status === 'ATTEMPTED' ? (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 text-[10px] font-bold"
              title="Attempted"
            >
              ◐
            </span>
          ) : (
            <span
              className="w-5 h-5 flex items-center justify-center text-neutral-600 shrink-0 text-xs font-mono"
              title="Not attempted"
            >
              ○
            </span>
          )}
          <span className="font-mono text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors w-5 shrink-0">
            {formattedIndex}
          </span>
        </div>

        {/* Title + Topics Column */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Primary Row: Title + subtle ID */}
          <div className="flex items-baseline gap-2 flex-wrap sm:flex-nowrap">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-200 group-hover:text-blue-400 transition-colors truncate">
              {problem.title}
            </h3>
            <span className="text-[11px] font-mono text-neutral-600 group-hover:text-neutral-500 transition-colors shrink-0">
              #{problem.id}
            </span>
          </div>

          {/* Secondary Row: Topic Tags */}
          {problem.topics && problem.topics.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {visibleTopics.map((topic) => (
                <span
                  key={topic}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#0d1117]/80 text-neutral-400 border border-[#21262d] group-hover:border-[#30363d] transition-colors"
                >
                  {topic}
                </span>
              ))}
              {remainingCount > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1117]/60 text-neutral-500 border border-[#21262d]"
                  title={`${remainingCount} more topics`}
                >
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Difficulty Badge + Navigation Arrow */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-10 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#21262d]/40">
        <DifficultyBadge difficulty={problem.difficulty} size="sm" />
        <div className="flex items-center text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-150">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
