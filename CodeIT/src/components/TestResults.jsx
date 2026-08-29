import { useState, useEffect } from 'react';
import { 
  Play, 
  Send,
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Layers, 
  AlertOctagon, 
  ServerOff, 
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

export default function TestResults({ 
  problem,
  practiceHiddenCases = [],
  isRunning = false,
  isSubmitting = false,
  isCustomTesting = false,
  practiceRunningIndex = null,
  runResult = null, 
  submitResult = null,
  practiceTestResults = {},
  customTestResult = null,
  isCustomTestAvailable = null,
  customInput = '',
  onCustomInputChange,
  onRunCode,
  onSubmitCode,
  onRunPracticeTest,
  onRunCustomTest
}) {
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'result' | 'submission'
  const [selectedTestCategory, setSelectedTestCategory] = useState('public'); // 'public' | 'hidden'
  const [selectedPublicCase, setSelectedPublicCase] = useState(0);
  const [selectedHiddenCase, setSelectedHiddenCase] = useState(0);
  const [expandedPassedCases, setExpandedPassedCases] = useState(new Set());
  const [expandedPublicSubmitCases, setExpandedPublicSubmitCases] = useState(new Set());
  const [expandedHiddenSubmitCases, setExpandedHiddenSubmitCases] = useState(new Set());

  // 3 public sample examples
  const sampleCases = problem?.examples || [];

  // Automatically switch tab when an action triggers
  useEffect(() => {
    if (isRunning) {
      setActiveTab('result');
    }
  }, [isRunning]);

  useEffect(() => {
    if (isSubmitting) {
      setActiveTab('submission');
    }
  }, [isSubmitting]);

  const handleRun = () => {
    if (onRunCode && !isRunning && !isSubmitting) {
      onRunCode();
    }
  };

  const handleSubmit = () => {
    if (onSubmitCode && !isRunning && !isSubmitting) {
      onSubmitCode();
    }
  };

  const togglePassedCaseExpand = (idx) => {
    setExpandedPassedCases((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const togglePublicSubmitCaseExpand = (idx) => {
    setExpandedPublicSubmitCases((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleHiddenSubmitCaseExpand = (idx) => {
    setExpandedHiddenSubmitCases((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const currentPublicCase = sampleCases[selectedPublicCase];
  const currentHiddenCase = practiceHiddenCases[selectedHiddenCase];
  const hiddenTestCaseIndex = selectedHiddenCase + 4; // Backend testCaseIndex: 4 to 15
  const currentHiddenResult = practiceTestResults[hiddenTestCaseIndex];
  const isRunningCurrentHidden = practiceRunningIndex === hiddenTestCaseIndex;
  const isBusy = isRunning || isSubmitting || isCustomTesting;

  // Render Run Code Results (Public 3 Cases with Expected vs Actual Output)
  const renderRunResultContent = () => {
    if (isRunning) {
      return (
        <div className="h-full flex flex-col justify-center items-center py-8 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Running 3 public test cases...</p>
            <p className="text-xs text-neutral-400">Executing against public examples via Judge0</p>
          </div>
        </div>
      );
    }

    if (!runResult) {
      return (
        <div className="h-full flex flex-col justify-center items-center py-8 text-center text-xs text-neutral-400 space-y-1.5">
          <Terminal className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
          <p className="font-medium text-neutral-300">No Run Results Yet</p>
          <p className="text-neutral-500 text-xs">
            Click "Run Code" to test your solution against the 3 visible examples.
          </p>
        </div>
      );
    }

    const { success, status, summary, testCases = [], compileOutput, message, error } = runResult;

    // Judge Unavailable
    if (status === 'JUDGE_UNAVAILABLE') {
      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ServerOff className="w-4 h-4" />
            <span>Judge Service Unavailable</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            {message || 'Code execution service is currently unavailable.'}
          </div>
        </div>
      );
    }

    // Invalid Problem
    if (status === 'INVALID_PROBLEM') {
      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Problem Configuration Error</span>
          </div>
          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            {message || 'Problem must contain exactly 3 examples and 12 hidden test cases.'}
          </p>
        </div>
      );
    }

    // Compilation Error
    if (status === 'COMPILATION_ERROR') {
      return (
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertOctagon className="w-4 h-4" />
            <span>Compilation Error</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-neutral-400">Compiler Message:</div>
            <pre className="p-3 bg-[#0d1117] border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300/90 whitespace-pre-wrap overflow-x-auto max-h-48 selection:bg-rose-600/30">
              {compileOutput || 'Compilation failed without output.'}
            </pre>
          </div>
        </div>
      );
    }

    // Execution / Validation Error
    if (!success && error) {
      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Execution Error</span>
          </div>
          <p className="text-xs text-neutral-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            {error}
          </p>
        </div>
      );
    }

    const isAccepted = status === 'ACCEPTED';
    const passedCount = summary?.passed ?? 0;
    const totalCount = summary?.total ?? testCases.length;

    let statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    let statusLabel = 'Wrong Answer';
    let StatusIcon = XCircle;

    if (isAccepted) {
      statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      statusLabel = 'Accepted';
      StatusIcon = CheckCircle2;
    } else if (status === 'TIME_LIMIT_EXCEEDED') {
      statusBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      statusLabel = 'Time Limit Exceeded';
      StatusIcon = Clock;
    } else if (status === 'RUNTIME_ERROR') {
      statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      statusLabel = 'Runtime Error';
      StatusIcon = AlertTriangle;
    }

    return (
      <div className="space-y-4">
        {/* Status Header Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          </div>
          <div className="text-xs font-mono text-neutral-400">
            <strong className="text-white font-semibold">{passedCount}</strong> / {totalCount} public tests passed
          </div>
        </div>

        {/* Per Public Test Case Cards with Expected vs Actual Output */}
        <div className="space-y-3">
          {testCases.map((tc) => {
            const isPassed = tc.status === 'PASSED';
            const isTle = tc.status === 'TIME_LIMIT_EXCEEDED';
            const isRe = tc.status === 'RUNTIME_ERROR';
            const isExpanded = expandedPassedCases.has(tc.index);

            return (
              <div
                key={tc.index}
                className={`rounded-lg border text-xs transition-colors overflow-hidden ${
                  isPassed
                    ? 'bg-[#161b22]/50 border-[#21262d]'
                    : 'bg-rose-950/15 border-rose-900/40'
                }`}
              >
                {/* Case Header */}
                <div 
                  onClick={() => togglePassedCaseExpand(tc.index)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold text-neutral-100">Case {tc.index}</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      isPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isTle
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : isRe
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {isPassed ? 'Passed' : isTle ? 'Time Limit' : isRe ? 'Runtime Error' : 'Wrong Answer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {tc.executionTime && (
                      <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {tc.executionTime}
                      </span>
                    )}

                    {isPassed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePassedCaseExpand(tc.index);
                        }}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                        title={isExpanded ? 'Hide details' : 'Show output details'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section: Always visible for failures, collapsible for passed */}
                {(!isPassed || isExpanded) && (
                  <div className="px-3 pb-3 pt-1 border-t border-[#21262d]/60 space-y-2.5">
                    {/* Expected Output */}
                    {tc.expectedOutput !== undefined && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output:</div>
                        <pre className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
                          {tc.expectedOutput || '(empty output)'}
                        </pre>
                      </div>
                    )}

                    {/* Actual Output */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-neutral-400 font-medium">Your Output:</div>
                      <pre className={`p-2.5 rounded bg-[#0d1117] border text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                        isPassed
                          ? 'border-[#21262d] text-neutral-200'
                          : 'border-rose-500/30 text-rose-300'
                      }`}>
                        {tc.actualOutput || '(no output produced)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Full Submission Results (15 Cases: 3 Public + 12 Hidden with Expandable Drawers)
  const renderSubmitResultContent = () => {
    if (isSubmitting) {
      return (
        <div className="h-full flex flex-col justify-center items-center py-8 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Evaluating 15 test cases...</p>
            <p className="text-xs text-neutral-400">Running 3 public examples + 12 hidden test cases</p>
          </div>
        </div>
      );
    }

    if (!submitResult) {
      return (
        <div className="h-full flex flex-col justify-center items-center py-8 text-center text-xs text-neutral-400 space-y-1.5">
          <Send className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
          <p className="font-medium text-neutral-300">No Submission Made</p>
          <p className="text-neutral-500 text-xs">
            Click "Submit" above to evaluate your code against all 15 test cases.
          </p>
        </div>
      );
    }

    const { success, status, summary, execution, compileOutput, testCases = [], message, error } = submitResult;

    // Judge Unavailable
    if (status === 'JUDGE_UNAVAILABLE') {
      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ServerOff className="w-4 h-4" />
            <span>Submission Service Unavailable</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            {message || 'Code execution service is currently unavailable.'}
          </div>
        </div>
      );
    }

    // Invalid Problem
    if (status === 'INVALID_PROBLEM') {
      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Problem Configuration Error</span>
          </div>
          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            {message || 'Problem must contain exactly 3 examples and 12 hidden test cases.'}
          </p>
        </div>
      );
    }

    // Compilation Error
    if (status === 'COMPILATION_ERROR') {
      return (
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertOctagon className="w-4 h-4" />
            <span>Compilation Error</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-neutral-400">Compiler Message:</div>
            <pre className="p-3 bg-[#0d1117] border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300/90 whitespace-pre-wrap overflow-x-auto max-h-48 selection:bg-rose-600/30">
              {compileOutput || 'Compilation failed without output.'}
            </pre>
          </div>
        </div>
      );
    }

    // General / Validation Error
    if (!success && error) {
      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Submission Error</span>
          </div>
          <p className="text-xs text-neutral-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            {error}
          </p>
        </div>
      );
    }

    const isAccepted = status === 'ACCEPTED';
    const passedTotal = summary?.passed ?? 0;
    const grandTotal = summary?.total ?? 15;
    const publicPassed = summary?.publicPassed ?? 0;
    const publicTotal = summary?.publicTotal ?? 3;
    const hiddenPassed = summary?.hiddenPassed ?? 0;
    const hiddenTotal = summary?.hiddenTotal ?? 12;

    let bannerColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    let bannerTitle = 'Wrong Answer';
    let BannerIcon = XCircle;

    if (isAccepted) {
      bannerColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      bannerTitle = 'Accepted';
      BannerIcon = CheckCircle2;
    } else if (status === 'TIME_LIMIT_EXCEEDED') {
      bannerColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      bannerTitle = 'Time Limit Exceeded';
      BannerIcon = Clock;
    } else if (status === 'RUNTIME_ERROR') {
      bannerColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      bannerTitle = 'Runtime Error';
      BannerIcon = AlertTriangle;
    }

    // Separate public and hidden test cases for display
    const publicTestCases = testCases.filter((tc) => tc.visibility === 'PUBLIC' || tc.index <= 3);
    const hiddenTestCases = testCases.filter((tc) => tc.visibility === 'HIDDEN' || tc.index > 3);

    return (
      <div className="space-y-4">
        {/* Main Status Card */}
        <div className={`p-4 rounded-xl border ${bannerColor} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BannerIcon className="w-5 h-5" />
              <h3 className="text-base font-bold tracking-tight">{bannerTitle}</h3>
            </div>
            {execution?.time && (
              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {execution.time}
              </span>
            )}
          </div>

          <div className="text-sm font-medium text-neutral-200">
            <strong className="text-white text-base font-bold font-mono">{passedTotal}</strong> / {grandTotal} test cases passed
          </div>
        </div>

        {/* Aggregate Breakdown Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Public Tests */}
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Public Examples</span>
              <span className="font-mono font-semibold text-neutral-200">
                {publicPassed} / {publicTotal}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#161b22] overflow-hidden">
              <div 
                className={`h-full rounded-full ${publicPassed === publicTotal ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${(publicPassed / publicTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Hidden Tests */}
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Hidden Tests
              </span>
              <span className="font-mono font-semibold text-neutral-200">
                {hiddenPassed} / {hiddenTotal}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#161b22] overflow-hidden">
              <div 
                className={`h-full rounded-full ${hiddenPassed === hiddenTotal ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${(hiddenPassed / hiddenTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Security Note on Hidden Tests */}
        <div className="p-3 rounded-lg bg-[#0d1117]/60 border border-[#21262d] text-xs text-neutral-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isAccepted
              ? 'Congratulations! Your solution satisfied all public examples and confidential judge test cases.'
              : 'Some test cases did not pass. Expand each test case below to inspect details and diagnostics.'}
          </p>
        </div>

        {/* Detailed Per-Test Breakdown (15 Test Cases) */}
        {testCases.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#21262d]">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Test Results ({testCases.length})
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">3 Public + 12 Hidden</span>
            </div>

            {/* 1. PUBLIC TEST CASES (1–3) */}
            {publicTestCases.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Public Test Cases
                </div>
                <div className="space-y-2">
                  {publicTestCases.map((tc) => {
                    const isPassed = tc.status === 'PASSED';
                    const isTle = tc.status === 'TIME_LIMIT_EXCEEDED';
                    const isRe = tc.status === 'RUNTIME_ERROR';
                    const isExpanded = expandedPublicSubmitCases.has(tc.index);

                    return (
                      <div
                        key={tc.index}
                        className={`rounded-lg border text-xs transition-colors overflow-hidden ${
                          isPassed
                            ? 'bg-[#161b22]/50 border-[#21262d]'
                            : 'bg-rose-950/15 border-rose-900/40'
                        }`}
                      >
                        {/* Case Header */}
                        <div 
                          onClick={() => togglePublicSubmitCaseExpand(tc.index)}
                          className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="font-semibold text-neutral-100">Test Case {tc.index}</span>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isTle
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : isRe
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {isPassed ? 'Passed' : isTle ? 'Time Limit' : isRe ? 'Runtime Error' : 'Wrong Answer'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {tc.executionTime && (
                              <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {tc.executionTime}
                              </span>
                            )}
                            {tc.memory && (
                              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                                <Cpu className="w-3 h-3" />
                                {tc.memory}
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePublicSubmitCaseExpand(tc.index);
                              }}
                              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide details' : 'Show output details'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Details Section for Public Test (Failures auto-visible or expanded) */}
                        {(!isPassed || isExpanded) && (
                          <div className="px-3 pb-3 pt-1 border-t border-[#21262d]/60 space-y-2.5">
                            {tc.expectedOutput !== undefined && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output:</div>
                                <pre className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
                                  {tc.expectedOutput || '(empty output)'}
                                </pre>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="text-[11px] font-mono text-neutral-400 font-medium">Your Output:</div>
                              <pre className={`p-2 rounded bg-[#0d1117] border text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                                isPassed
                                  ? 'border-[#21262d] text-neutral-200'
                                  : 'border-rose-500/30 text-rose-300'
                              }`}>
                                {tc.actualOutput || '(no output produced)'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. HIDDEN TEST CASES (4–15) WITH EXPAND/COLLAPSE TOGGLES */}
            {hiddenTestCases.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Hidden Test Cases
                </div>
                <div className="space-y-2">
                  {hiddenTestCases.map((tc) => {
                    const isPassed = tc.status === 'PASSED';
                    const isTle = tc.status === 'TIME_LIMIT_EXCEEDED';
                    const isRe = tc.status === 'RUNTIME_ERROR';
                    const hiddenIdx = tc.index - 4; // 0 to 11
                    const hiddenNumber = tc.index - 3; // Hidden Test 1 to Hidden Test 12
                    const hiddenData = practiceHiddenCases[hiddenIdx];
                    const isExpanded = expandedHiddenSubmitCases.has(tc.index);
                    const practiceResult = practiceTestResults[tc.index];
                    const actualOutput = tc.actualOutput || practiceResult?.actualOutput || null;

                    return (
                      <div
                        key={tc.index}
                        className={`rounded-lg border text-xs transition-colors overflow-hidden ${
                          isPassed
                            ? 'bg-[#161b22]/50 border-[#21262d]'
                            : 'bg-rose-950/15 border-rose-900/40'
                        }`}
                      >
                        {/* Case Header - Clickable anywhere to toggle */}
                        <div 
                          onClick={() => toggleHiddenSubmitCaseExpand(tc.index)}
                          className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                        >
                          {/* Left: Status and Title */}
                          <div className="flex items-center gap-2.5">
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="font-semibold text-neutral-100">Hidden Test {hiddenNumber}</span>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isTle
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : isRe
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {isPassed ? 'Passed' : isTle ? 'Time Limit' : isRe ? 'Runtime Error' : 'Wrong Answer'}
                            </span>
                          </div>

                          {/* Right: Metrics & Expand Button */}
                          <div className="flex items-center gap-3">
                            {tc.executionTime && (
                              <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {tc.executionTime}
                              </span>
                            )}
                            {tc.memory && (
                              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                                <Cpu className="w-3 h-3" />
                                {tc.memory}
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHiddenSubmitCaseExpand(tc.index);
                              }}
                              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide details' : 'Show details'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content Drawer for Hidden Test */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-[#21262d]/60 space-y-2.5">
                            {/* Input */}
                            {hiddenData?.input && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-mono text-neutral-400 font-medium">Input:</div>
                                <pre className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre-wrap max-h-32">
                                  {hiddenData.input}
                                </pre>
                              </div>
                            )}

                            {/* Expected Output */}
                            {hiddenData?.output && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output:</div>
                                <pre className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap max-h-32">
                                  {hiddenData.output}
                                </pre>
                              </div>
                            )}

                            {/* Your Output */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-mono text-neutral-400 font-medium">Your Output:</div>
                              <pre className={`p-2 rounded bg-[#0d1117] border text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                                isPassed
                                  ? 'border-[#21262d] text-neutral-200'
                                  : 'border-rose-500/30 text-rose-300'
                              }`}>
                                {actualOutput || (isPassed ? '(passed matching output)' : '(no output available for this submission test)')}
                              </pre>
                            </div>

                            {/* Status, Runtime, Memory summary footer */}
                            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#21262d]/40">
                              <span className="flex items-center gap-1.5">
                                <span>Status:</span>
                                <span className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isPassed ? '✓ Passed' : isTle ? '⏱ Time Limit' : isRe ? '⚠ Runtime Error' : '✗ Wrong Answer'}
                                </span>
                              </span>
                              <div className="flex items-center gap-3">
                                {tc.executionTime && <span>Runtime: {tc.executionTime}</span>}
                                {tc.memory && <span>Memory: {tc.memory}</span>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#21262d] rounded-lg overflow-hidden shadow-xs">
      {/* Header bar with Tabs and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#12161c] border-b border-[#21262d] gap-2 shrink-0">
        {/* Left: Top-level Tab selection */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'cases'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Cases</span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'result'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Result</span>
            {runResult && (
              <span className={`w-1.5 h-1.5 rounded-full ${
                runResult.status === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('submission')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'submission'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Submission</span>
            {submitResult && (
              <span className={`w-1.5 h-1.5 rounded-full ${
                submitResult.status === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
            )}
          </button>
        </div>

        {/* Right: Dual Action Buttons [ Run Code ] and [ Submit ] */}
        <div className="flex items-center gap-2">
          {/* Run Code Button */}
          <button
            onClick={handleRun}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-200 bg-[#21262d] hover:bg-[#30363d] active:bg-[#161b22] border border-[#38424d] disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-xs transition-colors cursor-pointer"
            title="Test solution against the 3 public examples"
          >
            <Play className={`w-3 h-3 fill-current text-blue-400 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-xs transition-colors cursor-pointer"
            title="Submit solution against all 15 test cases (3 public + 12 hidden)"
          >
            <Send className={`w-3 h-3 ${isSubmitting ? 'animate-pulse' : ''}`} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4">
        {activeTab === 'cases' ? (
          <div className="space-y-4">
            {/* Top Sub-tabs: [ Public (3) ] vs [ Hidden (12) ] vs [ Custom Test ] */}
            <div className="flex items-center gap-1 p-0.5 bg-[#0d1117] border border-[#21262d] rounded-lg w-fit">
              <button
                onClick={() => setSelectedTestCategory('public')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedTestCategory === 'public'
                    ? 'bg-[#21262d] text-white shadow-xs border border-[#38424d]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Public ({sampleCases.length})
              </button>
              <button
                onClick={() => setSelectedTestCategory('hidden')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedTestCategory === 'hidden'
                    ? 'bg-[#21262d] text-white shadow-xs border border-[#38424d]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Hidden ({practiceHiddenCases.length})
              </button>
              <button
                onClick={() => setSelectedTestCategory('custom')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedTestCategory === 'custom'
                    ? 'bg-[#21262d] text-white shadow-xs border border-[#38424d]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>Custom Test</span>
                {isCustomTestAvailable === true && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom Test Available" />
                )}
                {customTestResult && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    customTestResult.status === 'PASSED' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                )}
              </button>
            </div>

            {/* Sub-tab 1: PUBLIC TEST CASES */}
            {selectedTestCategory === 'public' && (
              <div className="space-y-3">
                {sampleCases.length > 0 ? (
                  <>
                    {/* Public Case Selector Pills: [ Case 1 ] [ Case 2 ] [ Case 3 ] */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sampleCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPublicCase(idx)}
                          className={`text-xs font-medium px-3 py-1 rounded-md transition-colors cursor-pointer ${
                            selectedPublicCase === idx
                              ? 'bg-[#21262d] text-white border border-[#38424d]'
                              : 'bg-[#0d1117] text-neutral-400 border border-[#21262d] hover:text-neutral-200'
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Public Case Details */}
                    {currentPublicCase && (
                      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono text-neutral-400 font-medium">Input</div>
                          <pre className="p-2.5 rounded bg-[#161b22] border border-[#21262d] text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre-wrap">
                            {currentPublicCase.input}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output</div>
                          <pre className="p-2.5 rounded bg-[#161b22] border border-[#21262d] text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
                            {currentPublicCase.output}
                          </pre>
                        </div>

                        {currentPublicCase.explanation && (
                          <div className="space-y-1 pt-1 border-t border-[#21262d]/60">
                            <div className="text-[11px] font-mono text-neutral-400 font-medium">Explanation</div>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {currentPublicCase.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-neutral-500 py-2">No public examples available.</p>
                )}
              </div>
            )}

            {/* Sub-tab 2: HIDDEN TEST CASES (PRACTICE) */}
            {selectedTestCategory === 'hidden' && (
              <div className="space-y-3">
                {practiceHiddenCases.length > 0 ? (
                  <>
                    {/* Compact Hidden Case Selector Pills: [ 1 ] [ 2 ] ... [ 12 ] */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {practiceHiddenCases.map((_, idx) => {
                        const testIndex = idx + 4; // Test 4 to 15
                        const result = practiceTestResults[testIndex];
                        const isSelected = selectedHiddenCase === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedHiddenCase(idx)}
                            className={`relative text-xs font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#21262d] text-white border border-[#38424d]'
                                : 'bg-[#0d1117] text-neutral-400 border border-[#21262d] hover:text-neutral-200'
                            }`}
                            title={`Hidden Case ${idx + 1} (Test #${testIndex})`}
                          >
                            <span>{idx + 1}</span>
                            {result && (
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${
                                result.status === 'PASSED' ? 'bg-emerald-400' : 'bg-rose-400'
                              }`} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Hidden Case Details */}
                    {currentHiddenCase && (
                      <div className="p-3.5 rounded-lg border border-[#21262d] bg-[#0d1117] space-y-3 transition-colors">
                        {/* Hidden Case Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold text-neutral-200">
                              Hidden Case {selectedHiddenCase + 1}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              (Test #{hiddenTestCaseIndex})
                            </span>

                            {currentHiddenResult && (
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                currentHiddenResult.status === 'PASSED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {currentHiddenResult.status === 'PASSED' ? 'Passed' : currentHiddenResult.status}
                              </span>
                            )}
                          </div>

                          {currentHiddenResult?.executionTime && (
                            <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              {currentHiddenResult.executionTime}
                            </span>
                          )}
                        </div>

                        {/* Input Block */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono text-neutral-400 font-medium">Input</div>
                          <pre className="p-2.5 rounded bg-[#161b22] border border-[#21262d] text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre-wrap max-h-36">
                            {currentHiddenCase.input}
                          </pre>
                        </div>

                        {/* Expected Output Block */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output</div>
                          <pre className="p-2.5 rounded bg-[#161b22] border border-[#21262d] text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap max-h-36">
                            {currentHiddenCase.output}
                          </pre>
                        </div>

                        {/* Run This Test Action */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onRunPracticeTest && onRunPracticeTest(hiddenTestCaseIndex)}
                            disabled={isBusy || isRunningCurrentHidden}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors cursor-pointer shadow-xs"
                          >
                            <Play className={`w-3 h-3 fill-current ${isRunningCurrentHidden ? 'animate-spin' : ''}`} />
                            <span>{isRunningCurrentHidden ? 'Running Test...' : 'Run This Test'}</span>
                          </button>
                        </div>

                        {/* Actual Output from Practice Run */}
                        {currentHiddenResult && (
                          <div className="space-y-1 pt-2 border-t border-[#21262d]/60">
                            <div className="text-[11px] font-mono text-neutral-400 font-medium">Your Output</div>
                            <pre className={`p-2.5 rounded bg-[#161b22] border text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                              currentHiddenResult.status === 'PASSED'
                                ? 'border-emerald-500/30 text-neutral-200'
                                : 'border-rose-500/30 text-rose-300'
                            }`}>
                              {currentHiddenResult.actualOutput || '(no output produced)'}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-neutral-500 py-2">No hidden test cases available.</p>
                )}
              </div>
            )}

            {/* Sub-tab 3: CUSTOM TEST CASE */}
            {selectedTestCategory === 'custom' && (
              <div className="space-y-3.5">
                {/* Unavailable State */}
                {isCustomTestAvailable === false ? (
                  <div className="p-6 rounded-lg bg-[#0d1117] border border-[#21262d] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-neutral-200">Custom Testing Unavailable</h4>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                        Custom testing is not available for this problem yet.
                      </p>
                      <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                        A trusted reference solution is required to generate expected output.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Custom Input Block */}
                    <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="custom-test-input" className="text-xs font-semibold text-neutral-200">
                          Custom Input
                        </label>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {customInput.length} chars
                        </span>
                      </div>
                      
                      <textarea
                        id="custom-test-input"
                        value={customInput}
                        onChange={(e) => onCustomInputChange && onCustomInputChange(e.target.value)}
                        placeholder="Enter custom input according to problem specification..."
                        rows={4}
                        spellCheck={false}
                        className="w-full p-2.5 rounded bg-[#161b22] border border-[#21262d] text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-y min-h-[80px]"
                      />

                      {/* Run Custom Test Action */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-neutral-400">
                          Runs this test case against your code & server reference.
                        </span>
                        <button
                          onClick={() => onRunCustomTest && onRunCustomTest(customInput)}
                          disabled={isBusy || isCustomTesting}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors cursor-pointer shadow-xs"
                        >
                          <Play className={`w-3 h-3 fill-current ${isCustomTesting ? 'animate-spin' : ''}`} />
                          <span>{isCustomTesting ? 'Running Custom Test...' : 'Run Custom Test'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Custom Test Result Display */}
                    {customTestResult && (
                      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3 transition-colors">
                        {/* Result Header & Status Badge */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-[#21262d]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-300">Custom Test Result:</span>
                            {customTestResult.status === 'PASSED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PASSED
                              </span>
                            ) : customTestResult.status === 'WRONG_ANSWER' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3.5 h-3.5" />
                                WRONG ANSWER
                              </span>
                            ) : customTestResult.status === 'COMPILATION_ERROR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertOctagon className="w-3.5 h-3.5" />
                                COMPILATION ERROR
                              </span>
                            ) : customTestResult.status === 'TIME_LIMIT_EXCEEDED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" />
                                TIME LIMIT EXCEEDED
                              </span>
                            ) : customTestResult.status === 'RUNTIME_ERROR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                RUNTIME ERROR
                              </span>
                            ) : customTestResult.status === 'CUSTOM_TEST_UNAVAILABLE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <HelpCircle className="w-3.5 h-3.5" />
                                UNAVAILABLE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {customTestResult.status || 'ERROR'}
                              </span>
                            )}
                          </div>

                          {/* Execution metrics */}
                          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                            {customTestResult.executionTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {customTestResult.executionTime}
                              </span>
                            )}
                            {customTestResult.memory && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-neutral-500">
                                <Cpu className="w-3 h-3" />
                                {customTestResult.memory}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If Compilation Error */}
                        {customTestResult.status === 'COMPILATION_ERROR' && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-mono text-neutral-400 font-medium">Compiler Message:</div>
                            <pre className="p-3 bg-[#0d1117] border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300/90 whitespace-pre-wrap overflow-x-auto max-h-48">
                              {customTestResult.compileOutput || 'Compilation failed.'}
                            </pre>
                          </div>
                        )}

                        {/* If Reference or Server Error */}
                        {(customTestResult.status === 'REFERENCE_EXECUTION_ERROR' || customTestResult.status === 'JUDGE_UNAVAILABLE' || customTestResult.status === 'CUSTOM_TEST_UNAVAILABLE') && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
                            {customTestResult.error || customTestResult.message || 'Unable to evaluate custom test.'}
                          </div>
                        )}

                        {/* Normal Output Comparison (Passed, Wrong Answer, Runtime Error, Time Limit) */}
                        {customTestResult.expectedOutput !== undefined && (
                          <div className="space-y-2.5">
                            {/* Expected Output */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-mono text-neutral-400 font-medium">Expected Output:</div>
                              <pre className="p-2.5 rounded bg-[#161b22] border border-emerald-500/30 text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap max-h-36">
                                {customTestResult.expectedOutput || '(empty output)'}
                              </pre>
                            </div>

                            {/* Your Output */}
                            <div className="space-y-1">
                              <div className="text-[11px] font-mono text-neutral-400 font-medium">Your Output:</div>
                              <pre className={`p-2.5 rounded bg-[#161b22] border text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-36 ${
                                customTestResult.status === 'PASSED'
                                  ? 'border-[#21262d] text-neutral-200'
                                  : 'border-rose-500/30 text-rose-300'
                              }`}>
                                {customTestResult.actualOutput || (customTestResult.status === 'PASSED' ? '(matching output)' : '(no output produced)')}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'result' ? (
          renderRunResultContent()
        ) : (
          renderSubmitResultContent()
        )}
      </div>
    </div>
  );
}
