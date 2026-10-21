import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Scissors, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-6">
        <Scissors className="w-8 h-8 -rotate-45" />
      </div>

      <span className="text-sm font-mono font-bold text-brand-400 uppercase tracking-widest mb-2">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight max-w-md mb-3">
        This Clip or Page Doesn't Exist
      </h1>

      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The studio link you followed may have expired, or the project was moved. Let's get you back to the cutting room.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};
