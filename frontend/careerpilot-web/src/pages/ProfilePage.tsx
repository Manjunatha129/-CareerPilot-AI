import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ProfileRequest, ProfileResponse, ApiResponse } from '../types';
import { SkillInput } from '../components/SkillInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CheckCircle, Save, User, Briefcase } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [totalExperienceYears, setTotalExperienceYears] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [preferredWorkMode, setPreferredWorkMode] = useState('HYBRID');
  const [minExpectedSalary, setMinExpectedSalary] = useState<number | undefined>(undefined);
  const [educationLevel, setEducationLevel] = useState('BACHELORS');

  const [primarySkills, setPrimarySkills] = useState<string[]>([]);
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setSummary(profile.summary || '');
      setTotalExperienceYears(profile.totalExperienceYears || 0);
      setCurrentLocation(profile.currentLocation || '');
      setTargetJobTitle(profile.targetJobTitle || '');
      setPreferredWorkMode(profile.preferredWorkMode || 'HYBRID');
      setMinExpectedSalary(profile.minExpectedSalary);
      setEducationLevel(profile.educationLevel || 'BACHELORS');
      setPrimarySkills(profile.primarySkills || []);
      setSecondarySkills(profile.secondarySkills || []);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const payload: ProfileRequest = {
      headline: headline.trim(),
      summary: summary.trim(),
      totalExperienceYears: Number(totalExperienceYears),
      currentLocation: currentLocation.trim(),
      targetJobTitle: targetJobTitle.trim(),
      preferredWorkMode,
      minExpectedSalary: minExpectedSalary ? Number(minExpectedSalary) : undefined,
      educationLevel,
      primarySkills,
      secondarySkills,
    };

    try {
      await apiClient.put<ApiResponse<ProfileResponse>>('/profile', payload);
      await refreshProfile();
      setSuccessMessage('Career profile saved successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-surface-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Career Profile Management</h1>
          <p className="text-sm text-surface-500">Update your background, target title, and skills for job matching</p>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {successMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Headline & Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" /> Basic Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="e.g. Staff Backend Engineer"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
              Professional Summary
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Briefly describe your career experience, technical focus, and goals..."
              className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            />
          </div>
        </div>

        {/* Experience & Preferences */}
        <div className="space-y-4 pt-4 border-t border-surface-100">
          <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-500" /> Preferences & Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Experience (Years)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={totalExperienceYears}
                onChange={(e) => setTotalExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Work Mode
              </label>
              <select
                value={preferredWorkMode}
                onChange={(e) => setPreferredWorkMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="BACHELORS">Bachelor's Degree</option>
                <option value="MASTERS">Master's Degree</option>
                <option value="PHD">Ph.D.</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Current Location
              </label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                Min Expected Salary ($/yr)
              </label>
              <input
                type="number"
                value={minExpectedSalary || ''}
                onChange={(e) => setMinExpectedSalary(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g. 120000"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Technical Skills Inputs */}
        <div className="space-y-6 pt-4 border-t border-surface-100">
          <SkillInput
            label="Primary Technical Skills (Core Expertise)"
            skills={primarySkills}
            onChange={setPrimarySkills}
            placeholder="Add primary skill (e.g. Java 21, React, Python)"
            badgeVariant="brand"
          />

          <SkillInput
            label="Secondary Skills & Tools"
            skills={secondarySkills}
            onChange={setSecondarySkills}
            placeholder="Add secondary skill (e.g. PostgreSQL, Docker, Git)"
            badgeVariant="surface"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-surface-100 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 shadow-md shadow-brand-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" label="" /> : <Save className="w-4 h-4" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
