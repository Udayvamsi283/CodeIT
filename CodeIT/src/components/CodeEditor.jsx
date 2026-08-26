import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Copy, Check, Code2 } from 'lucide-react';

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
  const [lang, setLang] = useState(currentLanguage || 'python');
  const [codeMap, setCodeMap] = useState({});
  const [copied, setCopied] = useState(false);

  // Initialize or update starter code when problem changes
  useEffect(() => {
    if (problem && problem.starterCode) {
      const initialMap = {
        cpp: problem.starterCode.cpp || LANGUAGE_CONFIG.cpp.defaultCode,
        java: problem.starterCode.java || LANGUAGE_CONFIG.java.defaultCode,
        python: problem.starterCode.python || LANGUAGE_CONFIG.python.defaultCode,
      };
      setCodeMap(initialMap);
      if (onCodeChange) {
        onCodeChange(initialMap[lang] || '');
      }
    }
  }, [problem?.id]);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
    if (onCodeChange) onCodeChange(codeMap[newLang] || '');
  };

  const handleEditorChange = (value) => {
    const updated = { ...codeMap, [lang]: value || '' };
    setCodeMap(updated);
    if (onCodeChange) onCodeChange(value || '');
  };

  const handleReset = () => {
    if (problem && problem.starterCode && problem.starterCode[lang]) {
      const resetCode = problem.starterCode[lang];
      const updated = { ...codeMap, [lang]: resetCode };
      setCodeMap(updated);
      if (onCodeChange) onCodeChange(resetCode);
    }
  };

  const handleCopyCode = () => {
    const currentCode = codeMap[lang] || '';
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentCode = codeMap[lang] ?? (problem?.starterCode?.[lang] || LANGUAGE_CONFIG[lang]?.defaultCode || '');

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#21262d] rounded-lg overflow-hidden shadow-xs">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#12161c] border-b border-[#21262d]">
        {/* Left: Language selector */}
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
