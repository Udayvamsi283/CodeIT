import { useState } from 'react';
import { Tag, Check, Copy, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

export default function ProblemDescription({ problem }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!problem) {
    return (
      <div className="p-8 text-center text-neutral-400 flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-8 h-8 text-neutral-500 mb-2" />
        <p>Problem details not found.</p>
      </div>
    );
  }

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6 text-sm text-neutral-300">
      {/* Problem Header */}
      <div className="space-y-3 pb-4 border-b border-[#21262d]">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        {/* Topics */}
        {problem.topics && problem.topics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Tag className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            {problem.topics.map((topic) => (
              <span
                key={topic}
                className="text-xs px-2.5 py-0.5 rounded-md bg-[#161b22] text-neutral-300 border border-[#21262d] font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Problem Description
        </h2>
        <div className="text-neutral-200 leading-relaxed whitespace-pre-line font-normal space-y-3">
          {problem.description}
        </div>
      </div>

      {/* Input / Output Format */}
      {(problem.inputFormat || problem.outputFormat) && (
        <div className="space-y-4 pt-1">
          {problem.inputFormat && (
            <div className="space-y-1.5 bg-[#161b22]/50 p-3.5 rounded-lg border border-[#21262d]">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Input Format
              </h3>
              <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                {problem.inputFormat}
              </p>
            </div>
          )}

          {problem.outputFormat && (
            <div className="space-y-1.5 bg-[#161b22]/50 p-3.5 rounded-lg border border-[#21262d]">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Output Format
              </h3>
              <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                {problem.outputFormat}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Examples
          </h2>

          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div
                key={idx}
                className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span>Example {idx + 1}</span>
                  <button
                    onClick={() => handleCopy(`Input:\n${example.input}\nOutput:\n${example.output}`, idx)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d] hover:border-neutral-600 transition-colors cursor-pointer"
                    title="Copy example"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Input block */}
                <div className="space-y-1">
                  <div className="text-[11px] font-mono font-medium text-neutral-400">Input:</div>
                  <pre className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-neutral-200 overflow-x-auto selection:bg-blue-600/30">
                    {example.input}
                  </pre>
                </div>

                {/* Output block */}
                <div className="space-y-1">
                  <div className="text-[11px] font-mono font-medium text-neutral-400">Output:</div>
                  <pre className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-emerald-300/90 overflow-x-auto selection:bg-blue-600/30">
                    {example.output}
                  </pre>
                </div>

                {/* Explanation */}
                {example.explanation && (
                  <div className="space-y-1 pt-1 border-t border-[#21262d]/60">
                    <div className="text-[11px] font-medium text-neutral-400">Explanation:</div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {example.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div className="space-y-3 pb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Constraints
          </h2>
          <ul className="space-y-1.5 list-disc list-inside text-xs text-neutral-300 font-mono">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className="bg-[#161b22]/40 px-3 py-1.5 rounded border border-[#21262d]/60">
                <code className="text-neutral-200">{constraint}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
