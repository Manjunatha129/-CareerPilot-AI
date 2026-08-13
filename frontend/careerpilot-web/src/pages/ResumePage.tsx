import React, { useState, useEffect, useRef } from 'react';
import { resumeApi } from '../api/resumeApi';
import { matchingApi } from '../api/matchingApi';
import { ResumeDTO, ParsedResumeAnalysis, MatchResponseDTO } from '../types';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  UserCheck,
  RefreshCw,
  Sparkles,
  Target,
  Check,
  X,
  FileCheck2
} from 'lucide-react';

import { ResumeInterviewQuestionsModal } from '../components/ResumeInterviewQuestionsModal';

export const ResumePage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeDTO[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDTO | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedResumeAnalysis | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Job Description Matcher State
  const [customJobTitle, setCustomJobTitle] = useState<string>('Senior AI / Machine Learning Engineer');
  const [customCompany, setCustomCompany] = useState<string>('Google / Top Tech');
  const [customJdText, setCustomJdText] = useState<string>(
    'We are seeking a Senior AI / Machine Learning Engineer proficient in Python, PyTorch, TensorFlow, FastAPI, React, PostgreSQL, Docker, System Design, REST APIs, Microservices, and LLM Agent orchestration.'
  );
  const [customMatchResult, setCustomMatchResult] = useState<MatchResponseDTO | null>(null);
  const [customMatchingLoading, setCustomMatchingLoading] = useState<boolean>(false);
  const [customMatchError, setCustomMatchError] = useState<string | null>(null);

  const handleCustomMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJdText.trim()) {
      setCustomMatchError('Please enter a job description to calculate match score.');
      return;
    }
    try {
      setCustomMatchingLoading(true);
      setCustomMatchError(null);
      const res = await matchingApi.calculateCustomMatch({
        jobTitle: customJobTitle || 'Target Position',
        companyName: customCompany || 'Target Employer',
        jobDescription: customJdText.trim()
      });
      if (res.success && res.data) {
        setCustomMatchResult(res.data);
      } else {
        setCustomMatchError(res.message || 'Failed to match customized job description.');
      }
    } catch (err: any) {
      setCustomMatchError(err.response?.data?.message || 'Error executing custom JD match.');
    } finally {
      setCustomMatchingLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await resumeApi.getUserResumes();
      if (response.success && response.data) {
        setResumes(response.data);
        if (response.data.length > 0) {
          selectResume(response.data[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch uploaded resumes.');
    } finally {
      setLoading(false);
    }
  };

  const selectResume = (resume: ResumeDTO) => {
    setSelectedResume(resume);
    if (resume.parsedJson) {
      try {
        const parsed = JSON.parse(resume.parsedJson) as ParsedResumeAnalysis;
        setParsedAnalysis(parsed);
      } catch (e) {
        setParsedAnalysis(null);
      }
    } else {
      setParsedAnalysis(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Client-side Validation
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Invalid file type. Only PDF documents (.pdf) are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum file size allowed is 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      const response = await resumeApi.uploadResume(file);
      if (response.success && response.data) {
        setSuccessMsg('Resume uploaded and analyzed successfully! Launching AI Interview Assistant...');
        await fetchResumes();
        selectResume(response.data);
      } else {
        setError(response.message || 'Failed to upload and analyze resume.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred during resume upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      setError(null);
      await resumeApi.deleteResume(id);
      setSuccessMsg('Resume deleted successfully.');
      const updatedList = resumes.filter(r => r.id !== id);
      setResumes(updatedList);
      if (selectedResume?.id === id) {
        if (updatedList.length > 0) {
          selectResume(updatedList[0]);
        } else {
          setSelectedResume(null);
          setParsedAnalysis(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete resume.');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> PROCESSED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" /> PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <FileText className="w-3 h-3" /> UPLOADED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            Resume & Job Matcher Intelligence
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Compare your uploaded resume against target Job Descriptions side-by-side with real-time AI skill gap analysis.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedResume && (
            <button
              onClick={() => setIsInterviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white cursor-pointer transition-all shadow-md shadow-brand-500/10 active:scale-95"
            >
              <span>🎯 Practice Resume Interview Questions</span>
            </button>
          )}

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
              id="resume-file-input"
            />
            <label
              htmlFor="resume-file-input"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all shadow-lg shadow-orange-500/10 ${
                uploading
                  ? 'bg-orange-500/50 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing PDF...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload New Resume PDF
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE-BY-SIDE HERO SECTION: UPLOADED RESUME (LEFT) vs TARGET JD (RIGHT)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Upload & Active Resumes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-orange-400" />
                1. Uploaded Resumes
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
                {resumes.length} total
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" /> Loading uploaded resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-xl p-6 space-y-3">
                <Upload className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-slate-300">No resumes uploaded yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload a PDF resume (max 5MB) to extract intelligence.</p>
                </div>
                <label
                  htmlFor="resume-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Select PDF File
                </label>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => selectResume(r)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      selectedResume?.id === r.id
                        ? 'bg-slate-800/90 border-orange-500/60 ring-1 ring-orange-500/30 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 flex-shrink-0 ${selectedResume?.id === r.id ? 'text-orange-400' : 'text-slate-500'}`} />
                          <p className="text-sm font-bold text-slate-200 truncate">{r.fileName}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 pl-6">
                          {(r.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResume(r.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 pl-6">
                      {renderStatusBadge(r.status)}
                      <span className="text-xs font-bold text-orange-400">
                        {r.completenessScore ? `${r.completenessScore}% Complete` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedResume && (
            <div className="pt-3 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                Active for Matching: <span className="text-orange-400 font-bold truncate">{selectedResume.fileName}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                {selectedResume.completenessScore || 0}% Score
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Customized Job Description (JD) Input & Matcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                2. Target Job Description (JD)
              </h2>
              <span className="text-[11px] text-orange-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Matcher
              </span>
            </div>

            <form onSubmit={handleCustomMatch} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Senior AI Engineer / Full Stack Developer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Employer</label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Google / Top Tech"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Paste Job Description (JD) Text</label>
                <textarea
                  rows={4}
                  value={customJdText}
                  onChange={(e) => setCustomJdText(e.target.value)}
                  placeholder="Paste job description requirements, responsibilities, or technical skills..."
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500 font-mono leading-relaxed resize-none"
                />
              </div>

              {customMatchError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {customMatchError}
                </div>
              )}

              <button
                type="submit"
                disabled={customMatchingLoading || !selectedResume}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/10"
              >
                {customMatchingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Calculating Match Score for Selected Resume...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Match Customized JD with Active Resume
                  </>
                )}
              </button>
            </form>
          </div>

          {!selectedResume && (
            <p className="text-[11px] text-amber-400 text-center font-medium bg-amber-500/10 py-1.5 px-3 rounded border border-amber-500/20">
              Please upload or select a resume on the left to calculate match score.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MATCH RESULTS BREAKDOWN CARD (WHEN CALCULATED)                            */}
      {/* ========================================================================= */}
      {customMatchResult && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-black text-2xl text-orange-400">
                {customMatchResult.overallScore}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    {customMatchResult.matchCategory.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Resume Compatibility</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 mt-1">
                  {customMatchResult.jobTitle} @ {customMatchResult.companyName}
                </h4>
              </div>
            </div>
          </div>

          {/* 6 Dimension Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Skill Score (35%)</span>
              <div className="font-bold text-orange-400 mt-1 text-sm">{customMatchResult.breakdown.skillScore}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Experience (20%)</span>
              <div className="font-bold text-amber-400 mt-1 text-sm">{customMatchResult.breakdown.experienceScore}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Education (10%)</span>
              <div className="font-bold text-sky-400 mt-1 text-sm">{customMatchResult.breakdown.educationScore}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Location (10%)</span>
              <div className="font-bold text-emerald-400 mt-1 text-sm">{customMatchResult.breakdown.locationScore}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Semantic JD (15%)</span>
              <div className="font-bold text-indigo-400 mt-1 text-sm">{customMatchResult.breakdown.semanticScore}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Preferences (10%)</span>
              <div className="font-bold text-teal-400 mt-1 text-sm">{customMatchResult.breakdown.preferenceScore}%</div>
            </div>
          </div>

          {/* Matched & Missing Technical Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Matched Skills on Resume:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {customMatchResult.matchedSkills.length > 0 ? (
                  customMatchResult.matchedSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No direct skill matches</span>
                )}
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <X className="w-4 h-4 text-rose-400" /> Missing Skills for JD:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {customMatchResult.missingSkills.length > 0 ? (
                  customMatchResult.missingSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold">100% Skill Coverage verified!</span>
                )}
              </div>
            </div>
          </div>

          {/* Gemini AI Match Explanation */}
          {customMatchResult.aiExplanation && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Gemini AI Resume Match Evaluation:
              </span>
              <p className="leading-relaxed text-slate-300 text-sm">{customMatchResult.aiExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED EXTRACTED RESUME ANALYSIS VIEW                                   */}
      {/* ========================================================================= */}
      {!selectedResume ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200">No Resume Selected</h3>
          <p className="text-sm text-slate-400 mt-1">Upload a PDF resume or select an existing resume above to view extracted analysis.</p>
        </div>
      ) : selectedResume.status === 'PROCESSING' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-300">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">Analyzing Resume Content...</h3>
          <p className="text-sm text-slate-400 mt-1">Extracting candidate info, skills, education, and experience via Gemini AI.</p>
        </div>
      ) : selectedResume.status === 'FAILED' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-slate-300 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Resume Extraction Failed</h3>
          </div>
          <p className="text-sm text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs">
            {selectedResume.errorMessage || 'AI text extraction could not process this document.'}
          </p>
        </div>
      ) : !parsedAnalysis ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <p className="text-sm">Structured analysis is unavailable for this resume.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview & Completeness Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-orange-400" />
                {parsedAnalysis.candidateInformation?.name || 'Candidate Overview'}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                {parsedAnalysis.candidateInformation?.email && (
                  <span>📧 {parsedAnalysis.candidateInformation.email}</span>
                )}
                {parsedAnalysis.candidateInformation?.phone && (
                  <span>📞 {parsedAnalysis.candidateInformation.phone}</span>
                )}
                {parsedAnalysis.candidateInformation?.location && (
                  <span>📍 {parsedAnalysis.candidateInformation.location}</span>
                )}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 px-6 py-4 rounded-xl text-center flex-shrink-0">
              <div className="text-2xl font-black text-orange-400">
                {selectedResume.completenessScore || parsedAnalysis.completenessScore || 0}%
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Completeness Score</div>
            </div>
          </div>

          {/* Professional Summary */}
          {parsedAnalysis.professionalSummary && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                Professional Summary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                {parsedAnalysis.professionalSummary}
              </p>
            </div>
          )}

          {/* Technical Skills Breakdown */}
          {parsedAnalysis.skills && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-400" />
                Extracted Technical Skills
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedAnalysis.skills.programmingLanguages?.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 block mb-2">Programming Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedAnalysis.skills.programmingLanguages.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedAnalysis.skills.frameworks?.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 block mb-2">Frameworks & Libraries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedAnalysis.skills.frameworks.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedAnalysis.skills.databases?.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 block mb-2">Databases</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedAnalysis.skills.databases.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedAnalysis.skills.tools?.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 block mb-2">Tools & Platforms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedAnalysis.skills.tools.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedAnalysis.skills.cloudTechnologies?.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 block mb-2">Cloud Technologies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedAnalysis.skills.cloudTechnologies.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {parsedAnalysis.experience && parsedAnalysis.experience.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-400" />
                Work Experience
              </h3>

              <div className="space-y-4">
                {parsedAnalysis.experience.map((exp, i) => (
                  <div key={i} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-semibold text-slate-100">{exp.role || 'Role'}</h4>
                      <span className="text-xs text-orange-400 font-mono">{exp.duration}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-400">{exp.company}</p>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pt-1">
                        {exp.responsibilities.map((resp, idx) => (
                          <li key={idx} className="leading-relaxed">{resp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {parsedAnalysis.education && parsedAnalysis.education.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-400" />
                Education
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedAnalysis.education.map((edu, i) => (
                  <div key={i} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                    <h4 className="text-sm font-semibold text-slate-100">{edu.degree}</h4>
                    <p className="text-xs text-orange-300 mt-0.5">{edu.field}</p>
                    <p className="text-xs text-slate-400 mt-1">{edu.institution}</p>
                    {edu.graduationYear && (
                      <span className="inline-block text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded mt-2 border border-slate-800">
                        {edu.graduationYear}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {parsedAnalysis.projects && parsedAnalysis.projects.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-orange-400" />
                Projects
              </h3>

              <div className="space-y-3">
                {parsedAnalysis.projects.map((proj, i) => (
                  <div key={i} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-100">{proj.projectName}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Interview Questions Section-Wise Dedicated Page View Modal */}
      <ResumeInterviewQuestionsModal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        resume={selectedResume}
        parsedAnalysis={parsedAnalysis}
      />
    </div>
  );
};
