import React from 'react';
import { 
  Box, IconButton, Tooltip, Avatar, Stack, Typography 
} from '@mui/material';
import { Edit, AlertTriangle, Trash2, ChevronRight, Lock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { MaintenanceLog, User as AppUser, Lab } from '../../types';

interface TableProps {
  role: 'admin' | 'student';
  tab: string;
  logs: MaintenanceLog[];
  labs: Lab[];
  onRowClick: (log: MaintenanceLog) => void;
  onEdit: (log: MaintenanceLog) => void;
  onEscalate: (log: MaintenanceLog) => void;
  onDelete: (id: number) => void;
}

const MaintenanceTable: React.FC<TableProps> = ({ 
  role, tab, logs, labs, onRowClick, onEdit, onEscalate, onDelete 
}) => {
  const isAdmin = role === 'admin';

  const columns = isAdmin ? [
    '#', 'Target Item', 'Lab', 'Issue Description', 'Reported By', 'Assigned To', 'Status', 'Date Reported', 'Actions'
  ] : [
    '#', 'Target Item', 'Lab', 'My Issue Description', 'Status', 'Status Update', 'Date Raised', 'Date Resolved'
  ];

  if (logs.length === 0) return null;

  return (
    <Box sx={{ overflowX: 'auto', mx: -2 }}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50/5 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/5">
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-4 first:pl-8 last:pr-8">
                <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {col}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {logs.map((log, idx) => (
            <MaintenanceTableRow 
              key={log.id}
              index={idx + 1}
              log={log}
              role={role}
              labName={labs.find(l => l.id === (log as any).lab)?.name || '—'}
              onRowClick={() => onRowClick(log)}
              onEdit={() => onEdit(log)}
              onEscalate={() => onEscalate(log)}
              onDelete={() => onDelete(log.id)}
            />
          ))}
        </tbody>
      </table>
    </Box>
  );
};

interface RowProps {
  index: number;
  log: MaintenanceLog;
  role: 'admin' | 'student';
  labName: string;
  onRowClick: () => void;
  onEdit: () => void;
  onEscalate: () => void;
  onDelete: () => void;
}

const MaintenanceTableRow: React.FC<RowProps> = ({ 
  index, log, role, labName, onRowClick, onEdit, onEscalate, onDelete 
}) => {
  const isAdmin = role === 'admin';
  const isResolved = log.status?.toLowerCase() === 'resolved';
  const isEscalated = log.status?.toLowerCase() === 'escalated';

  return (
    <tr 
      onClick={onRowClick}
      className={`
        group cursor-pointer transition-all duration-200
        hover:bg-slate-50/50 dark:hover:bg-white/[0.02]
        ${isResolved ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' : ''}
        ${isEscalated ? 'bg-red-500/[0.02] dark:bg-red-500/[0.01]' : ''}
      `}
    >
      <td className="px-4 py-5 pl-8 text-sm text-slate-500 dark:text-gray-500 font-medium">
        {String(index).padStart(2, '0')}
      </td>
      
      <td className="px-4 py-5 font-semibold text-slate-800 dark:text-white text-sm">
        {log.pc ? `PC: COMP-${log.pc}` : (log.lab_equipment ? `EQ: ITEM-${log.lab_equipment}` : 'Unlinked Item')}
      </td>

      <td className="px-4 py-5 text-sm text-slate-600 dark:text-gray-300">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{labName}</Typography>
      </td>

      <td className="px-4 py-5 max-w-[200px]">
        <Tooltip title={log.issue_description || ''} arrow>
          <Typography variant="body2" noWrap sx={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {log.issue_description || '—'}
          </Typography>
        </Tooltip>
      </td>

      {isAdmin ? (
        <>
          <td className="px-4 py-5">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: log.reported_by?.role === 'admin' ? '#ef4444' : '#3b82f6' }}>
                {log.reported_by?.username?.substring(0, 2).toUpperCase() || 'S'}
              </Avatar>
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                {log.reported_by?.username || 'System'}
              </Typography>
            </Stack>
          </td>

          <td className="px-4 py-5">
            {log.fixed_by ? (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: '#10b981' }}>
                  {log.fixed_by.username?.substring(0, 2).toUpperCase() || 'A'}
                </Avatar>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>{log.fixed_by.username || 'Admin'}</Typography>
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned</Typography>
            )}
          </td>
        </>
      ) : null}

      <td className="px-4 py-5">
        <StatusBadge status={log.status || 'Pending'} isLocked={isResolved} />
      </td>

      {!isAdmin && (
        <td className="px-4 py-5">
          <Typography variant="caption" sx={{ color: isResolved ? '#10b981' : 'var(--text-secondary)', fontWeight: isResolved ? 700 : 400 }}>
            {isResolved ? `Fixed: ${log.status_after}` : 'Awaiting Update'}
          </Typography>
        </td>
      )}

      <td className="px-4 py-5 text-sm font-medium text-slate-500 dark:text-gray-400">
        {log.created_at ? new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </td>

      {!isAdmin && (
        <td className="px-4 py-5 text-sm font-medium text-slate-500 dark:text-gray-400">
          {log.updated_at && isResolved ? new Date(log.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </td>
      )}

      {isAdmin && (
        <td className="px-4 py-5 pr-8">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <Tooltip title="Edit Record">
              <IconButton size="small" onClick={onEdit} sx={{ color: 'var(--text-secondary)', '&:hover': { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' } }}>
                <Edit size={16} />
              </IconButton>
            </Tooltip>
            {log.status !== 'Resolved' && (
              <Tooltip title="Escalate Log">
                <IconButton size="small" onClick={onEscalate} sx={{ color: 'var(--text-secondary)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}>
                  <AlertTriangle size={16} />
                </IconButton>
              </Tooltip>
            )}
            {!isResolved && (
              <Tooltip title="Delete Entry">
                <IconButton size="small" onClick={onDelete} sx={{ color: 'var(--text-secondary)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}>
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </td>
      )}
    </tr>
  );
};

export default MaintenanceTable;
