import React from 'react';
import { Users, CheckCircle2, XCircle, Calendar, MapPin } from 'lucide-react';

interface QuickStatsBarProps {
  date: string;
  labName: string;
  total: number;
  present: number;
  absent: number;
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ 
  date, 
  labName, 
  total, 
  present, 
  absent 
}) => {
  const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-white/50 dark:bg-[#161b22]/50 backdrop-blur-md rounded-xl border border-gray-100 dark:border-white/5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Session Quick Info */}
      <div className="flex items-center gap-4 border-r border-gray-200 dark:border-white/10 pr-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar size={16} className="text-teal-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{date || 'Select Date'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin size={16} className="text-purple-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{labName || 'Select Lab'}</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Total Enrolled</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{total}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Present</p>
            <p className="text-xl font-bold text-emerald-500 leading-tight">{present}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Absent</p>
            <p className="text-xl font-bold text-rose-500 leading-tight">{absent}</p>
          </div>
        </div>

        {/* Progress Circle Visual (Mini) */}
        {total > 0 && (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/5">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="24" cy="24" r="20" 
                  className="stroke-gray-100 dark:stroke-white/5 fill-none" 
                  strokeWidth="4" 
                />
                <circle 
                  cx="24" cy="24" r="20" 
                  className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out" 
                  strokeWidth="4" 
                  strokeDasharray={`${(presentPercent * 125.6) / 100} 125.6`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-emerald-500">{presentPercent}%</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Attendance Rate</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Active Participation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStatsBar;
