import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, GripVertical } from 'lucide-react';
import { getProblemById, getAllProblems, getPracticeHiddenTests } from '../utils/problemLoader';
import ProblemDescription from '../components/ProblemDescription';
import CodeEditor from '../components/CodeEditor';
import TestResults from '../components/TestResults';
import { API_BASE_URL } from '../config/api';

export default function Problem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('python');
  
  // Independent state for Run Code vs Submit
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Practice Mode state (Architecture ready for future Test Mode switching)
  const [practiceTestResults, setPracticeTestResults] = useState({});
  const [practiceRunningIndex, setPracticeRunningIndex] = useState(null);

  // Draggable horizontal split state (Default: 45% Problem, 55% Editor)
  const [splitRatio, setSplitRatio] = useState(0.45);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Load public problem and all problems for prev/next navigation
  const allProblems = useMemo(() => getAllProblems(), []);
  const problem = useMemo(() => getProblemById(id), [id]);

  // PRACTICE MODE ONLY: separate local hidden cases for practice inspection
  const practiceHiddenCases = useMemo(() => getPracticeHiddenTests(id), [id]);

  const currentIndex = allProblems.findIndex((p) => p.id === id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  // Draggable split handler
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(Math.max(newRatio, 0.3), 0.65));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  // Run Code (Only 3 public examples)
  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    const sourceCodeToRun = currentCode || problem.starterCode?.[currentLanguage] || '';
    setIsRunning(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemId: problem.id,
          language: currentLanguage,
          sourceCode: sourceCodeToRun,
        }),
      });

      const data = await response.json();
      setRunResult(data);
    } catch (err) {
      console.error('Run code request failed:', err);
      setRunResult({
        success: false,
        status: 'JUDGE_UNAVAILABLE',
        message: 'Could not connect to the backend server. Please verify backend service availability or network connection.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit (All 15 test cases: 3 public + 12 hidden)
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    const sourceCodeToSubmit = currentCode || problem.starterCode?.[currentLanguage] || '';
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemId: problem.id,
          language: currentLanguage,
          sourceCode: sourceCodeToSubmit,
        }),
      });

      const data = await response.json();
      setSubmitResult(data);
    } catch (err) {
      console.error('Submit request failed:', err);
      setSubmitResult({
        success: false,
        status: 'JUDGE_UNAVAILABLE',
        message: 'Could not connect to the backend server. Please verify backend service availability or network connection.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Practice Mode: Run single hidden test case
  const handleRunPracticeTest = async (testCaseIndex) => {
    if (!problem || isRunning || isSubmitting || practiceRunningIndex !== null) return;

    const sourceCodeToRun = currentCode || problem.starterCode?.[currentLanguage] || '';
    setPracticeRunningIndex(testCaseIndex);

    try {
      const response = await fetch(`${API_BASE_URL}/api/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemId: problem.id,
          testCaseIndex,
          language: currentLanguage,
          sourceCode: sourceCodeToRun,
        }),
      });

      const data = await response.json();
      setPracticeTestResults((prev) => ({
        ...prev,
        [testCaseIndex]: data
      }));
    } catch (err) {
      console.error('Practice test request failed:', err);
      setPracticeTestResults((prev) => ({
        ...prev,
        [testCaseIndex]: {
          success: false,
          status: 'JUDGE_UNAVAILABLE',
          actualOutput: 'Could not connect to backend server.'
        }
      }));
    } finally {
      setPracticeRunningIndex(null);
    }
  };

  if (!problem) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-6 text-center bg-[#0d1117]">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Problem Not Found</h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6">
          The requested problem ID <code className="text-amber-400 font-mono">"{id}"</code> could not be found in <code className="text-neutral-300 font-mono">src/problems/</code>.
        </p>
        <Link
          to="/problems"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problem List
        </Link>
      </div>
    );
  }

  const leftWidthPct = `${splitRatio * 100}%`;
  const rightWidthPct = `${(1 - splitRatio) * 100}%`;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#0d1117] overflow-hidden">
      {/* Sub-Header Bar: Breadcrumb + Prev/Next Navigation */}
      <div className="shrink-0 h-10 px-4 sm:px-6 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="font-semibold text-neutral-200 truncate max-w-[200px] sm:max-w-xs">
            {problem.title}
          </span>
        </div>

        {/* Right: Prev / Next Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setRunResult(null);
              setSubmitResult(null);
              setPracticeTestResults({});
              prevProblem && navigate(`/problem/${prevProblem.id}`);
            }}
            disabled={!prevProblem}
            className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[#21262d] transition-colors cursor-pointer"
            title={prevProblem ? `Previous: ${prevProblem.title}` : 'No previous problem'}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Prev</span>
          </button>

          <button
            onClick={() => {
              setRunResult(null);
              setSubmitResult(null);
              setPracticeTestResults({});
              nextProblem && navigate(`/problem/${nextProblem.id}`);
            }}
            disabled={!nextProblem}
            className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[#21262d] transition-colors cursor-pointer"
            title={nextProblem ? `Next: ${nextProblem.title}` : 'No next problem'}
          >
            <span className="hidden md:inline text-[11px]">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Desktop Draggable Split / Mobile Vertical Stack */}
      <div 
        ref={containerRef}
        style={{
          '--left-width': leftWidthPct,
          '--right-width': rightWidthPct
        }}
        className="flex-1 overflow-y-auto lg:overflow-hidden p-3 sm:p-4 flex flex-col lg:flex-row gap-0 min-h-0 relative"
      >
        {/* Left Column: Problem Description */}
        <div 
          className="w-full lg:w-[var(--left-width)] shrink-0 bg-[#161b22]/70 border border-[#21262d] rounded-xl lg:rounded-r-none p-4 sm:p-5 overflow-hidden flex flex-col h-auto lg:h-full shadow-xs"
        >
          <ProblemDescription problem={problem} />
        </div>

        {/* Draggable Divider (Desktop Only) */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          className={`hidden lg:flex items-center justify-center w-2.5 hover:w-2.5 cursor-col-resize select-none shrink-0 transition-colors z-20 group relative ${
            isDragging ? 'bg-blue-600/40' : 'hover:bg-blue-500/20 bg-transparent'
          }`}
          title="Drag to resize panes (30% to 65%)"
        >
          <div className={`w-1 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-500' : 'bg-[#30363d] group-hover:bg-blue-400'
          }`}>
            <GripVertical className="w-2.5 h-2.5 text-neutral-400 opacity-60 group-hover:opacity-100" />
          </div>
        </div>

        {/* Right Column: Code Editor + Test Case Panel */}
        <div 
          className="w-full lg:w-[var(--right-width)] flex flex-col gap-3 h-[850px] lg:h-full min-h-0 mt-3 lg:mt-0"
        >
          {/* Top: Monaco Editor Workspace */}
          <div className="flex-[3] min-h-[350px]">
            <CodeEditor
              problem={problem}
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onCodeChange={setCurrentCode}
            />
          </div>

          {/* Bottom: Test Cases, Run Results, & Submission Panel */}
          <div className="flex-[2] min-h-[260px]">
            <TestResults
              problem={problem}
              practiceHiddenCases={practiceHiddenCases}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              practiceRunningIndex={practiceRunningIndex}
              runResult={runResult}
              submitResult={submitResult}
              practiceTestResults={practiceTestResults}
              onRunCode={handleRunCode}
              onSubmitCode={handleSubmitCode}
              onRunPracticeTest={handleRunPracticeTest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
