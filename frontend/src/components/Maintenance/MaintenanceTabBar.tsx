import React from 'react';
import { Box, Tabs, Tab, Badge, Chip } from '@mui/material';

export type AdminTab = 'all' | 'pending' | 'in_progress' | 'resolved' | 'tickets';
export type StudentTab = 'my_tickets' | 'resolved';

interface TabBarProps {
  role: 'admin' | 'student';
  activeTab: AdminTab | StudentTab | string;
  onChange: (tab: any) => void;
  counts: Record<string, number>;
}

const TabBadge: React.FC<{ count: number; color: string }> = ({ count, color }) => (
  <Chip 
    label={count} 
    size="small" 
    sx={{ 
      ml: 1, 
      height: '18px', 
      fontSize: '10px', 
      fontWeight: 700,
      backgroundColor: `${color}20`,
      color: color,
      border: `1px solid ${color}30`
    }} 
  />
);

const MaintenanceTabBar: React.FC<TabBarProps> = ({ role, activeTab, onChange, counts }) => {
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'rgba(48,54,61,1)', mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleChange}
        textColor="inherit"
        indicatorColor="primary"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: '#3b82f6',
            height: '3px',
            borderRadius: '3px'
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            minHeight: '48px',
            px: 3,
            color: 'var(--text-secondary)',
            '&.Mui-selected': {
              color: 'var(--text-primary)'
            }
          }
        }}
      >
        {role === 'admin' ? [
          <Tab key="all" label="All Logs" value="all" icon={<TabBadge count={counts.all ?? 0} color="#64748b" />} iconPosition="end" />,
          <Tab key="pending" label="Pending" value="pending" icon={<TabBadge count={counts.pending ?? 0} color="#f59e0b" />} iconPosition="end" />,
          <Tab key="in_progress" label="In Progress" value="in_progress" icon={<TabBadge count={counts.in_progress ?? 0} color="#3b82f6" />} iconPosition="end" />,
          <Tab key="resolved" label="Resolved" value="resolved" icon={<TabBadge count={counts.resolved ?? 0} color="#10b981" />} iconPosition="end" />,
          <Tab key="tickets" label="Ticket Requests" value="tickets" icon={<TabBadge count={counts.tickets ?? 0} color="#ef4444" />} iconPosition="end" />
        ] : [
          <Tab key="my_tickets" label="My Tickets" value="my_tickets" icon={<TabBadge count={counts.my_tickets ?? 0} color="#3b82f6" />} iconPosition="end" />,
          <Tab key="resolved" label="Resolved" value="resolved" icon={<TabBadge count={counts.resolved ?? 0} color="#10b981" />} iconPosition="end" />
        ]}
      </Tabs>
    </Box>
  );
};

export default MaintenanceTabBar;
