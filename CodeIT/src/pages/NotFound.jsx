import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-6 text-center bg-[#0d1117]">
      <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <FileQuestion className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-neutral-400 max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/problems"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Problems
      </Link>
    </div>
  );
}
