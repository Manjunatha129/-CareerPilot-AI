import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobApi } from '../api/jobApi';
import { matchingApi } from '../api/matchingApi';
import { applicationApi } from '../api/applicationApi';
import { JobDTO, MatchResponseDTO } from '../types';
import {
  Briefcase,
  Building2,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Globe,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  Target,
  Award,
  Cpu,
  Bookmark,
  FileCheck,
  ExternalLink
} from 'lucide-react';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Match Engine State
  const [matchData, setMatchData] = useState<MatchResponseDTO | null>(null);
  const [matchingLoading, setMatchingLoading] = useState<boolean>(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Application / Save State
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [appId, setAppId] = useState<number | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      const jobId = parseInt(id, 10);
      fetchJobDetail(jobId);
      checkTrackingState(jobId);
    }
  }, [id]);

  const checkTrackingState = async (jobId: number) => {
    try {
      const res = await applicationApi.checkJobState(jobId);
      if (res.success && res.data) {
        setIsSaved(res.data.isSaved);
        setIsApplied(res.data.isApplied);
        setAppId(res.data.applicationId || null);
      }
    } catch (err) {
      // Ignore initial state check error
    }
  };

  const handleToggleSave = async () => {
    if (!id) return;
    const jobId = parseInt(id, 10);
    try {
      setTrackingLoading(true);
      if (isSaved) {
        await applicationApi.unsaveJob(jobId);
        setIsSaved(false);
      } else {
        const res = await applicationApi.saveJob(jobId);
        if (res.success && res.data) {
          setIsSaved(true);
          setAppId(res.data.id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update saved job status.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleApplyTrack = async () => {
    if (!id) return;
    const jobId = parseInt(id, 10);
    try {
      setTrackingLoading(true);
      const res = await applicationApi.createApplication({
        jobId,
        status: 'APPLIED',
        source: 'CareerPilot Web'
      });
      if (res.success && res.data) {
        setIsApplied(true);
        setIsSaved(false);
        setAppId(res.data.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to track application.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const fetchJobDetail = async (jobId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobApi.getJobById(jobId);
      if (response.success && response.data) {
        setJob(response.data);
      } else {
        setError(response.message || 'Job details not found.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve job details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatch = async () => {
    if (!id) return;
    try {
      setMatchingLoading(true);
      setMatchError(null);
      const response = await matchingApi.calculateJobMatch(parseInt(id, 10));
      if (response.success && response.data) {
        setMatchData(response.data);
      } else {
        setMatchError(response.message || 'Failed to calculate match score.');
      }
    } catch (err: any) {
      setMatchError(err.response?.data?.message || 'Matching service error.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'STRONG_MATCH':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'GOOD_MATCH':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'PARTIAL_MATCH':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'LOW_MATCH':
      default:
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-orange-500" /> Loading job detail...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-300 space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-semibold">{error || 'Job Not Found'}</h3>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Job Explorer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Jobs
      </Link>

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold text-slate-100">{job.title}</h1>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {job.workMode}
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {job.employmentType?.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                job.sourceName === 'Naukri' || job.sourceLabel?.includes('Naukri')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : job.sourceName === 'Indeed' || job.sourceLabel?.includes('Indeed')
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                💼 {job.sourceLabel || 'LinkedIn Jobs'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-1">
              <span className="flex items-center gap-2 font-semibold text-slate-200">
                <Building2 className="w-4 h-4 text-orange-400" />
                {job.companyName}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500" />
                {job.location}
              </span>
              {job.companyWebsite && (
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-orange-400 hover:underline"
                >
                  <Globe className="w-4 h-4" /> Company Website
                </a>
              )}
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {job.minSalary && job.maxSalary && (
              <div className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl text-center">
                <div className="text-lg font-bold text-emerald-400">
                  ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Estimated Salary / Year</div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={job.applyUrl || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Apply on {job.sourceName || 'LinkedIn'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleToggleSave}
                disabled={trackingLoading}
                className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaved
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {isSaved ? 'Saved ✓' : 'Save Job'}
              </button>

              {isApplied ? (
                <Link
                  to="/applications"
                  className="px-4 py-3 rounded-xl text-xs font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  {appId ? `Tracked (#${appId}) ✓` : 'Application Tracked ✓'}
                </Link>
              ) : (
                <button
                  onClick={handleApplyTrack}
                  disabled={trackingLoading}
                  className="px-4 py-3 rounded-xl text-xs font-semibold border bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  Apply / Track
                </button>
              )}

              {/* Analyze My Match Button */}
              <button
                onClick={handleAnalyzeMatch}
                disabled={matchingLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {matchingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze My Match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error notification for matching */}
        {matchError && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{matchError}</span>
            <button onClick={() => setMatchError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HYBRID MATCH RESULT UI DISPLAY */}
        {/* ========================================================================= */}
        {matchData && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
            {/* Top Score Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <span className="text-3xl font-black text-orange-400">{matchData.overallScore}%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getCategoryBadgeClass(matchData.matchCategory)}`}>
                      {matchData.matchCategory.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">100% Deterministic Engine</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1">Candidate-Job Compatibility Score</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculated using 6 weighted scoring dimensions. Gemini API provides explanatory advice only.
                  </p>
                </div>
              </div>
            </div>

            {/* 6-Facet Score Breakdown Progress Bars */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-orange-400" /> 6 Scoring Dimensions Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skill Score 35% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Skill Coverage (35% Weight)</span>
                    <span className="text-orange-400">{matchData.breakdown.skillScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.skillScore}%` }} />
                  </div>
                </div>

                {/* Experience Score 20% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Experience Alignment (20% Weight)</span>
                    <span className="text-amber-400">{matchData.breakdown.experienceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.experienceScore}%` }} />
                  </div>
                </div>

                {/* Education Score 10% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Education Tier (10% Weight)</span>
                    <span className="text-sky-400">{matchData.breakdown.educationScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.educationScore}%` }} />
                  </div>
                </div>

                {/* Location Score 10% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Location & Work Mode (10% Weight)</span>
                    <span className="text-emerald-400">{matchData.breakdown.locationScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.locationScore}%` }} />
                  </div>
                </div>

                {/* Semantic Score 15% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Semantic Vector Match (15% Weight - gemini-embedding-2)</span>
                    <span className="text-indigo-400">{matchData.breakdown.semanticScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.semanticScore}%` }} />
                  </div>
                </div>

                {/* Preference Score 10% */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Candidate Preferences (10% Weight)</span>
                    <span className="text-teal-400">{matchData.breakdown.preferenceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${matchData.breakdown.preferenceScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Matched Skills */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Matched Skills ({matchData.matchedSkills.length})
                </h4>
                {matchData.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.matchedSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No exact skill overlaps detected.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Skills to Improve ({matchData.missingSkills.length})
                </h4>
                {matchData.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.missingSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Candidate satisfies all required skills for this job!</p>
                )}
              </div>
            </div>

            {/* Deterministic Match Evidence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-orange-400" /> Why This Job Matches You
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {matchData.strengths.map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Qualification Gaps & Advice
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {matchData.gaps.map((gp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{gp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Explanation Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-orange-400" /> AI Natural-Language Explanation
                </h4>
                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${matchData.aiAvailable ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {matchData.aiAvailable ? 'Gemini 2.5 Flash' : 'Deterministic Fallback'}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
                "{matchData.aiExplanation}"
              </p>
            </div>
          </div>
        )}

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Experience Level</span>
            <p className="font-semibold text-slate-200">{job.experienceLevel} Level</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Work Arrangement</span>
            <p className="font-semibold text-slate-200">{job.workMode}</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Job Category</span>
            <p className="font-semibold text-slate-200">{job.employmentType?.replace('_', ' ')}</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Source Type</span>
            <p className="font-semibold text-orange-400">{job.sourceName}</p>
          </div>
        </div>

        {/* Required Skills Section */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400" /> Required Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nice-to-Have Skills Section */}
        {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Nice-to-Have / Preferred Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.niceToHaveSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Description */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-400" /> Job Description & Responsibilities
          </h3>
          <div className="text-sm text-slate-300 bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </div>
      </div>
    </div>
  );
};
