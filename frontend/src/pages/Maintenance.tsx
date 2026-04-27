import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, Typography, Stack, CircularProgress, Snackbar, Alert, 
  Container, Button 
} from '@mui/material';
import { 
  maintenanceAPI, labsAPI, labEquipmentAPI, pcsAPI, usersAPI, ticketsAPI, 
  notificationAPI 
} from '../services/api';
import type { MaintenanceLog, Lab, LabEquipment, PC, User, Ticket } from '../types';

import { CheckCircle, Send, Plus } from 'lucide-react';

// New Components
import MaintenanceStatsBar from '../components/Maintenance/MaintenanceStatsBar';
import MaintenanceTabBar from '../components/Maintenance/MaintenanceTabBar';
import MaintenanceTable from '../components/Maintenance/MaintenanceTable';
import TicketRequestsTable from '../components/Maintenance/TicketRequestsTable';
import LogDetailPanel from '../components/Maintenance/LogDetailPanel';
import AddLogModal from '../components/Maintenance/AddLogModal';
import RaiseIssueModal from '../components/Maintenance/RaiseIssueModal';
import SMSEscalationModal from '../components/Maintenance/SMSEscalationModal';
import { FolderOpen, FilterX } from 'lucide-react';

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Data State
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my_tickets');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fEquipment, setFEquipment] = useState<string>('');
  const [fStatus, setFStatus] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  // Modal State
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openAddLog, setOpenAddLog] = useState(false);
  const [openRaiseIssue, setOpenRaiseIssue] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [convertingTicket, setConvertingTicket] = useState<Ticket | null>(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsData, setSmsData] = useState({ id: 0, labName: '', issue: '', createdAt: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, ticketsRes, labsRes, pcsRes, equipmentRes, usersRes] = await Promise.all([
        maintenanceAPI.getAll(),
        ticketsAPI.getAll(),
        labsAPI.getAll(),
        pcsAPI.getAll(),
        labEquipmentAPI.getAll(),
        usersAPI.getAll(),
      ]);

      setLogs(logsRes);
      setTickets(ticketsRes);
      setLabs(labsRes);
      setPcs(pcsRes);
      setEquipment(equipmentRes);
      setUsers(usersRes);
    } catch (err: any) {
      setError(err?.formattedMessage || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats Calculation
  const stats = useMemo(() => {
    const adminLogs = logs;
    const studentTickets = tickets.filter(t => t.student === user?.id);
    const studentLogs = logs.filter(l => l.reported_by?.id === user?.id);

    return {
      total: adminLogs.length,
      pending: adminLogs.filter(l => l.status?.toLowerCase() === 'pending').length,
      inProgress: adminLogs.filter(l => l.status?.toLowerCase() === 'in_progress').length,
      resolved: adminLogs.filter(l => l.status?.toLowerCase() === 'resolved').length,
      escalated: adminLogs.filter(l => l.status?.toLowerCase() === 'escalated').length,
      myTickets: studentTickets.length + studentLogs.length,
      openTickets: studentTickets.filter(t => t.status?.toLowerCase() === 'pending').length + studentLogs.filter(l => l.status?.toLowerCase() !== 'resolved').length,
    };
  }, [logs, tickets, user]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      tickets: 0,
      my_tickets: 0
    };
    if (isAdmin) {
      counts.all = logs.length;
      counts.pending = logs.filter(l => l.status?.toLowerCase() === 'pending').length;
      counts.in_progress = logs.filter(l => l.status?.toLowerCase() === 'in_progress').length;
      counts.resolved = logs.filter(l => l.status?.toLowerCase() === 'resolved').length;
      counts.tickets = tickets.filter(t => t.status?.toLowerCase() === 'pending').length;
    } else {
      counts.my_tickets = tickets.filter(t => t.status?.toLowerCase() === 'pending').length + logs.filter(l => l.reported_by?.id === user?.id && l.status?.toLowerCase() !== 'resolved').length;
      counts.resolved = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length + logs.filter(l => l.reported_by?.id === user?.id && l.status?.toLowerCase() === 'resolved').length;
    }
    return counts;
  }, [logs, tickets, isAdmin, user]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    let base = [];
    if (isAdmin) {
      if (activeTab === 'tickets') {
        base = tickets.filter(t => t.status === 'pending');
      } else {
        base = logs.filter(l => {
          if (activeTab === 'all') return true;
          return l.status?.toLowerCase()?.replace(' ', '_') === activeTab;
        });
      }
    } else {
      if (activeTab === 'my_tickets') {
        base = [...tickets.filter(t => t.status?.toLowerCase() === 'pending'), ...logs.filter(l => l.reported_by?.id === user?.id && l.status?.toLowerCase() !== 'resolved')];
      } else {
        base = [...tickets.filter(t => t.status?.toLowerCase() === 'resolved'), ...logs.filter(l => l.reported_by?.id === user?.id && l.status?.toLowerCase() === 'resolved')];
      }
    }

    // Apply Filters
    return base.filter((item: any) => {
      const matchLab = fLab ? item.lab === fLab : true;
      const matchStatus = fStatus ? (item.status === fStatus) : true;
      const text = `${item.issue_description || item.title || ''} ${item.remarks || ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      const itDate = item.created_at?.slice(0, 10);
      const matchFrom = from ? itDate >= from : true;
      const matchTo = to ? itDate <= to : true;
      return matchLab && matchStatus && matchQ && matchFrom && matchTo;
    });
  }, [logs, tickets, activeTab, isAdmin, user, fLab, fStatus, q, from, to]);

  // Handlers
  const handleRowClick = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setOpenDetail(true);
  };

  const handleAddLog = () => {
    setEditingLog(null);
    setConvertingTicket(null);
    setOpenAddLog(true);
  };

  const handleEditLog = (log: MaintenanceLog) => {
    setEditingLog(log);
    setConvertingTicket(null);
    setOpenAddLog(true);
  };

  const handleConvertTicket = (ticket: Ticket) => {
    setConvertingTicket(ticket);
    setEditingLog(null);
    setOpenAddLog(true);
  };

  const handleResolveTicket = async (ticketId: number) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // 1. Update ticket status
      await ticketsAPI.update(ticketId, { status: 'resolved' });

      // 2. Automatically create a maintenance log for records
      const newLog = await maintenanceAPI.create({
        pc: ticket.pc,
        reported_by: ticket.student as any,
        issue_description: ticket.issue_description,
        status: 'resolved',
        status_after: 'Working',
        remarks: 'Directly resolved from student ticket'
      });

      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
      setLogs(prev => [newLog, ...prev]);
      setSuccess('Ticket marked as resolved and logged');
    } catch (e) {
      setError('Failed to resolve and log ticket');
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this log? Progress will be lost.')) return;
    try {
      await maintenanceAPI.delete(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      setSuccess('Log deleted successfully');
      setOpenDetail(false);
    } catch (e) {
      setError('Fail to delete log');
    }
  };

  const handleEscalateSms = (log: MaintenanceLog) => {
    setSmsData({
      id: log.id,
      labName: labs.find(l => l.id === log.lab)?.name || 'Unknown',
      issue: log.issue_description || 'Technical Issue',
      createdAt: log.created_at
    });
    setSmsModalOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 1 }}>
          Maintenance Logs
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
          {isAdmin 
            ? 'Manage, resolve, and track all lab maintenance records' 
            : 'Report issues and track the status of your submitted tickets'}
        </Typography>
      </Box>

      {/* Stats Bar */}
      <MaintenanceStatsBar role={isAdmin ? 'admin' : 'student'} data={stats} />

      {/* Tabs & Actions */}
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <MaintenanceTabBar 
          role={isAdmin ? 'admin' : 'student'} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          counts={tabCounts} 
        />
        <Button
          variant="contained"
          disableElevation
          startIcon={<Plus size={18} />}
          onClick={isAdmin ? handleAddLog : () => setOpenRaiseIssue(true)}
          sx={{ 
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            height: '42px',
            fontWeight: 700,
            boxShadow: theme => theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(59,130,246,0.3)' 
              : '0 4px 12px rgba(59,130,246,0.15)',
            '&:hover': { backgroundColor: '#2563eb', transform: 'translateY(-1px)' },
            transition: 'all 0.2s'
          }}
        >
          {isAdmin ? 'Add Log' : 'Raise Issue'}
        </Button>
      </Stack>

      {/* Table Section */}
      <Box sx={{ 
        p: 3, 
        backgroundColor: 'var(--bg-glass)', 
        border: '1px solid var(--border-panel)', 
        borderRadius: '20px',
        boxShadow: theme => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(12px)'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : filteredData.length === 0 ? (
          <EmptyState role={isAdmin ? 'admin' : 'student'} tab={activeTab} onClear={() => { setQ(''); setFLab(''); setFStatus(''); }} />
        ) : activeTab === 'tickets' && isAdmin ? (
          <TicketRequestsTable 
            tickets={filteredData as Ticket[]} 
            users={users} 
            pcs={pcs} 
            onConvert={handleConvertTicket} 
            onResolve={handleResolveTicket} 
          />
        ) : (
          <MaintenanceTable 
            role={isAdmin ? 'admin' : 'student'}
            tab={activeTab}
            logs={filteredData as MaintenanceLog[]}
            labs={labs}
            onRowClick={handleRowClick}
            onEdit={handleEditLog}
            onEscalate={handleEscalateSms}
            onDelete={handleDeleteLog}
          />
        )}
      </Box>

      {/* Side Panel */}
      <LogDetailPanel 
        open={openDetail} 
        onClose={() => setOpenDetail(false)} 
        log={selectedLog}
        users={users}
        labs={labs}
        role={isAdmin ? 'admin' : 'student'}
        onEdit={() => selectedLog && handleEditLog(selectedLog)}
        onEscalate={() => selectedLog && handleEscalateSms(selectedLog)}
        onDelete={() => selectedLog && handleDeleteLog(selectedLog.id)}
      />

      {/* Modals */}
      <AddLogModal 
        open={openAddLog} 
        onClose={() => setOpenAddLog(false)} 
        onSuccess={(updatedLog) => { 
          setLogs(prev => {
            if (editingLog) {
              return prev.map(l => l.id === updatedLog.id ? updatedLog : l);
            }
            return [updatedLog, ...prev];
          });
          if (convertingTicket) {
            setTickets(prev => prev.map(t => t.id === convertingTicket.id ? { ...t, status: updatedLog.status || 'resolved' } : t));
          }
          setSuccess('Log updated successfully'); 
        }}
        editingLog={editingLog}
        convertingTicket={convertingTicket}
        users={users}
        labs={labs}
        allPcs={pcs}
      />

      <RaiseIssueModal 
        open={openRaiseIssue} 
        onClose={() => setOpenRaiseIssue(false)} 
        onSuccess={(newTicket) => { 
          setTickets(prev => [newTicket, ...prev]);
          setSuccess('Issue submitted! Admin will review it shortly.'); 
        }}
        studentId={user?.id || 0}
      />

      <SMSEscalationModal 
        open={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        data={smsData}
      />

      {/* Toasts */}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" sx={{ borderRadius: '8px' }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>
      </Snackbar>
    </Container>
  );
};

const EmptyState: React.FC<{ role: string; tab: string; onClear: () => void }> = ({ role, tab, onClear }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', p: 4, textAlign: 'center' }}>
    <Box sx={{ p: 3, borderRadius: '50%', backgroundColor: 'rgba(48,54,61,0.2)', color: 'rgba(48,54,61,1)', mb: 2 }}>
      {tab === 'tickets' ? <MessageSquare size={48} /> : <FolderOpen size={48} />}
    </Box>
    <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 1 }}>
      {tab === 'tickets' ? 'No student tickets raised yet' : 'No maintenance logs yet'}
    </Typography>
    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3, maxWidth: '300px' }}>
      {tab === 'tickets' 
        ? 'Tickets submitted by students will appear here for review and conversion.' 
        : 'Try adjusting your search or date range to find specific records.'}
    </Typography>
    <Button 
      variant="outlined" 
      startIcon={<FilterX size={18} />}
      onClick={onClear}
      sx={{ borderRadius: '8px', textTransform: 'none', borderColor: 'rgba(48,54,61,1)', color: 'var(--text-primary)' }}
    >
      Clear All Filters
    </Button>
  </Box>
);

const MessageSquare = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export default Maintenance;
