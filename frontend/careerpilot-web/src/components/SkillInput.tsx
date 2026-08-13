import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SkillInputProps {
  label: string;
  skills: string[];
  onChange: (updatedSkills: string[]) => void;
  placeholder?: string;
  badgeVariant?: 'brand' | 'surface' | 'emerald';
}

export const SkillInput: React.FC<SkillInputProps> = ({
  label,
  skills = [],
  onChange,
  placeholder = 'Add a skill (e.g. Java 21, React)',
  badgeVariant = 'brand',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddSkill = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...skills, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const badgeColors = {
    brand: 'bg-brand-50 text-brand-800 border-brand-200',
    surface: 'bg-surface-100 text-surface-800 border-surface-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-surface-800">{label}</label>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
        />
        <button
          type="button"
          onClick={handleAddSkill}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-surface-900 text-white hover:bg-surface-800 transition-colors flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${badgeColors[badgeVariant]}`}
          >
            {skill}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              className="ml-2 hover:text-red-600 focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-xs text-surface-400 italic">No skills added yet</span>
        )}
      </div>
    </div>
  );
};
