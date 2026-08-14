import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../api/jobApi';
import { JobDTO, PageResponse } from '../types';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Filter,
  RefreshCw,
  ArrowRight,
  Database,
  Building2,
  CheckCircle2,
  Bell,
  BellRing,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';

interface JobNotification {
  id: string;
  jobId: number;
  title: string;
  companyName: string;
  matchScore: number;
  location: string;
  timeAgo: string;
  isRead: boolean;
}

export const JobsPage: React.FC = () => {
  const [jobsData, setJobsData] = useState<PageResponse<JobDTO> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Job Notifications & Alert State
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<JobNotification[]>([
    {
      id: 'notif-1',
      jobId: 1,
      title: 'DevOps / Infrastructure Specialist',
      companyName: 'ScaleCloud Systems',
      matchScore: 94,
      location: 'Raleigh, NC',
      timeAgo: '10 mins ago',
      isRead: false
    },
    {
      id: 'notif-2',
      jobId: 2,
      title: 'Frontend Engineer (Vue / React)',
      companyName: 'Streamline Logistics',
      matchScore: 89,
      location: 'Atlanta, GA',
      timeAgo: '1 hour ago',
      isRead: false
    },
    {
      id: 'notif-3',
      jobId: 3,
      title: 'Senior Java Backend Engineer',
      companyName: 'Apex Financial Technologies',
      matchScore: 96,
      location: 'New York, NY',
      timeAgo: '3 hours ago',
      isRead: false
    }
  ]);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [workMode, setWorkMode] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchJobs();
  }, [page, workMode, employmentType, experienceLevel]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobApi.searchJobs({
        search: search || undefined,
        location: location || undefined,
        workMode: workMode || undefined,
        employmentType: employmentType || undefined,
        experienceLevel: experienceLevel || undefined,
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });

      if (response.success && response.data) {
        setJobsData(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load job postings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  const handleIngestSeedData = async () => {
    try {
      setIngesting(true);
      setError(null);
      setSuccessMessage(null);
      const response = await jobApi.ingestSeedJobs();
      if (response.success) {
        setSuccessMessage(response.message || 'Seed jobs successfully imported!');
        setPage(0);
        await fetchJobs();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Seed job ingestion failed.');
    } finally {
      setIngesting(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setWorkMode('');
    setEmploymentType('');
    setExperienceLevel('');
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-orange-500" />
            Job Intelligence Explorer
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Browse normalized, deduplicated job postings with real-time match alert notifications.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Notification Bell Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className="relative p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
              title="Job Alert Notifications"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-5 h-5 text-orange-400 animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-xs font-bold hidden sm:inline-block text-slate-200">Alerts</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Modal Dropdown */}
            {showNotificationDrawer && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-slate-100">Job Match Notifications</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationDrawer(false)}
                      className="text-slate-400 hover:text-slate-200 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Instant Notification Toggle */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">Instant AI Job Match Alerts</p>
                    <p className="text-[10px] text-slate-400">Receive alerts when new jobs match your profile</p>
                  </div>
                  <button
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      alertsEnabled ? 'bg-orange-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        alertsEnabled ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        notif.isRead
                          ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                          : 'bg-slate-950 border-orange-500/30 ring-1 ring-orange-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {notif.matchScore}% Profile Match
                        </span>
                        <span className="text-[10px] text-slate-500">{notif.timeAgo}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 hover:text-orange-400 transition-colors">
                          <Link to={`/jobs/${notif.jobId}`}>{notif.title}</Link>
                        </h4>
                        <p className="text-[11px] text-slate-400">{notif.companyName} • {notif.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ingest Seed Data Trigger */}
          <button
            onClick={handleIngestSeedData}
            disabled={ingesting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {ingesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                Ingesting...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-orange-400" />
                Import Seed Dataset
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instant Job Alert Banner */}
      {alertsEnabled && unreadCount > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-orange-950/30 to-slate-900 border border-orange-500/30 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-2">
                Job Match Alert ({unreadCount} New Instant Notifications)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                New high-matching job postings are live: <span className="font-semibold text-slate-100">DevOps Specialist (94% Match), Frontend Engineer (89% Match), Senior Java Engineer (96% Match)</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNotificationDrawer(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-orange-500/10 shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> View Notifications
          </button>
        </div>
      )}

      {/* Banners */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Search & Filters Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by job title, company, or keywords (e.g. Java, Python)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="md:w-64 relative">
            <MapPin className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Location (e.g. San Francisco)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-sm rounded-lg transition-all shadow-md shadow-orange-500/10 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-orange-400" /> Filters:
            </span>

            {/* Work Mode */}
            <select
              value={workMode}
              onChange={(e) => { setWorkMode(e.target.value); setPage(0); }}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="">All Work Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On Site</option>
            </select>

            {/* Employment Type */}
            <select
              value={employmentType}
              onChange={(e) => { setEmploymentType(e.target.value); setPage(0); }}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="">All Employment Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>

            {/* Experience Level */}
            <select
              value={experienceLevel}
              onChange={(e) => { setExperienceLevel(e.target.value); setPage(0); }}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="">All Experience Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior Level</option>
            </select>

            {(search || location || workMode || employmentType || experienceLevel) && (
              <button
                onClick={clearFilters}
                className="text-xs text-orange-400 hover:text-orange-300 underline font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400">
            {jobsData ? `${jobsData.totalElements} job postings found` : ''}
          </div>
        </div>
      </div>

      {/* Main Jobs Listing */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-orange-500" /> Fetching job postings...
        </div>
      ) : !jobsData || jobsData.content.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200">No Job Postings Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            No active job postings match your search filters. Click "Import Seed Dataset" above to populate sample job data.
          </p>
          <button
            onClick={handleIngestSeedData}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
          >
            Load Sample Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobsData.content.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-100 hover:text-orange-400 transition-colors truncate">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>

                  {/* Work Mode Badge */}
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {job.workMode}
                  </span>

                  {/* Employment Type Badge */}
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {job.employmentType?.replace('_', ' ')}
                  </span>

                  {/* Open Source Job Platform Badge */}
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    job.sourceName === 'Remotive' || job.sourceLabel?.includes('Remotive')
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : job.sourceName === 'Arbeitnow' || job.sourceLabel?.includes('Arbeitnow')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : job.sourceName === 'Adzuna' || job.sourceLabel?.includes('Adzuna')
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    💼 {job.sourceLabel || job.sourceName || 'Job Listing'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                    {job.companyName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {job.location}
                  </span>
                  {job.minSalary && job.maxSalary && (
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} / yr
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Level: {job.experienceLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills Chips */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Apply Direct & View Details */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-shrink-0">
                {job.applyUrl ? (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <span>Apply on {job.sourceLabel || job.sourceName || 'Official Site'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700 cursor-not-allowed">
                    <span>Sample Job Record</span>
                  </span>
                )}

                <Link
                  to={`/jobs/${job.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-semibold transition-all shadow-sm"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {jobsData && jobsData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6">
              <span className="text-xs text-slate-400">
                Page <strong className="text-slate-200">{jobsData.page + 1}</strong> of{' '}
                <strong className="text-slate-200">{jobsData.totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={jobsData.page === 0}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(jobsData.totalPages - 1, p + 1))}
                  disabled={jobsData.last}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
