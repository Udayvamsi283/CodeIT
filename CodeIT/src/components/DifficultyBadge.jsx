export default function DifficultyBadge({ difficulty, size = 'sm' }) {
  const diffLower = (difficulty || '').toLowerCase();

  let colorClasses = 'text-neutral-400 bg-neutral-800/60 border-neutral-700/50';

  if (diffLower === 'easy') {
    colorClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (diffLower === 'medium') {
    colorClasses = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (diffLower === 'hard') {
    colorClasses = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }

  const sizeClasses = size === 'xs' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses} tracking-wide`}
    >
      {difficulty || 'Unknown'}
    </span>
  );
}
