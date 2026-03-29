import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { musterAPI } from '../services/api';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Visibility, Delete, Refresh } from '@mui/icons-material';
import ModernTable from '../components/Common/ModernTable';
import ModernTableRow from '../components/Common/ModernTableRow';
import EquipmentCard from '../components/Labs/EquipmentCard';
import { ClipboardList, Calendar, Users, Hash } from 'lucide-react';

interface MusterSession {
  id: number;
  date: string;
  time: string;
  lab: number;
  lab_name: string;
  class_name: string;
  batch: string;
  created_at: string;
  entry_count: number;
}

const MusterList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<MusterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await musterAPI.listSessions();
      setSessions(data);
    } catch (err) {
      setError('Failed to load muster sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await musterAPI.deleteSession(deleteId);
      setSessions(prev => prev.filter(s => s.id !== deleteId));
      setSuccess('Muster session deleted successfully');
    } catch (err) {
      setError('Failed to delete muster session');
      console.error(err);
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>
          Muster Register Sessions
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          View and manage attendance muster sessions
        </Typography>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} justifyContent="flex-end">
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={loadSessions} disabled={loading}>
              {loading ? <CircularProgress size={22} /> : <Refresh />}
            </IconButton>
          </span>
        </Tooltip>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/muster/register')}>
          Create New Session
        </Button>
      </Stack>

      {/* Table Section */}
      <ModernTable
        columns={[
          { header: 'Session Details' },
          { header: 'Lab' },
          { header: 'Schedule' },
          { header: 'Students' },
          { header: 'Actions', align: 'right' }
        ]}
        isEmpty={sessions.length === 0}
        emptyMessage={sessions.length > 0 ? "No sessions match search" : "No muster sessions found"}
      >
        {sessions.map((s) => (
          <ModernTableRow
            key={s.id}
            colSpan={5}
            mainRow={
              <>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">
                      {s.class_name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                      Batch {s.batch}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-gray-300 font-medium">
                    {s.lab_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-slate-700 dark:text-gray-200">
                      {s.date}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400 font-mono">
                      {s.time?.slice(0, 5)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {s.entry_count} Present
                  </span>
                </td>
                <td className="px-6 py-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Tooltip title="View/Edit Session">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/muster/register/${s.id}`)}
                        sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' } }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Session">
                      <IconButton 
                        size="small" 
                        onClick={() => confirmDelete(s.id)}
                        sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </td>
              </>
            }
            expandedContent={
              <div className="p-6 bg-slate-50/50 dark:bg-[#0d1117] border-t border-slate-200 dark:border-white/5 animate-fade-in shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <EquipmentCard 
                    title="Session Overview"
                    icon={ClipboardList}
                    accentColor="blue"
                    fields={[
                      { label: 'Class', value: s.class_name },
                      { label: 'Batch', value: s.batch },
                      { label: 'Lab Target', value: s.lab_name }
                    ]}
                  />
                  <EquipmentCard 
                    title="Time & Schedule"
                    icon={Calendar}
                    accentColor="purple"
                    fields={[
                      { label: 'Session Date', value: s.date },
                      { label: 'Start Time', value: s.time },
                      { label: 'Created At', value: s.created_at ? new Date(s.created_at).toLocaleString() : '—' }
                    ]}
                  />
                  <EquipmentCard 
                    title="Roll Stats"
                    icon={Users}
                    accentColor="teal"
                    fields={[
                      { label: 'Total Entries', value: s.entry_count },
                      { label: 'Status', value: 'Completed' }
                    ]}
                  />
                  <EquipmentCard 
                    title="Reference Info"
                    icon={Hash}
                    accentColor="blue"
                    fields={[
                      { label: 'Session ID', value: `#${s.id}` },
                      { label: 'DB Record', value: 'Canonical' }
                    ]}
                  />
                </div>
              </div>
            }
          />
        ))}
      </ModernTable>

      {/* Delete Confirm */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Muster Session?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this muster session? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default MusterList;