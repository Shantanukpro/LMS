import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { ClipboardList, CheckCircle2, XCircle, Info } from 'lucide-react';

interface MusterPreviewModalProps {
  open: boolean;
  onClose: () => void;
  sessionData: {
    date: string;
    time: string;
    labName: string;
    className: string;
    batch: string;
    sessionType: string;
    duration: string;
    subject: string;
  };
  entries: Array<{
    sr_no: number;
    roll_no: string;
    student_name: string;
    pc_name: string;
    attendance: 'P' | 'A';
  }>;
}

const MusterPreviewModal: React.FC<MusterPreviewModalProps> = ({ 
  open, 
  onClose, 
  sessionData, 
  entries 
}) => {
  const presentCount = entries.filter(e => e.attendance === 'P').length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '1.5rem',
          bgcolor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid var(--border-color)', px: 4, py: 3 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
            <ClipboardList size={22} />
          </div>
          <div>
            <Typography variant="h6" fontWeight={800}>Final Register Preview</Typography>
            <Typography variant="caption" color="text.secondary">Verify all data before final submission</Typography>
          </div>
        </div>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 4 }}>
        {/* Session Metadata Grid */}
        <div className="bg-gray-50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 mb-8">
          <PreviewItem label="Session Date" value={sessionData.date} icon={<Info size={14} className="text-blue-500" />} />
          <PreviewItem label="Start Time" value={sessionData.time} />
          <PreviewItem label="Lab Room" value={sessionData.labName} />
          <PreviewItem label="Class/Batch" value={`${sessionData.className} — ${sessionData.batch}`} />
          <PreviewItem label="Session Type" value={sessionData.sessionType} />
          <PreviewItem label="Duration" value={`${sessionData.duration} Mins`} />
          <PreviewItem label="Subject" value={sessionData.subject || 'General Lab'} />
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 dark:text-gray-500">Final Stats</p>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-black text-sm">{presentCount} P</span>
              <span className="text-gray-400 opacity-30">|</span>
              <span className="text-rose-500 font-black text-sm">{entries.length - presentCount} A</span>
            </div>
          </div>
        </div>

        <Divider sx={{ mb: 4, borderColor: 'var(--border-color)' }} />

        {/* Student List */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle2 size={16} className="text-teal-500" />
          Confirmed Students
        </Typography>

        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar bg-black/5 dark:bg-white/[0.02] rounded-xl p-4 border border-gray-100 dark:border-white/5">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-md z-10 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">SR</th>
                <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Roll Number</th>
                <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Student Name</th>
                <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Assigned PC</th>
                <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {entries.map((entry, idx) => (
                <tr key={idx} className="group hover:bg-white/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 text-xs font-mono text-gray-500">{entry.sr_no}</td>
                  <td className="py-4 px-4 text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">{entry.roll_no}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">{entry.student_name || '—'}</td>
                  <td className="py-4 px-4 text-sm font-bold text-purple-600 dark:text-purple-400">{entry.pc_name || 'Unassigned'}</td>
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase border ${
                      entry.attendance === 'P' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {entry.attendance === 'P' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {entry.attendance === 'P' ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid var(--border-color)', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.6 }}>
          Created: {new Date().toLocaleString()}
        </Typography>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '0.75rem', px: 4, py: 1 }}>
            Close Preview
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

const PreviewItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p>
    <div className="flex items-center gap-1.5">
      {icon && <span className="opacity-50">{icon}</span>}
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value || '—'}</p>
    </div>
  </div>
);

export default MusterPreviewModal;
