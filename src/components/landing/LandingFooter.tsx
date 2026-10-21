import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Github, Twitter, Youtube, Mail } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-dark-950 border-t border-slate-900 py-12 sm:py-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                ClipForge <span className="text-brand-400 text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/15">AI</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Transform podcasts, webinars, and long-form video files into ready-to-share viral short clips with an AI-powered clipping workflow.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="#" className="p-1.5 rounded-lg hover:text-white hover:bg-dark-900 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:text-white hover:bg-dark-900 transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:text-white hover:bg-dark-900 transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:text-white hover:bg-dark-900 transition-colors" aria-label="Contact Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">AI Hook Finder</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Kinetic Captions</a></li>
              <li><a href="#examples" className="hover:text-white transition-colors">Aspect Reframer</a></li>
              <li><Link to="/dashboard/new" className="hover:text-white transition-colors">Upload Workspace</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Studio Dashboard</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#faq" className="hover:text-white transition-colors">Creator Guides</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Shorts Algorithm Tips</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Comparison</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Company & Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security & Data Policy</a></li>
              <li><Link to="/settings" className="hover:text-white transition-colors">Preferences</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} ClipForge AI. All rights reserved. Original AI SaaS Product.</p>
          <p className="text-slate-500">
            Frontend Prototype • Client-Side Simulation Mode
          </p>
        </div>
      </div>
    </footer>
  );
};
