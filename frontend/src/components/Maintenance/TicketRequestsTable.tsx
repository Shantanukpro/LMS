import React from 'react';
import { 
  Box, IconButton, Tooltip, Stack, Typography, Button, Avatar 
} from '@mui/material';
import { CheckCircle2, Repeat, Clock, User as UserIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Ticket, User as AppUser, PC } from '../../types';

interface TicketTableProps {
  tickets: Ticket[];
  users: AppUser[];
  pcs: PC[];
  onConvert: (ticket: Ticket) => void;
  onResolve: (id: number) => void;
}

const TicketRequestsTable: React.FC<TicketTableProps> = ({ 
  tickets, users, pcs, onConvert, onResolve 
}) => {
  if (tickets.length === 0) return null;

  return (
    <Box sx={{ overflowX: 'auto', mx: -2 }}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50/5 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/5">
            {['#', 'Student', 'Roll No', 'PC', 'Issue Description', 'Status', 'Date Raised', 'Actions'].map((col, idx) => (
              <th key={idx} className="px-4 py-4 first:pl-8 last:pr-8">
                <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {col}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {tickets.map((ticket, idx) => {
            const student = users.find(u => u.id === ticket.student);
            const pc = pcs.find(p => p.id === ticket.pc);
            const isResolved = ticket.status === 'resolved';

            return (
              <tr 
                key={ticket.id} 
                className="border-b transition-colors group"
                style={{ 
                  borderColor: 'var(--border-panel)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-5 pl-8 text-sm text-slate-500 font-medium">
                  {String(idx + 1).padStart(2, '0')}
                </td>

                <td className="px-4 py-5">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: '11px', bgcolor: '#3b82f6' }}>
                      {student?.username?.substring(0, 2).toUpperCase() || 'S'}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {student?.username || 'Unknown Student'}
                    </Typography>
                  </Stack>
                </td>

                <td className="px-4 py-5 text-sm text-slate-600 dark:text-gray-400">
                  {/* Derive roll no if available - assuming it might be in username or separate field */}
                  <Typography variant="body2">{student?.id || '-'}</Typography> 
                </td>

                <td className="px-4 py-5 font-semibold text-slate-800 dark:text-white text-sm">
                  {pc ? pc.device_name : `PC ID: ${ticket.pc}`}
                </td>

                <td className="px-4 py-5 max-w-[250px]">
                  <Tooltip title={ticket.issue_description} arrow>
                    <Typography variant="body2" noWrap sx={{ color: 'var(--text-secondary)' }}>
                      {ticket.issue_description}
                    </Typography>
                  </Tooltip>
                </td>

                <td className="px-4 py-5">
                  <StatusBadge status={ticket.status === 'resolved' ? 'Resolved' : 'Pending'} />
                </td>

                <td className="px-4 py-5 text-sm text-slate-600 dark:text-gray-400">
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                </td>

                <td className="px-4 py-5 pr-8">
                  {!isResolved ? (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<Repeat size={14} />}
                        onClick={() => onConvert(ticket)}
                        sx={{ 
                          textTransform: 'none', 
                          color: '#3b82f6', 
                          fontWeight: 600,
                          '&:hover': { background: 'rgba(59,130,246,0.1)' } 
                        }}
                      >
                        Convert
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircle2 size={14} />}
                        onClick={() => onResolve(ticket.id)}
                        sx={{ 
                          textTransform: 'none', 
                          color: '#10b981', 
                          fontWeight: 600,
                          '&:hover': { background: 'rgba(16,185,129,0.1)' } 
                        }}
                      >
                        Resolve
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                      ✓ Handled
                    </Typography>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
};

export default TicketRequestsTable;
