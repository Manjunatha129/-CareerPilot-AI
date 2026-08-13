import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Brain, BookOpen } from 'lucide-react';
import { Badge } from '../components/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 text-center space-y-8">
        <Badge variant="brand" className="py-1 px-3 text-sm">
          Multi-Agent AI Career Intelligence
        </Badge>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-surface-900 leading-tight">
          Find the right jobs. <br />
          <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">
            Understand your fit.
          </span>{' '}
          Build the skills to get hired.
        </h1>

        <p className="text-lg sm:text-xl text-surface-600 max-w-3xl mx-auto leading-relaxed">
          CareerPilot AI analyzes your background, parses job requirements, computes explainable match scores, identifies skill gaps, and prepares you for real technical interviews.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-500 text-white font-bold text-base hover:bg-brand-600 shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-surface-300 text-surface-800 font-semibold text-base hover:bg-surface-100 transition-all"
          >
            Sign In to Account
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-surface-900 tracking-tight">
            Designed for Modern Job Seekers
          </h2>
          <p className="text-surface-600">
            A unified platform combining deterministic match metrics, grounded RAG career knowledge, and autonomous AI agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-surface-900">Explainable Hybrid Match</h3>
            <p className="text-surface-600 text-sm leading-relaxed">
              Transparent 6-facet match scoring (Skill 35%, Experience 20%, Education 10%, Location 10%, Semantic 15%, Preferences 10%) with AI explanations.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-surface-900">Skill Gap Analysis</h3>
            <p className="text-surface-600 text-sm leading-relaxed">
              Identify missing technical skills and get targeted course recommendations mapped directly to job requirement gaps.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-surface-900">RAG Interview Prep</h3>
            <p className="text-surface-600 text-sm leading-relaxed">
              Generate job-specific technical, behavioral, and situational questions grounded in indexed company knowledge bases.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="bg-white border-y border-surface-200 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-surface-900 tracking-tight">How CareerPilot AI Works</h2>
            <p className="text-surface-600">Four simple steps to streamline your job search and career preparation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 01</span>
              <h4 className="font-bold text-surface-900">Create Career Profile</h4>
              <p className="text-xs text-surface-600">Define your target title, preferred work mode, locations, and technical skills.</p>
            </div>

            <div className="p-6 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 02</span>
              <h4 className="font-bold text-surface-900">Upload & Parse Resume</h4>
              <p className="text-xs text-surface-600">Extract structured skills and experience metrics from PDF/DOCX resumes.</p>
            </div>

            <div className="p-6 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 03</span>
              <h4 className="font-bold text-surface-900">Match & Identify Gaps</h4>
              <p className="text-xs text-surface-600">Compare your profile against normalized jobs to view match scores and missing skills.</p>
            </div>

            <div className="p-6 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 04</span>
              <h4 className="font-bold text-surface-900">Prepare & Track</h4>
              <p className="text-xs text-surface-600">Practice interview questions and track job applications in an ATS Kanban pipeline.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
