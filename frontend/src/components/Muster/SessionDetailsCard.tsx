import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Tag, 
  Timer, 
  User as UserIcon 
} from 'lucide-react';
import { 
  TextField, 
  MenuItem, 
  Typography, 
  Box, 
  Avatar, 
  Tooltip 
} from '@mui/material';
import type { Lab, User } from '../../types';

interface SessionDetailsCardProps {
  formData: {
    date: string;
    time: string;
    lab: number | '';
    className: string;
    batch: string;
    sessionType: string;
    duration: string;
    subject: string;
  };
  labs: Lab[];
  currentUser: User | null;
  onFieldChange: (field: string, value: any) => void;
  onTimeChange: (time: string) => void;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ 
  formData, 
  labs, 
  currentUser, 
  onFieldChange, 
  onTimeChange 
}) => {
  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden mb-6 group transition-all duration-300 hover:shadow-lg hover:border-teal-500/20">
      <div className="h-1.5 bg-gradient-to-r from-teal-500 via-purple-500 to-blue-500" />
      
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="text-teal-500" size={20} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Session Orientation & Details
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          {/* 1. Date */}
          <ModernInput 
            icon={<Calendar className="text-teal-500" size={18} />}
            label="Date Of Session *"
          >
            <TextField
              type="date"
              value={formData.date}
              onChange={(e) => onFieldChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 2. Time */}
          <ModernInput 
            icon={<Clock className="text-purple-500" size={18} />}
            label="Start Time (HH:MM) *"
            helper="Rounded to nearest 30 mins"
          >
            <TextField
              type="time"
              value={formData.time}
              onChange={(e) => onTimeChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 3. Lab Dropdown */}
          <ModernInput 
            icon={<MapPin className="text-blue-500" size={18} />}
            label="Lab Room *"
          >
            <TextField
              select
              value={formData.lab}
              onChange={(e) => onFieldChange('lab', e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            >
              <MenuItem value="">Select Lab</MenuItem>
              {labs.map(lab => (
                <MenuItem key={lab.id} value={lab.id}>{lab.name}</MenuItem>
              ))}
            </TextField>
          </ModernInput>

          {/* 4. Class */}
          <ModernInput 
            icon={<GraduationCap className="text-amber-500" size={18} />}
            label="Class / Year *"
          >
            <TextField
              value={formData.className}
              onChange={(e) => onFieldChange('className', e.target.value)}
              placeholder="e.g. SE Computer"
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 5. Batch */}
          <ModernInput 
            icon={<Users className="text-rose-500" size={18} />}
            label="Session Batch (Chunk) *"
          >
            <TextField
              value={formData.batch}
              onChange={(e) => onFieldChange('batch', e.target.value)}
              placeholder="e.g. Batch A"
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 6. Session Type (NEW) */}
          <ModernInput 
            icon={<Tag className="text-emerald-500" size={18} />}
            label="Session Type *"
          >
            <TextField
              select
              value={formData.sessionType}
              onChange={(e) => onFieldChange('sessionType', e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            >
              <MenuItem value="Theory">Theory</MenuItem>
              <MenuItem value="Practical">Practical</MenuItem>
              <MenuItem value="Exam">Exam</MenuItem>
              <MenuItem value="Extra Class">Extra Class</MenuItem>
            </TextField>
          </ModernInput>

          {/* 7. Duration (NEW) */}
          <ModernInput 
            icon={<Timer className="text-indigo-500" size={18} />}
            label="Duration (Minutes)"
          >
            <TextField
              type="number"
              value={formData.duration}
              onChange={(e) => onFieldChange('duration', e.target.value)}
              placeholder="e.g. 60"
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 8. Subject (NEW) */}
          <ModernInput 
            icon={<BookOpen className="text-cyan-500" size={18} />}
            label="Subject / Topic Name"
          >
            <TextField
              value={formData.subject}
              onChange={(e) => onFieldChange('subject', e.target.value)}
              placeholder="e.g. Operating Systems"
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inputStyles}
            />
          </ModernInput>

          {/* 9. Conducted By (READ ONLY - NEW) */}
          <div className="flex flex-col gap-1.5 opacity-80 cursor-not-allowed">
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 dark:text-gray-500 ml-0.5">
              Conducted By (Auth)
            </p>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5 h-[46px]">
              <Avatar 
                src={currentUser?.profile_picture || undefined} 
                sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: 'primary.main' }}
              >
                {currentUser?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {currentUser?.username || 'Administrator'}
                </p>
              </div>
              <Tooltip title="This session will be logged under your account.">
                <UserIcon size={14} className="text-gray-300 dark:text-gray-600" />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components & Styles
const ModernInput = ({ icon, label, children, helper }: { icon: React.ReactNode, label: string, children: React.ReactNode, helper?: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 dark:text-gray-500 ml-0.5">
      {label}
    </label>
    <div className="relative group/input">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-70 group-hover/input:opacity-100 transition-opacity">
        {icon}
      </div>
      <div className="pl-12 pr-4 py-1.5 bg-gray-50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.05] rounded-xl border border-gray-100 dark:border-white/5 group-focus-within/input:ring-2 group-focus-within/input:ring-teal-500/20 group-focus-within/input:border-teal-500/30 transition-all duration-300">
        {children}
      </div>
    </div>
    {helper && <p className="text-[10px] text-teal-500/80 font-medium ml-1 mt-0.5">{helper}</p>}
  </div>
);

const inputStyles = {
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
    fontWeight: 600,
    py: 0.75,
    color: 'var(--text-primary)',
    '&::placeholder': {
      opacity: 0.5,
      color: 'inherit',
    }
  },
};

// Placeholder for missing icon in current context
const ClipboardList = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);

export default SessionDetailsCard;
