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

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm p-8 text-center text-[var(--text-secondary)]">
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            No muster sessions found
          </Typography>
          <Typography>Click "Create New Session" to get started.</Typography>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Time</th>
                  <th className="px-6 py-4 whitespace-nowrap">Lab</th>
                  <th className="px-6 py-4 whitespace-nowrap">Class</th>
                  <th className="px-6 py-4 whitespace-nowrap">Batch</th>
                  <th className="px-6 py-4 whitespace-nowrap">Entries</th>
                  <th className="px-6 py-4 whitespace-nowrap">Created</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[var(--bg-main)] transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm group"
                  >
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] font-medium">{s.date}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{s.time?.slice(0, 5)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{s.lab_name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{s.class_name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{s.batch}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{s.entry_count}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">{s.created_at?.slice(0, 10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="View/Edit">
                          <button
                            onClick={() => navigate(`/muster/register/${s.id}`)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <Visibility fontSize="small" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <button
                            onClick={() => confirmDelete(s.id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <Delete fontSize="small" />
                          </button>
                        </Tooltip>
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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