import React from 'react';
import { 
  Drawer, Box, Typography, Stack, Divider, IconButton, Button,
  Avatar, Tooltip, Paper
} from '@mui/material';
import { 
  X, Info, History, User as UserIcon, Clock, 
  Send, Edit3, Trash2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import EquipmentCard from '../Labs/EquipmentCard';
import type { MaintenanceLog, User as AppUser, Lab } from '../../types';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  log: MaintenanceLog | null;
  users: AppUser[];
  labs: Lab[];
  role: 'admin' | 'student';
  onEdit: () => void;
  onEscalate: () => void;
  onDelete: () => void;
}

const LogDetailPanel: React.FC<DetailPanelProps> = ({ 
  open, onClose, log, users, labs, role, onEdit, onEscalate, onDelete 
}) => {
  if (!log) return null;

  const labName = labs.find(l => l.id === log.lab)?.name || 'Unknown Lab';
  const reporter = log.reported_by;
  const fixer = log.fixed_by;
  const isAdmin = role === 'admin';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          backgroundColor: 'var(--bg-panel)',
          backgroundImage: 'none',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '-10px 0 30px rgba(0,0,0,0.5)'
            : '-10px 0 30px rgba(0,0,0,0.05)',
          borderLeft: '1px solid var(--border-panel)',
          p: 0
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-panel)',
          backgroundColor: 'rgba(59,130,246,0.05)'
        }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>
              Log Details
            </Typography>
            <StatusBadge status={log.status || 'Pending'} isLocked={log.status === 'Resolved'} />
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
          <Stack spacing={4}>
            {/* Section 1: Issue Info */}
            <Box>
              <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, mb: 2, display: 'block' }}>
                Issue Information
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'transparent', borderColor: 'var(--border-panel)' }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Target Equipment</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {log.pc ? `PC #${log.pc}` : (log.lab_equipment ? `Equipment #${log.lab_equipment}` : 'Unknown Item')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Lab Location</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>{labName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Description</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {log.issue_description || 'No description provided.'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* Section 2: Reporter */}
            <Box>
              <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, mb: 2, display: 'block' }}>
                Reported By
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: '#3b82f6', fontSize: '14px', fontWeight: 600 }}>
                  {reporter?.username?.substring(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {reporter?.username || 'System'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleDateString() : '—'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Section 3: Resolution */}
            <Box sx={{ opacity: log.status === 'Resolved' ? 1 : 0.6 }}>
              <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, mb: 2, display: 'block' }}>
                Resolution Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'transparent', borderColor: 'var(--border-panel)' }}>
                {log.status === 'Resolved' ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Status After Fix</Typography>
                      <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>{log.status_after?.replace('_', ' ')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Fixed By</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fixer?.username || 'Admin'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Resolution Date</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{log.updated_at ? new Date(log.updated_at).toLocaleString() : '—'}</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    Pending resolution details...
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* Section 4: Timeline */}
            <Box>
              <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, mb: 2, display: 'block' }}>
                Timeline
              </Typography>
              <Stack spacing={0} sx={{ pl: 1 }}>
                <TimelineItem 
                  title="Ticket Raised" 
                  date={log.created_at} 
                  user={reporter?.username} 
                  color="#f59e0b" 
                  icon={<Send size={12} />} 
                  isFirst 
                />
                {log.status === 'In Progress' && (
                  <TimelineItem 
                    title="Under Investigation" 
                    date={log.updated_at} 
                    user="Admin" 
                    color="#3b82f6" 
                    icon={<Clock size={12} />} 
                  />
                )}
                {log.status === 'Resolved' && (
                  <TimelineItem 
                    title="Fixed & Validated" 
                    date={log.updated_at} 
                    user={fixer?.username} 
                    color="#10b981" 
                    icon={<CheckCircle2 size={12} />} 
                    isLast 
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ 
          p: 3, 
          borderTop: '1px solid var(--border-panel)', 
          backgroundColor: 'rgba(59,130,246,0.05)',
          display: 'flex',
          gap: 2
        }}>
          {isAdmin ? (
            <>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<Edit3 size={18} />}
                onClick={onEdit}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: 'rgba(48,54,61,1)', color: 'var(--text-primary)' }}
              >
                Edit
              </Button>
              {log.status !== 'Resolved' && (
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<AlertTriangle size={18} />}
                  onClick={onEscalate}
                  sx={{ borderRadius: '8px', textTransform: 'none', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                >
                  Escalate
                </Button>
              )}
            </>
          ) : (
             <Typography variant="caption" sx={{ color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
               {log.status === 'Resolved' 
                 ? 'Your issue has been resolved and archived.' 
                 : 'Admin has been notified and is reviewing your request.'}
             </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

const TimelineItem: React.FC<{ 
  title: string; date: string; user?: string; color: string; icon: React.ReactNode; 
  isFirst?: boolean; isLast?: boolean 
}> = ({ title, date, user, color, icon, isFirst, isLast }) => (
  <Box sx={{ display: 'flex', gap: 2, pb: isLast ? 0 : 3, position: 'relative' }}>
    {!isLast && (
      <Box sx={{ 
        position: 'absolute', 
        left: '11px', 
        top: '24px', 
        bottom: 0, 
        width: '1px', 
        backgroundColor: 'var(--border-panel)' 
      }} />
    )}
    <Box sx={{ 
      width: '24px', 
      height: '24px', 
      borderRadius: '50%', 
      backgroundColor: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      zIndex: 1,
      mt: '2px'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>{title}</Typography>
      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
        {new Date(date).toLocaleString()} by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user || 'System'}</span>
      </Typography>
    </Box>
  </Box>
);

export default LogDetailPanel;
