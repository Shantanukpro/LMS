import React from 'react';
import { Users, UserPlus, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button, Tooltip, Typography, Badge } from '@mui/material';
import StudentEntryRow from './StudentEntryRow';
import { cn } from '../../lib/utils';

interface StudentEntriesTableProps {
  entries: Array<{
    sr_no: number;
    roll_no: string;
    student_name: string;
    pc: number | '';
    pc_name?: string;
    attendance: 'P' | 'A';
  }>;
  pcs: any[];
  editingIndices: Set<number>;
  selectedIndices: Set<number>;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onToggleEdit: (index: number, isSaving: boolean) => void;
  onToggleSelect: (index: number) => void;
  onSelectAll: (all: boolean) => void;
  onEntryChange: (index: number, updates: any) => void;
  onImportClick: () => void;
}

const StudentEntriesTable: React.FC<StudentEntriesTableProps> = ({
  entries,
  pcs,
  editingIndices,
  selectedIndices,
  onAddRow,
  onRemoveRow,
  onToggleEdit,
  onToggleSelect,
  onSelectAll,
  onEntryChange,
  onImportClick
}) => {
  const total = entries.length;
  const present = entries.filter(e => e.attendance === 'P').length;
  const absent = total - present;
  const allSelected = total > 0 && selectedIndices.size === total;

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden mb-12">
      {/* Table Header Section */}
      <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-teal-500" />
            <Typography variant="subtitle1" fontWeight={700}>Student Entries</Typography>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
            <StatBadge label="Total" value={total} color="bg-blue-500/10 text-blue-500" />
            <StatBadge label="Present" value={present} color="bg-emerald-500/10 text-emerald-500" />
            <StatBadge label="Absent" value={absent} color="bg-rose-500/10 text-rose-500" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onImportClick}
            startIcon={<Upload size={14} />}
            sx={actionBtnStyles}
          >
            Import CSV
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={onAddRow}
            startIcon={<UserPlus size={14} />}
            sx={{
              borderRadius: '0.75rem',
              px: 3,
              py: 1,
              bgcolor: 'teal.500',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: 'teal.600' }
            }}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Actual Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-100/30 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 uppercase tracking-widest text-[10px] font-extrabold text-gray-400 dark:text-gray-500">
            <tr>
              <th className="pl-6 py-6 w-14 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 ml-6" /> {/* drag spacer */}
                  <button 
                    onClick={() => onSelectAll(!allSelected)}
                    className="hover:scale-110 transition-all duration-200 text-gray-400 hover:text-teal-500"
                  >
                    {allSelected ? <CheckSquare size={18} className="text-teal-500" /> : <Square size={18} />}
                  </button>
                </div>
              </th>
              <th className="px-6 py-6 w-16 text-center">Sr</th>
              <th className="px-6 py-6">Roll Number</th>
              <th className="px-6 py-6">Student Name</th>
              <th className="px-6 py-6">PC Assignment</th>
              <th className="px-6 py-6 w-44">Attendance</th>
              <th className="px-6 py-6 text-right pr-12 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 relative">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Users size={64} strokeWidth={1} />
                    <p className="text-sm font-medium">No students registered yet.</p>
                    <Button 
                      variant="text" 
                      onClick={onAddRow}
                      size="small"
                      sx={{ textDecoration: 'underline', color: 'primary.main' }}
                    >
                      Click here to add your first row
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <StudentEntryRow
                  key={idx}
                  index={idx}
                  entry={entry}
                  pcs={pcs}
                  isEditing={editingIndices.has(idx)}
                  isSelected={selectedIndices.has(idx)}
                  onToggleSelect={() => onToggleSelect(idx)}
                  onToggleEdit={(isSaving) => onToggleEdit(idx, isSaving)}
                  onRemove={() => onRemoveRow(idx)}
                  onChange={(updates) => onEntryChange(idx, updates)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatBadge = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <Badge 
    badgeContent={value} 
    color="primary" 
    invisible={false}
    sx={{
      '& .MuiBadge-badge': {
        position: 'static',
        transform: 'none',
        height: '22px',
        minWidth: '22px',
        px: 1,
        ml: 1,
        bgcolor: color.split(' ')[0],
        color: 'inherit',
        fontSize: '10px',
        fontWeight: 700,
        boxShadow: 'none',
      }
    }}
  >
    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{label}</span>
  </Badge>
);

const actionBtnStyles = {
  borderRadius: '0.75rem',
  px: 2.5,
  py: 0.75,
  borderColor: 'var(--border-color)',
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    borderColor: 'rgba(59,130,246,0.3)',
    bgcolor: 'rgba(59,130,246,0.05)',
    color: 'primary.main',
  }
};

export default StudentEntriesTable;
