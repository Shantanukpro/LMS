import React, { useState } from 'react';
import { 
  GripVertical, 
  Trash2, 
  Edit3, 
  Check, 
  User as UserIcon, 
  Monitor,
  AlertCircle
} from 'lucide-react';
import { 
  TextField, 
  MenuItem, 
  IconButton, 
  Tooltip,
  Typography,
  Box
} from '@mui/material';
import AttendanceToggle from './AttendanceToggle';
import { cn } from '../../lib/utils';

interface StudentEntryRowProps {
  index: number;
  entry: {
    sr_no: number;
    roll_no: string;
    student_name: string;
    pc: number | '';
    pc_name?: string;
    attendance: 'P' | 'A';
  };
  pcs: Array<{ id: number; device_name: string; status?: string }>;
  isEditing: boolean;
  isSelected: boolean;
  disabled?: boolean;
  onToggleSelect: () => void;
  onToggleEdit: (isSaving: boolean) => void;
  onRemove: () => void;
  onChange: (updates: any) => void;
}

const StudentEntryRow: React.FC<StudentEntryRowProps> = ({
  index,
  entry,
  pcs,
  isEditing,
  isSelected,
  disabled = false,
  onToggleSelect,
  onToggleEdit,
  onRemove,
  onChange
}) => {
  const [localRollNo, setLocalRollNo] = useState(entry.roll_no);
  const selectedPc = pcs.find(p => p.id === entry.pc);

  const handleSave = () => {
    onToggleEdit(true);
  };

  const handleCancel = () => {
    onToggleEdit(false);
  };

  return (
    <tr className={cn(
      "group transition-all duration-300 border-b border-gray-100 dark:border-white/5",
      isEditing ? "bg-blue-50/30 dark:bg-blue-500/[0.03] ring-1 ring-blue-500/20 z-10" : "hover:bg-gray-50 dark:hover:bg-white/[0.01]",
      isSelected && "bg-blue-50 dark:bg-blue-500/[0.08]"
    )}>
      {/* 1. Selection & Drag Handle */}
      <td className="pl-6 py-5 w-14">
        <div className="flex items-center gap-3">
          <button className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={18} />
          </button>
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-teal-600 focus:ring-teal-500 bg-white dark:bg-gray-900 transition-all cursor-pointer shadow-sm"
            />
          </div>
        </div>
      </td>

      {/* 2. SR NO */}
      <td className="px-6 py-5 w-16 text-center text-middle">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-500">
          {entry.sr_no}
        </span>
      </td>

      {/* 3. ROLL NO */}
      <td className="px-6 py-5 min-w-[140px] text-middle">
        {isEditing ? (
          <TextField
            value={entry.roll_no}
            onChange={(e) => onChange({ roll_no: e.target.value })}
            placeholder="e.g. 2023001"
            size="small"
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            autoFocus
            sx={inlineInputStyles}
          />
        ) : (
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{entry.roll_no || '—'}</p>
        )}
      </td>

      {/* 4. STUDENT NAME */}
      <td className="px-6 py-5 min-w-[200px] text-middle">
        {isEditing ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
              <UserIcon size={14} />
            </div>
            <TextField
              value={entry.student_name}
              onChange={(e) => onChange({ student_name: e.target.value })}
              placeholder="Full student name"
              size="small"
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={inlineInputStyles}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/5 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <UserIcon size={14} />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{entry.student_name || '—'}</p>
          </div>
        )}
      </td>

      {/* 5. PC DROPDOWN */}
      <td className="px-6 py-5 min-w-[180px] text-middle">
        {isEditing ? (
          <TextField
            select
            value={entry.pc}
            onChange={(e) => onChange({ pc: e.target.value })}
            size="small"
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            disabled={entry.attendance === 'A'}
            sx={inlineInputStyles}
          >
            <MenuItem value="">Select PC</MenuItem>
            {pcs.map(pc => (
              <MenuItem key={pc.id} value={pc.id}>
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} />
                    <span>{pc.device_name}</span>
                  </div>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    pc.status?.toLowerCase() === 'working' ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                </div>
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <div className="flex items-center gap-2">
            <Monitor size={14} className={cn(entry.attendance === 'A' ? 'text-gray-400' : 'text-purple-500')} />
            <span className={cn(
              "text-sm font-medium",
              entry.attendance === 'A' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
            )}>
              {selectedPc?.device_name || 'Not assigned'}
            </span>
            {selectedPc && selectedPc.status?.toLowerCase() !== 'working' && (
              <Tooltip title={`PC Status: ${selectedPc.status}`}>
                <AlertCircle size={12} className="text-rose-500" />
              </Tooltip>
            )}
          </div>
        )}
      </td>

      {/* 6. ATTENDANCE */}
      <td className="px-6 py-5 w-32 text-middle">
        <AttendanceToggle 
          status={entry.attendance} 
          onChange={(status) => onChange({ attendance: status })}
          disabled={disabled}
        />
      </td>

      {/* 7. ACTIONS */}
      <td className="px-6 py-5 text-right w-24 text-middle">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <Tooltip title="Save Row">
                <IconButton 
                  size="small" 
                  onClick={handleSave}
                  sx={{ color: '#10b981', '&:hover': { background: 'rgba(16,185,129,0.1)' } }}
                >
                  <Check size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Discard Changes">
                <IconButton 
                  size="small" 
                  onClick={handleCancel}
                  sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.1)' } }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Edit Row">
                <IconButton 
                  size="small" 
                  onClick={() => onToggleEdit(false)}
                  className="group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  sx={{ color: '#3b82f6', '&:hover': { background: 'rgba(59,130,246,0.1)' } }}
                >
                  <Edit3 size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Entry">
                <IconButton 
                  size="small" 
                  onClick={onRemove}
                  className="group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.1)' } }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const inlineInputStyles = {
  '& .MuiInputBase-root': {
    height: '36px',
    background: 'var(--muted-bg)',
    borderRadius: '0.5rem',
    px: 1.5,
    border: '1px solid var(--border-color)',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: 'rgba(255,255,255,0.15)',
    },
    '&.Mui-focused': {
      borderColor: 'var(--primary-main)',
      background: 'rgba(255,255,255,0.02)',
    }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    '&::placeholder': {
      opacity: 0.4,
    }
  }
};

export default StudentEntryRow;
