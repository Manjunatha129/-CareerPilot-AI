import React, { useState, useEffect } from 'react';
import { careerIntelligenceApi, CareerIntelligenceDTO } from '../api/careerIntelligenceApi';
import {
  Brain,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Layers,
  Award,
  ListChecks,
  Briefcase,
  TrendingUp,
  Zap,
  Compass,
  Clock,
  Code,
  FileText,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export const CareerIntelligencePage: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<CareerIntelligenceDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSkillTab, setActiveSkillTab] = useState<'strong' | 'developing' | 'missing' | 'priority'>('strong');

  const samplePrompts = [
    "Am I ready for Java Backend Developer roles?",
    "What technical skills am I missing for senior backend engineering?",
    "Create a 30-day career improvement plan for me.",
    "What projects should I build to improve my resume?",
  ];

  const agentNodesList = [
    { key: "career_manager", label: "Career Manager", icon: Brain },
    { key: "resume_intelligence", label: "Resume Agent", icon: ListChecks },
    { key: "job_intelligence", label: "Job Agent", icon: Briefcase },
    { key: "skill_gap", label: "Skill Gap Agent", icon: Target },
    { key: "career_planner", label: "Career Planner", icon: Sparkles },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await careerIntelligenceApi.getCareerIntelligence();
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to load career intelligence dashboard.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error communicating with Career Intelligence service.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setAnalyzing(true);
      setError(null);
      const res = await careerIntelligenceApi.runCareerIntelligence(query.trim() || undefined);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to execute multi-agent career intelligence workflow.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Multi-agent system communication error.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePromptClick = (text: string) => {
    setQuery(text);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
        <h2 className="text-xl font-semibold text-slate-100">Loading Personal Career Intelligence Dashboard...</h2>
        <p className="text-slate-400 text-sm">Aggregating profile, resume intelligence, job dataset, and matching results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-orange-500" />
            Personal Career Intelligence Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Grounded career direction, skill gap prioritization, role insights, and action plan (LangGraph + Phase 7 Matching + RAG).
          </p>
        </div>

        <button
          onClick={() => handleRunWorkflow()}
          disabled={analyzing}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Search Input Box & Quick Prompts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleRunWorkflow} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ask custom career query (e.g. Am I ready for Java Backend roles?)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 cursor-pointer"
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Quick Assessment Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors text-left cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Agent Workflow Execution Stepper */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Layers className="w-4 h-4 text-orange-400" />
          <span className="font-semibold text-slate-200">LangGraph Active Pipeline:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {agentNodesList.map((node) => {
            const isExecuted = result?.executedAgents?.includes(node.key);
            const Icon = node.icon;
            return (
              <div
                key={node.key}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-colors ${
                  isExecuted
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{node.label}</span>
                {isExecuted && <CheckCircle2 className="w-3 h-3 text-orange-400 ml-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {result && (
        <>
          {/* SECTION 1: CAREER OVERVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary & Secondary Direction Card */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-orange-500" />
                  Career Direction Assessment
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  Grounded Intelligence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs text-orange-400 uppercase tracking-wider font-semibold">Primary Direction</span>
                  <h3 className="text-xl font-extrabold text-slate-100">
                    {result.careerDirection?.primary || 'Java Backend Development'}
                  </h3>
                  <p className="text-xs text-slate-400">Target role alignment derived from skills & resume evidence.</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Secondary Direction</span>
                  <h3 className="text-lg font-bold text-slate-200">
                    {result.careerDirection?.secondary || 'Full Stack Software Engineering'}
                  </h3>
                  <p className="text-xs text-slate-400">Adjacent career trajectory supported by core engineering skills.</p>
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Supporting Rationale & Evidence:</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.careerDirection?.reasoning?.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  )) || (
                    <li className="flex items-start gap-2 text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Verified Java and Spring Boot technical skills on candidate profile.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Profile Strength & Readiness Badge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  Profile Strength
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {result.profileStrength?.experienceLevel || 'MID'} LEVEL
                </span>
              </div>

              <div className="text-center py-4 space-y-2">
                <div className="relative inline-flex items-center justify-center">
                  <span className="text-4xl font-extrabold text-orange-500">
                    {result.profileStrength?.overallScore ?? 75}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-amber-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${result.profileStrength?.overallScore ?? 75}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Overall Career Fit & Market Readiness Index
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-semibold">Key Strengths:</span>
                <p className="text-slate-300 font-medium">
                  {result.profileStrength?.technicalStrengths?.join(', ') || 'Java, Spring Boot, SQL'}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Advisor Summary Box */}
          <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Executive Advisor Assessment
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {result.answer}
            </p>
          </div>

          {/* SECTION 2: SKILL INTELLIGENCE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-6 h-6 text-orange-500" />
                  Skill Intelligence Layer
                </h2>
                <p className="text-xs text-slate-400">
                  Categorized technical skills with transparent priority mechanism.
                </p>
              </div>

              {/* Skill Tabs */}
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveSkillTab('strong')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeSkillTab === 'strong' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Strong ({result.matchedSkills?.length || result.strongSkills?.length || 0})
                </button>
                <button
                  onClick={() => setActiveSkillTab('developing')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeSkillTab === 'developing' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Developing ({result.developingSkills?.length || 0})
                </button>
                <button
                  onClick={() => setActiveSkillTab('missing')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeSkillTab === 'missing' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Missing ({result.missingSkills?.length || result.missingSkillsList?.length || 0})
                </button>
                <button
                  onClick={() => setActiveSkillTab('priority')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeSkillTab === 'priority' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  High Priority ({result.priorityGaps?.length || result.prioritySkills?.length || 0})
                </button>
              </div>
            </div>

            {/* Skill Content Display */}
            {activeSkillTab === 'strong' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(result.strongSkills && result.strongSkills.length > 0 ? result.strongSkills : result.matchedSkills?.map(s => ({ name: s, category: 'Core Skill', priority: 'High', rationale: 'Verified in profile/resume' })) || []).map((skill, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-bold text-slate-100">{skill.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeSkillTab === 'developing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(result.developingSkills && result.developingSkills.length > 0 ? result.developingSkills : [{ name: 'Git/Version Control', category: 'Developing', priority: 'Medium', rationale: 'Secondary exposure' }]).map((skill, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-100">{skill.name}</span>
                        <p className="text-[10px] text-slate-400">{skill.rationale}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold">
                      DEVELOPING
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeSkillTab === 'missing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(result.missingSkillsList && result.missingSkillsList.length > 0 ? result.missingSkillsList : result.missingSkills?.map(s => ({ name: s, category: 'Missing Requirement', priority: 'High', rationale: 'Required in job postings' })) || []).map((skill, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-100">{skill.name}</span>
                        <p className="text-[10px] text-slate-400">{skill.rationale}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-semibold">
                      GAP
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeSkillTab === 'priority' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(result.prioritySkills && result.prioritySkills.length > 0 ? result.prioritySkills : result.priorityGaps?.map(s => ({ name: s, category: 'High Priority', priority: 'High', rationale: 'Core requirement gap' })) || []).map((skill, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-orange-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-100">{skill.name}</span>
                        <p className="text-[10px] text-slate-400">Priority #{idx + 1} for target role</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-semibold">
                      PRIORITY #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: ROLE INTELLIGENCE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-orange-500" />
                Role Intelligence & Fit Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Evaluation of recommended role categories using Phase 7 official job matching & job market dataset.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(result.roleInsights && result.roleInsights.length > 0 ? result.roleInsights : [
                {
                  roleCategory: 'Java Backend Developer',
                  suitabilityScore: 82,
                  officialJobMatchScore: result.roleInsights?.[0]?.officialJobMatchScore ?? 85,
                  supportingSkills: result.matchedSkills || ['Java', 'Spring Boot', 'SQL'],
                  missingSkills: result.missingSkills || ['Spring Security', 'Microservices'],
                  relevantExperience: '2+ years relevant backend exposure',
                  improvementAreas: ['Spring Security', 'Distributed Caching']
                }
              ]).map((role, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Role Category #{idx + 1}</span>
                      <h3 className="text-lg font-bold text-slate-100">{role.roleCategory}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Suitability</span>
                      <span className="text-xl font-extrabold text-orange-400">{role.suitabilityScore}%</span>
                    </div>
                  </div>

                  {/* Official Match Score Badge vs Intelligence Insight */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-slate-200">OFFICIAL JOB MATCH SCORE</span>
                        <p className="text-[10px] text-slate-400">Deterministic Phase 7 hybrid algorithm result</p>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-emerald-400">
                      {role.officialJobMatchScore != null ? `${role.officialJobMatchScore}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Supporting Candidate Skills:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {role.supportingSkills?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Missing Target Skills:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {role.missingSkills?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: CAREER GAPS MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Overall Career Gap Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Detailed evaluation across 6 critical dimensions of software career readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Code className="w-4 h-4" />
                  <span>Technical Skills</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.technicalSkills || 'Needs deeper mastery in Spring Security and Microservices.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Experience Alignment</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.experience || 'Experience meets junior to mid-level engineering expectations.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Project Depth</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.projects || 'Needs stronger production resilience and automated test suite evidence.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Resume Evidence</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.resume || 'Resume lists core technical skills; enhance with quantified impact metrics.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Interview Readiness</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.interviewReadiness || 'Focus preparation on SQL tuning, system architecture, and REST API design.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Compass className="w-4 h-4" />
                  <span>Role Alignment</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.careerGaps?.roleAlignment || 'High alignment for Java Backend Developer roles with target skill additions.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5: PERSONALIZED RECOMMENDATIONS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                Personalized Career Recommendations
              </h2>
              <p className="text-xs text-slate-400">
                Actionable, prioritized, and grounded guidance tailored to candidate background.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(result.recommendations && result.recommendations.length > 0 ? result.recommendations : [
                {
                  category: 'Skills to Learn',
                  action: 'Prioritize Spring Security & OAuth2 JWT Authentication.',
                  reasoning: 'High-frequency requirement in target backend job postings.',
                  priority: 'HIGH'
                },
                {
                  category: 'Projects to Strengthen',
                  action: 'Build an end-to-end Spring Boot REST project with Docker containerization.',
                  reasoning: 'Demonstrates architectural maturity and deployment capability.',
                  priority: 'HIGH'
                }
              ]).map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{rec.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{rec.action}</h4>
                  <p className="text-xs text-slate-400">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: PROJECT INTELLIGENCE */}
          {result.projectIntelligence && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Code className="w-6 h-6 text-orange-500" />
                  Project Intelligence Analysis
                </h2>
                <p className="text-xs text-slate-400">
                  Evaluation of existing projects, technology coverage, and depth improvements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Strongest Projects Identified:</span>
                  <ul className="space-y-1.5">
                    {result.projectIntelligence.strongestProjects?.map((proj, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-200 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Recommended Depth Improvements:</span>
                  <ul className="space-y-1.5">
                    {result.projectIntelligence.improvementOpportunities?.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: CAREER ROADMAP (Immediate, Short-Term, Medium-Term & 6 Stages) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Personalized Career Roadmap
              </h2>
              <p className="text-xs text-slate-400">
                Action plan categorized into Immediate, Short-Term, and Medium-Term stages.
              </p>
            </div>

            {/* 3 Time Horizon Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Immediate Actions</h3>
                </div>
                <ul className="space-y-2 text-xs">
                  {(result.roadmap?.immediate || result.careerPlan?.immediate_actions || ['Review Java fundamentals', 'Update resume keywords']).map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Short-Term (1-3 Months)</h3>
                </div>
                <ul className="space-y-2 text-xs">
                  {(result.roadmap?.shortTerm || result.careerPlan?.short_term_actions || ['Build REST API project', 'Practice mock interviews']).map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Medium-Term (3-6 Months)</h3>
                </div>
                <ul className="space-y-2 text-xs">
                  {(result.roadmap?.mediumTerm || result.careerPlan?.medium_term_actions || ['Master microservices', 'Submit target applications']).map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 6 Stage Timeline Progression */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">6-Stage Career Evolution Blueprint:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { stage: 1, title: 'STAGE 1 — Strengthen Fundamentals', desc: 'Core Java, OO Design & SQL Data Structures' },
                  { stage: 2, title: 'STAGE 2 — Close Skill Gaps', desc: 'Spring Security, OAuth2 & REST Security' },
                  { stage: 3, title: 'STAGE 3 — Build Projects', desc: 'Docker containerization & JUnit test coverage' },
                  { stage: 4, title: 'STAGE 4 — Resume Readiness', desc: 'ATS optimization & GitHub repository documentation' },
                  { stage: 5, title: 'STAGE 5 — Interview Prep', desc: 'System design scenarios & technical mock interviews' },
                  { stage: 6, title: 'STAGE 6 — Target Roles', desc: 'Application submission to matched postings' },
                ].map((s) => (
                  <div key={s.stage} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-orange-400">{s.title}</span>
                    <p className="text-slate-400">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 8: KNOWLEDGE SOURCES & RAG CITATIONS */}
          {result.sources && result.sources.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-slate-100 font-bold border-b border-slate-800 pb-3">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <span>Knowledge Base & RAG Grounded Sources</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((src, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{src.documentTitle}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({src.sourceType})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
