import React from 'react';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';
import { IconButton, Tooltip, Stack } from '@mui/material';
import type { PC } from '../../types';
import BooleanBadge from './BooleanBadge';
import PCExpandedDetails from './PCExpandedDetails';

interface PCTableRowProps {
  pc: PC;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (pc: PC) => void;
  onDelete: (id: number) => void;
  showLab?: boolean;
}

const PCTableRow: React.FC<PCTableRowProps> = ({ 
  pc, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onDelete,
  showLab = false
}) => {
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'working') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Working
        </span>
      );
    }
    if (s === 'not_working') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
          Not Working
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">
        {status?.replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  return (
    <>
      <tr 
        className={`group transition-all duration-200 border-b border-gray-100 dark:border-white/5 
          ${isExpanded ? 'bg-slate-50 dark:bg-white/5 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}
      >
        <td className="pl-4 py-4 w-10">
          <button 
            onClick={onToggleExpand}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-all duration-300
              ${isExpanded ? 'rotate-90 text-teal-600 dark:text-teal-400' : ''}`}
          >
            <ChevronRight size={18} />
          </button>
        </td>

        {showLab && (
          <td className="px-6 py-4">
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              Lab {pc.lab}
            </span>
          </td>
        )}

        <td className="px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">
              {pc.device_name || 'Unnamed PC'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
              ID: {pc.id}
            </span>
          </div>
        </td>

        <td className="px-6 py-4">
          <span className="text-sm text-slate-600 dark:text-gray-300 font-medium">
            {pc.brand || 'Generic'}
          </span>
        </td>

        <td className="px-6 py-4">
          <BooleanBadge 
            value={pc.connected} 
            trueLabel="Connected" 
            falseLabel="Offline" 
          />
        </td>

        <td className="px-6 py-4">
          {getStatusBadge(pc.status)}
        </td>

        <td className="px-6 py-4">
          <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold tracking-tight">
            {pc.total_price != null ? `₹ ${Number(pc.total_price).toLocaleString('en-IN')}` : '₹ 0'}
          </span>
        </td>

        <td className="px-6 py-4 text-right pr-6">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Tooltip title="Edit PC">
              <IconButton 
                size="small" 
                onClick={() => onEdit(pc)}
                sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' } }}
              >
                <Edit size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete PC">
              <IconButton 
                size="small" 
                onClick={() => onDelete(pc.id)}
                sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </div>
        </td>
      </tr>

      {/* Expanded Row Panel */}
      <tr className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'active' : 'hidden'}`}>
        <td colSpan={showLab ? 8 : 7} className="p-0 border-none bg-transparent">
          <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[800px] opacity-100 py-0' : 'max-h-0 opacity-0'}`}>
            <PCExpandedDetails pc={pc} />
          </div>
        </td>
      </tr>
    </>
  );
};

export default PCTableRow;
