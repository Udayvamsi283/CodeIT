import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Copy, Check, Code2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const LANGUAGE_CONFIG = {
  cpp: {
    label: 'C++',
    monacoLang: 'cpp',
    defaultCode: '#include <iostream>\n\nint main() {\n    return 0;\n}'
  },
  java: {
    label: 'Java',
    monacoLang: 'java',
    defaultCode: 'class Solution {\n    public static void main(String[] args) {\n    }\n}'
  },
  python: {
    label: 'Python',
    monacoLang: 'python',
    defaultCode: 'def solution():\n    pass'
  }
};

export default function CodeEditor({ problem, onCodeChange, currentLanguage, onLanguageChange }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [lang, setLang] = useState(currentLanguage || 'python');
  const [codeMap, setCodeMap] = useState({});
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  // Refs to handle race conditions and prevent redundant saves
  const activeProblemIdRef = useRef(problem?.id);
  const activeLangRef = useRef(lang);
  const lastSavedCodeRef = useRef({});
  const saveTimeoutRef = useRef(null);
  const activeLoadAbortControllerRef = useRef(null);
  const requestIdCounterRef = useRef(0);

  // Synchronize active refs
  useEffect(() => {
    activeProblemIdRef.current = problem?.id;
  }, [problem?.id]);

  useEffect(() => {
    activeLangRef.current = lang;
  }, [lang]);

  // Load code on problem change, language switch, or auth resolution
  useEffect(() => {
    if (!problem || !problem.id) return;
    if (authLoading) return; // Wait for authentication to resolve before loading saved code

    const currentProblemId = problem.id;
    const currentLang = lang;
    const starterCode = problem.starterCode?.[currentLang] || LANGUAGE_CONFIG[currentLang]?.defaultCode || '';

    // Abort any ongoing fetch
    if (activeLoadAbortControllerRef.current) {
      activeLoadAbortControllerRef.current.abort();
    }

    // Anonymous User: Load starter code into local map if not already present
    if (!isAuthenticated) {
      const currentVal = codeMap[currentLang];
      const code = currentVal !== undefined ? currentVal : starterCode;
      if (currentVal === undefined) {
        setCodeMap((prev) => ({ ...prev, [currentLang]: starterCode }));
      }
      if (onCodeChange) {
        onCodeChange(code);
      }
      setSaveStatus('idle');
      return;
    }

    // Authenticated User: Fetch saved code from backend with race-condition protection
    const controller = new AbortController();
    activeLoadAbortControllerRef.current = controller;
    const currentRequestId = ++requestIdCounterRef.current;

    const fetchSavedCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/code/${encodeURIComponent(currentProblemId)}/${currentLang}`, {
          signal: controller.signal,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        // Check if this is still the active request, problem, and language
        if (
          currentRequestId !== requestIdCounterRef.current ||
          activeProblemIdRef.current !== currentProblemId ||
          activeLangRef.current !== currentLang
        ) {
          return;
        }

        if (data.success && typeof data.sourceCode === 'string') {
          const loadedCode = data.sourceCode;
          setCodeMap((prev) => ({ ...prev, [currentLang]: loadedCode }));
          lastSavedCodeRef.current[`${currentProblemId}_${currentLang}`] = loadedCode;
          if (onCodeChange) onCodeChange(loadedCode);
        } else {
          // No saved code exists in database -> initialize with starter code
          setCodeMap((prev) => ({ ...prev, [currentLang]: starterCode }));
          lastSavedCodeRef.current[`${currentProblemId}_${currentLang}`] = starterCode;
          if (onCodeChange) onCodeChange(starterCode);
        }
        setSaveStatus('idle');
      } catch (err) {
        if (err.name === 'AbortError') return;

        console.warn('Could not fetch saved code from server:', err.message);
        // Fall back gracefully to starter code
        if (
          currentRequestId === requestIdCounterRef.current &&
          activeProblemIdRef.current === currentProblemId &&
          activeLangRef.current === currentLang
        ) {
          const currentVal = codeMap[currentLang];
          const fallback = currentVal !== undefined ? currentVal : starterCode;
          if (currentVal === undefined) {
            setCodeMap((prev) => ({ ...prev, [currentLang]: fallback }));
          }
          if (onCodeChange) onCodeChange(fallback);
          setSaveStatus('idle');
        }
      }
    };

    fetchSavedCode();

    return () => {
      controller.abort();
    };
  }, [problem?.id, lang, isAuthenticated, authLoading]);

  // Clean up debounce timer on unmount or problem/language change
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [problem?.id, lang]);

  const handleLanguageChange = (newLang) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
  };

  const scheduleAutoSave = (targetProblemId, targetLang, codeToSave) => {
    if (!isAuthenticated) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Race protection: Ensure user hasn't switched problems or languages
      if (
        activeProblemIdRef.current !== targetProblemId ||
        activeLangRef.current !== targetLang
      ) {
        return;
      }

      // Optimization: Do NOT PUT unchanged code
      const cacheKey = `${targetProblemId}_${targetLang}`;
      if (lastSavedCodeRef.current[cacheKey] === codeToSave) {
        setSaveStatus('saved');
        return;
      }

      setSaveStatus('saving');

      try {
        const response = await fetch(`${API_BASE_URL}/api/code/${encodeURIComponent(targetProblemId)}/${targetLang}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ sourceCode: codeToSave })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          lastSavedCodeRef.current[cacheKey] = codeToSave;
          // Verify current target is still active before updating UI status
          if (activeProblemIdRef.current === targetProblemId && activeLangRef.current === targetLang) {
            setSaveStatus('saved');
          }
        } else {
          throw new Error(data.error || 'Failed to save');
        }
      } catch (err) {
        console.error('Auto-save request failed:', err.message);
        if (activeProblemIdRef.current === targetProblemId && activeLangRef.current === targetLang) {
          setSaveStatus('error');
        }
      }
    }, 1200); // 1200ms debounce
  };

  const handleEditorChange = (value) => {
    const newCode = value || '';
    setCodeMap((prev) => ({ ...prev, [lang]: newCode }));
    if (onCodeChange) onCodeChange(newCode);

    if (isAuthenticated && problem?.id) {
      scheduleAutoSave(problem.id, lang, newCode);
    }
  };

  const handleReset = () => {
    if (problem && problem.starterCode) {
      const resetCode = problem.starterCode[lang] || LANGUAGE_CONFIG[lang]?.defaultCode || '';
      setCodeMap((prev) => ({ ...prev, [lang]: resetCode }));
      if (onCodeChange) onCodeChange(resetCode);

      if (isAuthenticated && problem.id) {
        scheduleAutoSave(problem.id, lang, resetCode);
      }
    }
  };

  const handleCopyCode = () => {
    const currentCode = codeMap[lang] ?? (problem?.starterCode?.[lang] || LANGUAGE_CONFIG[lang]?.defaultCode || '');
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentCode = codeMap[lang] ?? (problem?.starterCode?.[lang] || LANGUAGE_CONFIG[lang]?.defaultCode || '');

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#21262d] rounded-lg overflow-hidden shadow-xs">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#12161c] border-b border-[#21262d]">
        {/* Left: Language selector & Save Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#1c2128] text-xs font-medium text-neutral-200 border border-[#30363d] rounded px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="java">Java (OpenJDK)</option>
            </select>
          </div>

          {/* Subtle Save Status Indicator for Authenticated Users */}
          {isAuthenticated && (
            <div className="flex items-center text-xs font-mono select-none">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Saved ✓</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400" title="Save failed. Your code is preserved in editor.">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Save failed</span>
                </span>
              )}
              {saveStatus === 'idle' && (
                <span className="text-[11px] text-neutral-500">
                  Saved
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions (Reset, Copy) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
            title="Reset to starter code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full min-h-[300px] relative bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[lang]?.monacoLang || 'python'}
          value={currentCode}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderLineHighlight: 'all',
            overviewRulerBorder: false,
            folding: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-xs text-neutral-500 bg-[#161b22]">
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
