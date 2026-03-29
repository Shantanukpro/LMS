import React from 'react';
import { CheckCircle2, XCircle, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onDelete: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ 
  selectedCount, 
  onClear, 
  onMarkPresent, 
  onMarkAbsent, 
  onDelete 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center gap-4 px-6 py-3 bg-[#1e293b] dark:bg-[#161b22] border border-blue-500/30 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/20">
        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="text-sm font-semibold text-white">Students Selected</span>
          <button 
            onClick={onClear}
            className="p-1 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMarkPresent}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 text-sm font-bold transition-all duration-200 group hover:text-white"
          >
            <CheckCircle2 size={16} className="text-emerald-500 group-hover:text-white" />
            Mark Present
          </button>

          <button
            onClick={onMarkAbsent}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500 text-sm font-bold transition-all duration-200 group hover:text-white"
          >
            <XCircle size={16} className="text-rose-500 group-hover:text-white" />
            Mark Absent
          </button>

          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-500/10 text-slate-400 hover:bg-rose-600 text-sm font-bold transition-all duration-200 group hover:text-white"
          >
            <Trash2 size={16} className="text-slate-500 group-hover:text-white" />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
