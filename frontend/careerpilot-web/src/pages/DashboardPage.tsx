import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { User, FileText, Briefcase, BookOpen, Brain, ArrowUpRight, MapPin, DollarSign, Clock, FileCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();

  // Calculate profile completeness score based on actual backend fields
  const calculateCompleteness = () => {
    if (!profile) return 10;
    let score = 20; // Default for account creation
    if (profile.headline) score += 15;
    if (profile.summary) score += 15;
    if (profile.targetJobTitle) score += 15;
    if (profile.currentLocation) score += 10;
    if (profile.educationLevel) score += 10;
    if (profile.primarySkills && profile.primarySkills.length > 0) score += 15;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge variant="brand">Authenticated Candidate Dashboard</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Candidate'}!
          </h1>
          <p className="text-surface-300 text-sm leading-relaxed">
            Your career profile is active. Keep your target title and skills updated to prepare for explainable job matching and interview preparation.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-100 pb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold text-surface-900">Candidate Career Profile</h2>
            <p className="text-xs text-surface-500">Live data fetched from Spring Boot backend API</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm self-start sm:self-auto"
          >
            <span>Edit Profile</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Profile Completeness Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-surface-700">Profile Completeness Score</span>
            <span className="text-brand-600">{completeness}%</span>
          </div>
          <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" /> Target Role
            </span>
            <p className="text-sm font-bold text-surface-900 truncate">
              {profile?.targetJobTitle || 'Not Specified'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" /> Experience
            </span>
            <p className="text-sm font-bold text-surface-900">
              {profile?.totalExperienceYears ? `${profile.totalExperienceYears} Years` : '0 Years'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" /> Location / Mode
            </span>
            <p className="text-sm font-bold text-surface-900 truncate">
              {profile?.currentLocation || 'Remote'} ({profile?.preferredWorkMode || 'HYBRID'})
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-brand-500" /> Min Expected Salary
            </span>
            <p className="text-sm font-bold text-surface-900">
              {profile?.minExpectedSalary ? `$${profile.minExpectedSalary.toLocaleString()}` : 'Not Specified'}
            </p>
          </div>
        </div>

        {/* Headline & Summary */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Professional Summary</h4>
          <p className="text-sm text-surface-600 bg-surface-50 p-4 rounded-xl border border-surface-200 leading-relaxed">
            {profile?.summary || 'No professional summary added yet. Click "Edit Profile" to define your career goals.'}
          </p>
        </div>

        {/* Skills Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Primary Technical Skills</h4>
            <div className="flex flex-wrap gap-2">
              {profile?.primarySkills && profile.primarySkills.length > 0 ? (
                profile.primarySkills.map((skill, idx) => (
                  <Badge key={idx} variant="brand">{skill}</Badge>
                ))
              ) : (
                <span className="text-xs text-surface-400 italic">No primary skills listed</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Secondary Skills</h4>
            <div className="flex flex-wrap gap-2">
              {profile?.secondarySkills && profile.secondarySkills.length > 0 ? (
                profile.secondarySkills.map((skill, idx) => (
                  <Badge key={idx} variant="surface">{skill}</Badge>
                ))
              ) : (
                <span className="text-xs text-surface-400 italic">No secondary skills listed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Phase Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <Badge variant="emerald">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">Update Profile</h3>
            <p className="text-xs text-surface-500 mt-1">Manage target roles, work modes, and verified technical skills.</p>
          </div>
          <Link
            to="/profile"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Go to Profile →
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">Resume Intelligence</h3>
            <p className="text-xs text-surface-500 mt-1">PDF extraction, structured JSON parsing, and AI completeness score via Gemini API.</p>
          </div>
          <Link
            to="/resume"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Upload / View Resume →
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">Job Intelligence Explorer</h3>
            <p className="text-xs text-surface-500 mt-1">Explore normalized, deduplicated job postings with multi-filter database search.</p>
          </div>
          <Link
            to="/jobs"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Explore Jobs →
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">Career Knowledge Assistant</h3>
            <p className="text-xs text-surface-500 mt-1">Ask questions grounded in trusted career & technical documentation (pgvector + Gemini RAG).</p>
          </div>
          <Link
            to="/knowledge"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Ask Knowledge Base →
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">AI Career Intelligence Engine</h3>
            <p className="text-xs text-surface-500 mt-1">Stateful 5-agent orchestration via LangGraph, Gemini 2.5, and pgvector delivering grounded roadmaps.</p>
          </div>
          <Link
            to="/career-intelligence"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Open Multi-Agent Engine →
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-lg">Applications & ATS Board</h3>
            <p className="text-xs text-surface-500 mt-1">Track saved jobs, application status stages, interviews, offers, and conversion rates.</p>
          </div>
          <Link
            to="/applications"
            className="inline-block text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Open ATS Tracker →
          </Link>
        </div>
      </div>
    </div>
  );
};
