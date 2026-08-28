import { useLocation, Link } from 'react-router-dom';
import { ExternalLink, Heart } from 'lucide-react';
import codeitLogo from '../assets/codeit-logo.png';

export default function Footer() {
  const location = useLocation();

  // Exclude footer from problem workspace pages to preserve full-screen code editor layout
  if (location.pathname.startsWith('/problem/')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#21262d] bg-[#0d1117]/90 text-[#e6edf3] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Main Content Row */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          {/* Brand & Tagline */}
          <div className="space-y-3 max-w-sm">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src={codeitLogo}
                alt="CodeIT"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed">
              CodeIT — Practice. Improve. Get Interview Ready.
            </p>
          </div>

          {/* Connect & Developer Links */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono block">
              Connect
            </span>
            <div className="flex flex-wrap sm:flex-col gap-3 sm:gap-2 text-xs">
              <a
                href="https://www.linkedin.com/in/uday-vamsi-darla"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Uday Vamsi Darla on LinkedIn (opens in new tab)"
              >
                {/* LinkedIn SVG Icon */}
                <svg
                  className="w-4 h-4 text-blue-400 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </a>

              <a
                href="https://leetcode.com/u/udayvamsi_leetcode/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-colors"
                aria-label="Uday Vamsi on LeetCode (opens in new tab)"
              >
                {/* LeetCode SVG Icon */}
                <svg
                  className="w-4 h-4 text-amber-500 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
                </svg>
                <span>LeetCode</span>
                <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-6 mt-8 border-t border-[#21262d]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            &copy; {currentYear} CodeIT. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-neutral-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block mx-0.5" />
            <span>by</span>
            <span className="text-neutral-200 font-medium">Uday Vamsi Darla</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
