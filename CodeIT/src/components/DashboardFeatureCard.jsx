import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';

export default function DashboardFeatureCard({
  title,
  description,
  icon: Icon,
  actionText,
  to,
  isComingSoon = false,
  badgeText
}) {
  const content = (
    <div
      className={`h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
        isComingSoon
          ? 'bg-[#161b22]/40 border-[#21262d] opacity-80 cursor-default select-none'
          : 'bg-[#161b22]/80 hover:bg-[#1c2128] border-[#21262d] hover:border-[#38424d] shadow-sm hover:shadow-md cursor-pointer group'
      }`}
    >
      <div className="space-y-4">
        {/* Header: Icon + Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isComingSoon
                ? 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/40'
                : 'bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600/20 group-hover:border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
            }`}
          >
            {Icon && <Icon className="w-5 h-5" />}
          </div>

          {isComingSoon ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-amber-400">
              <Lock className="w-3 h-3" />
              <span>Coming Soon</span>
            </span>
          ) : badgeText ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2.5 py-0.5 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-300">
              <Sparkles className="w-3 h-3" />
              <span>{badgeText}</span>
            </span>
          ) : null}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3
            className={`text-base font-semibold transition-colors ${
              isComingSoon ? 'text-neutral-300' : 'text-white group-hover:text-blue-400'
            }`}
          >
            {title}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="pt-5 border-t border-[#21262d]/60 mt-4">
        {isComingSoon ? (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
            <span>Feature under development</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
            <span>{actionText || 'Explore'}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );

  if (isComingSoon || !to) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <Link to={to} className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl">
      {content}
    </Link>
  );
}
