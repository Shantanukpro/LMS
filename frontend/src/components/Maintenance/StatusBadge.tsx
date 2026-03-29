import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Lock } from 'lucide-react';

export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Escalated';

interface StatusBadgeProps {
  status: MaintenanceStatus | string;
  isLocked?: boolean;
}

const getStatusStyles = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'pending') return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' };
  if (s === 'in progress' || s === 'in_progress') return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
  if (s === 'resolved' || s === 'fixed') return { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' };
  if (s === 'escalated') return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' };
  return { bg: 'rgba(100,116,139,0.1)', text: '#64748b', border: 'rgba(100,116,139,0.2)' };
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isLocked }) => {
  const styles = getStatusStyles(status);
  
  return (
    <Box 
      sx={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 0.5,
        px: 1.5, 
        py: 0.5, 
        borderRadius: '9999px',
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        backgroundColor: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {status.replace('_', ' ')}
      {isLocked && (
        <Tooltip title="Archived History">
          <Lock size={12} style={{ marginLeft: '2px' }} />
        </Tooltip>
      )}
    </Box>
  );
};

export default StatusBadge;
