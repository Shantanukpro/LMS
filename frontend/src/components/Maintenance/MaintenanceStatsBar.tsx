import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { LayoutList, Clock, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface StatsProps {
  role: 'admin' | 'student';
  data: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    escalated: number;
    myTickets: number;
    openTickets: number;
  };
}

const StatItem: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 2, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      backgroundColor: 'var(--bg-glass)',
      border: '1px solid var(--border-panel)',
      borderRadius: '12px',
      flex: 1,
      boxShadow: theme => theme.palette.mode === 'dark' 
        ? '0 4px 20px rgba(0,0,0,0.2)' 
        : '0 4px 12px rgba(0,0,0,0.03)'
    }}
  >
    <Box sx={{ 
      p: 1.5, 
      borderRadius: '10px', 
      backgroundColor: `${color}15`, 
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: '10px' }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ color: 'var(--text-primary)', lineHeight: 1, fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const MaintenanceStatsBar: React.FC<StatsProps> = ({ role, data }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <div className={`grid gap-4 ${role === 'admin' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {role === 'admin' ? (
          <>
            <StatItem label="Total Logs" value={data.total} color="#64748b" icon={<LayoutList size={20} />} />
            <StatItem label="Pending" value={data.pending} color="#f59e0b" icon={<Clock size={20} />} />
            <StatItem label="In Progress" value={data.inProgress} color="#3b82f6" icon={<LayoutList size={20} />} />
            <StatItem label="Resolved" value={data.resolved} color="#10b981" icon={<CheckCircle2 size={20} />} />
            <StatItem label="Escalated" value={data.escalated} color="#ef4444" icon={<AlertTriangle size={20} />} />
          </>
        ) : (
          <>
            <StatItem label="My Tickets" value={data.myTickets} color="#3b82f6" icon={<MessageSquare size={20} />} />
            <StatItem label="Open" value={data.openTickets} color="#f59e0b" icon={<Clock size={20} />} />
            <StatItem label="Resolved" value={data.resolved} color="#10b981" icon={<CheckCircle2 size={20} />} />
          </>
        )}
      </div>
    </Box>
  );
};

export default MaintenanceStatsBar;
