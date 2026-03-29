import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add, Delete, Edit, Refresh, Search } from '@mui/icons-material';
import { labsAPI } from '../services/api';
import type { Lab } from '../types';

const emptyForm = { name: '', location: '' };

type LabForm = typeof emptyForm;

const Labs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [q, setQ] = useState('');

  const [openForm, setOpenForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<LabForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState<boolean>(false);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await labsAPI.getAll();
      setLabs(data);
      setError('');
    } catch (e: any) {
      console.error('Failed to load labs:', e);
      setError(e.response?.data?.detail || 'Failed to load labs. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const filteredLabs = useMemo(() => {
    if (!q) return labs;
    return labs.filter((lab) =>
      lab.name.toLowerCase().includes(q.toLowerCase()) ||
      (lab.location || '').toLowerCase().includes(q.toLowerCase())
    );
  }, [labs, q]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpenForm(true);
  };

  const handleOpenEdit = (lab: Lab) => {
    setEditingId(lab.id);
    setFormData({ name: lab.name, location: lab.location || '' });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Lab name is required');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        const updated = await labsAPI.update(editingId, {
          name: formData.name.trim(),
          location: formData.location?.trim() || '',
        });
        setLabs((prev) => prev.map((l) => (l.id === editingId ? updated : l)));
        setSuccess('Lab updated successfully');
      } else {
        const created = await labsAPI.create({
          name: formData.name.trim(),
          location: formData.location?.trim() || '',
        });
        setLabs((prev) => [created, ...prev]);
        setSuccess('Lab created successfully');
      }
      setOpenForm(false);
    } catch (e: any) {
      console.error('Failed to save lab:', e);
      const detail = e?.response?.data?.detail || e?.response?.data?.name?.[0] || 'Save failed';
      setError(typeof detail === 'string' ? detail : 'Failed to save lab. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await labsAPI.delete(deleteId);
      setLabs((prev) => prev.filter((l) => l.id !== deleteId));
      setSuccess('Lab deleted successfully');
    } catch (e: any) {
      console.error('Failed to delete lab:', e);
      setError(e?.response?.data?.detail || 'Failed to delete lab. Please try again.');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Labs
      </Typography>

      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
          <TextField
            label="Search Labs"
            placeholder="By name or location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, maxWidth: { sm: 400 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh">
              <span>
                <IconButton color="primary" onClick={loadLabs} disabled={loading}>
                  {loading ? <CircularProgress size={22} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                Add Lab
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>

      {loading ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', color: 'text.secondary', py: 8 }}>
              <Typography variant="h6">
                {labs.length > 0 ? 'No labs match your search' : 'No labs found'}
              </Typography>
              <Typography>
                {labs.length > 0
                  ? 'Try a different search term.'
                  : isAdmin ? 'Click "Add Lab" to create one.' : 'No labs available.'}
              </Typography>
            </CardContent>
          </Card>
        </>
      ) : (
        <Grid container spacing={3}>
          {filteredLabs.map((lab) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={lab.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent
                  sx={{ flexGrow: 1, cursor: 'pointer' }}
                  onClick={() => navigate(`/labs/${lab.id}`)}
                >
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {lab.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {lab.location || 'No location specified'}
                  </Typography>
                </CardContent>
                {isAdmin && (
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton color="info" size="small" onClick={() => handleOpenEdit(lab)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => confirmDelete(lab.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      {isAdmin && (
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Lab' : 'Add Lab'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      )}

      {/* Delete Confirm */}
      {isAdmin && (
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Lab?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this lab? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      )}

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

export default Labs;
