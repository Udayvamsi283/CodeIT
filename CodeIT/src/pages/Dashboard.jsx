import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Award, Users, Activity, ArrowRight, Sparkles, Terminal, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProgressOverview from '../components/ProgressOverview';
import DashboardFeatureCard from '../components/DashboardFeatureCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  // Protect route: Redirect unauthenticated users safely in useEffect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: '/dashboard' } } });
    }
  }, [loading, isAuthenticated, navigate]);

  // Loading skeleton while initial auth state resolves
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#0d1117] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-neutral-500">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = user?.username || 'Developer';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0d1117] text-[#e6edf3] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#21262d]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-blue-300">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Keep building. Every problem you solve brings you closer to mastering technical interviews.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="shrink-0">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Continue Practicing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Section 1: Progress Overview */}
        <section aria-labelledby="progress-heading">
          <ProgressOverview />
        </section>

        {/* Section 2: Platform Features */}
        <section className="space-y-4" aria-labelledby="features-heading">
          <div className="flex items-center justify-between">
            <h2 id="features-heading" className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Platform Modules</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Problem Bank */}
            <DashboardFeatureCard
              title="Problem Bank"
              description="Solve algorithmic interview questions with real-time test execution and multiple language support."
              icon={BookOpen}
              actionText="Explore Problems"
              to="/problems"
              badgeText="Live"
            />

            {/* Card 2: Skill Assessments (Coming Soon) */}
            <DashboardFeatureCard
              title="Skill Assessments"
              description="Timed algorithmic assessments designed to benchmark your speed, accuracy, and test coverage."
              icon={Award}
              isComingSoon={true}
            />

            {/* Card 3: Mock Interviews (Coming Soon) */}
            <DashboardFeatureCard
              title="Mock Interviews"
              description="Simulated technical coding rounds with structured question delivery and hidden test evaluations."
              icon={Users}
              isComingSoon={true}
            />

            {/* Card 4: Code Workspace */}
            <DashboardFeatureCard
              title="Code Workspace"
              description="Access the Monaco editor suite, test results analyzer, and auto-saved solution drafts."
              icon={Code2}
              actionText="Open Workspace"
              to="/problems"
              badgeText="VS Code"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
