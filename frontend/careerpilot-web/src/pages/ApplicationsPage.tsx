import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, ApplicationDTO, ApplicationMetricsDTO } from '../api/applicationApi';
import {
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  Kanban,
  Table as TableIcon,
  Clock,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  X,
  MessageSquare
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [metrics, setMetrics] = useState<ApplicationMetricsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<ApplicationDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [appNotes, setAppNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsRes, metricsRes] = await Promise.all([
        applicationApi.getApplications(
          statusFilter === 'ALL' ? undefined : statusFilter,
          0,
          50,
          searchQuery.trim() || undefined,
          sortBy
        ),
        applicationApi.getMetrics()
      ]);

      if (appsRes.success && appsRes.data) {
        setApplications(appsRes.data.content);
      }
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenModal = (app: ApplicationDTO) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusNote('');
    setAppNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    try {
      setUpdating(true);
      const res = await applicationApi.updateStatus(selectedApp.id, {
        newStatus,
        note: statusNote.trim() || undefined
      });

      if (res.success && res.data) {
        setSelectedApp(res.data);
        setStatusNote('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setUpdating(true);
      const res = await applicationApi.updateApplication(selectedApp.id, {
        notes: appNotes
      });
      if (res.success && res.data) {
        setSelectedApp(res.data);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update notes.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this application from your tracking board?')) return;
    try {
      await applicationApi.deleteApplication(id);
      if (selectedApp?.id === id) {
        setIsModalOpen(false);
        setSelectedApp(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete application.');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SAVED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">SAVED</span>;
      case 'APPLIED':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">APPLIED</span>;
      case 'SCREENING':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">SCREENING</span>;
      case 'INTERVIEW':
      case 'TECHNICAL_INTERVIEW':
      case 'HR_INTERVIEW':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20">INTERVIEW</span>;
      case 'OFFER':
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20">OFFER</span>;
      case 'REJECTED':
      case 'WITHDRAWN':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">{status}</span>;
    }
  };

  // Kanban Columns Definition
  const kanbanColumns = [
    { key: 'SAVED', title: 'Saved Jobs', color: 'border-slate-700 text-slate-300', statuses: ['SAVED'] },
    { key: 'APPLIED', title: 'Applied', color: 'border-blue-500/30 text-blue-400', statuses: ['APPLIED'] },
    { key: 'SCREENING', title: 'Screening', color: 'border-amber-500/30 text-amber-400', statuses: ['SCREENING'] },
    { key: 'INTERVIEW', title: 'Interviews', color: 'border-purple-500/30 text-purple-400', statuses: ['INTERVIEW', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW'] },
    { key: 'OFFER', title: 'Offers', color: 'border-emerald-500/30 text-emerald-400', statuses: ['OFFER', 'ACCEPTED'] },
    { key: 'REJECTED', title: 'Closed / Rejected', color: 'border-rose-500/30 text-rose-400', statuses: ['REJECTED', 'WITHDRAWN'] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-orange-500" />
            Job Application Tracker & ATS Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your candidate job application pipeline, status transitions, interview schedules, and notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            Explore Jobs
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Top Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Total Tracked</span>
            <p className="text-2xl font-extrabold text-slate-100">{metrics.totalApplications}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Saved Jobs</span>
            <p className="text-2xl font-extrabold text-slate-300">{metrics.savedCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Applied</span>
            <p className="text-2xl font-extrabold text-blue-400">{metrics.appliedCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Interviews</span>
            <p className="text-2xl font-extrabold text-purple-400">{metrics.interviewCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Offers</span>
            <p className="text-2xl font-extrabold text-emerald-400">{metrics.offerCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Interview Rate</span>
            <p className="text-2xl font-extrabold text-orange-400">{metrics.interviewConversionRate}%</p>
          </div>
        </div>
      )}

      {/* Filter Bar & View Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search applications by role, company, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SAVED">Saved</option>
            <option value="APPLIED">Applied</option>
            <option value="SCREENING">Screening</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="applied_date">Applied Date</option>
          </select>

          {/* View Switcher Buttons */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-400 text-xs">Loading application pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xl">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Job Applications Tracked Yet</h3>
          <p className="text-slate-400 text-xs">
            Save interesting opportunities from the Job Explorer or mark applied positions to start tracking your pipeline.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            Browse Open Jobs
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ATS KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colApps = applications.filter((a) => col.statuses.includes(a.status.toUpperCase()));
            return (
              <div key={col.key} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3 min-w-[240px]">
                <div className={`border-b pb-2 flex items-center justify-between font-bold text-xs ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px]">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => handleOpenModal(app)}
                      className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-lg p-3 space-y-2 cursor-pointer transition-all shadow-md group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                          {app.companyName}
                        </span>
                        {app.officialMatchScore != null && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            {app.officialMatchScore}% Match
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-1">
                        {app.jobTitle}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>{app.workMode || 'Remote'}</span>
                        <span>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'Saved'}</span>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="py-6 text-center text-[10px] text-slate-600 border border-dashed border-slate-800/80 rounded-lg">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DATA TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Company & Role</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">{app.jobTitle}</div>
                    <div className="text-[11px] text-slate-400">{app.companyName} • {app.location}</div>
                  </td>
                  <td className="py-3 px-4">
                    {app.officialMatchScore != null ? (
                      <span className="font-extrabold text-emerald-400">{app.officialMatchScore}%</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'Saved'}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(app)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="px-2 py-1 text-rose-400 hover:text-rose-200 text-[11px] cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPLICATION DETAIL & STATUS UPDATE MODAL */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Application Details</span>
                <h2 className="text-xl font-bold text-slate-100">{selectedApp.jobTitle}</h2>
                <p className="text-xs text-slate-400">{selectedApp.companyName} • {selectedApp.location}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Match Reference & Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-slate-200">OFFICIAL MATCH SCORE: </span>
                  <span className="font-extrabold text-emerald-400">
                    {selectedApp.officialMatchScore != null ? `${selectedApp.officialMatchScore}%` : 'N/A'}
                  </span>
                </div>
              </div>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            {/* Quick Status Update Form */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Update Application Stage:</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'ACCEPTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      newStatus === st ? 'bg-orange-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Optional transition note (e.g. Recruiter phone screen scheduled for Friday)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
              />

              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === selectedApp.status && !statusNote.trim()}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {updating ? 'Updating...' : 'Save Stage Update'}
              </button>
            </div>

            {/* Application Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-orange-400" /> Private Candidate Notes:
              </h4>
              <textarea
                rows={3}
                value={appNotes}
                onChange={(e) => setAppNotes(e.target.value)}
                placeholder="Add private preparation notes, interviewer names, or follow-up tasks..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Save Notes
              </button>
            </div>

            {/* Status Transition Timeline History */}
            {selectedApp.history && selectedApp.history.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> Timeline & Audit Log:
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedApp.history.map((hist) => (
                    <div key={hist.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{hist.newStatus}</span>
                        {hist.previousStatus && (
                          <span className="text-slate-500 text-[10px] ml-1.5">(from {hist.previousStatus})</span>
                        )}
                        {hist.note && <p className="text-slate-400 text-[11px] mt-0.5">{hist.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(hist.changedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
