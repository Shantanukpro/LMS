import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link as MLink,
  MenuItem,
} from '@mui/material';
import { Add, ArrowBack, Delete, Edit, Refresh } from '@mui/icons-material';
import { labsAPI, pcsAPI } from '../services/api';
import type { Lab, PC } from '../types';

const emptyPC = { name: '', status: 'working', brand: '', serial_number: '' };

type PCForm = typeof emptyPC;

const LabDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const labId = Number(id);

  const [lab, setLab] = useState<Lab | null>(null);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [openForm, setOpenForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<PCForm>(emptyPC);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState<boolean>(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [labData, pcData] = await Promise.all([
        labsAPI.getById(labId),
        pcsAPI.getByLab(labId),
      ]);
      setLab(labData);
      // Extract results from paginated response if needed
      const pcsArray = Array.isArray(pcData?.results) ? pcData.results : Array.isArray(pcData) ? pcData : [];
      setPcs(pcsArray);
    } catch (e: any) {
      console.error('Failed to load lab or PCs:', e);
      setError(e?.response?.data?.detail || 'Failed to load lab details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!labId) return;
    loadAll();
  }, [labId]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyPC);
    setOpenForm(true);
  };

  const handleOpenEdit = (pc: PC) => {
    setEditingId(pc.id);
    setFormData({
      name: pc.name,
      status: pc.status,
      brand: pc.brand || '',
      serial_number: pc.serial_number || '',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('PC name is required');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        const updated = await pcsAPI.update(editingId, {
          device_name: formData.name.trim(),
          status: formData.status,
          brand: formData.brand?.trim() || undefined,
          serial_number: formData.serial_number?.trim() || undefined,
        });
        setPcs((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setSuccess('PC updated successfully');
      } else {
        const created = await pcsAPI.create(labId, {
          device_name: formData.name.trim(),
          status: formData.status,
          brand: formData.brand?.trim() || undefined,
          serial_number: formData.serial_number?.trim() || undefined,
        });
        setPcs((prev) => [created, ...prev]);
        setSuccess('PC created successfully');
      }
      setOpenForm(false);
    } catch (e: any) {
      const detail = e?.response?.data || 'Save failed';
      setError(typeof detail === 'string' ? detail : 'Save failed');
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
      await pcsAPI.delete(deleteId);
      setPcs((prev) => prev.filter((p) => p.id !== deleteId));
      setSuccess('PC deleted successfully');
    } catch (e) {
      setError('Delete failed');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const rows = useMemo(() => pcs, [pcs]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/labs')}><ArrowBack /></IconButton>
        <Breadcrumbs>
          <MLink component="button" onClick={() => navigate('/')}>Dashboard</MLink>
          <MLink component="button" onClick={() => navigate('/labs')}>Labs</MLink>
          <Typography color="text.primary">Lab</Typography>
        </Breadcrumbs>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{lab?.name}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Location: {lab?.location || '-'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>PCs</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <span>
                  <IconButton color="primary" onClick={loadAll} disabled={loading}>
                    {loading ? <CircularProgress size={22} /> : <Refresh />}
                  </IconButton>
                </span>
              </Tooltip>
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Add PC</Button>
            </Stack>
          </Box>

          <Card>
            <CardContent>
              {rows.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
                  <Typography variant="body1">No PCs found. Click "Add PC" to create one.</Typography>
                </Box>
              ) : (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <Box component="thead" sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.100' : 'grey.200' }}>
                    <Box component="tr">
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Name</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Status</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Brand</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Serial No.</Box>
                      <Box component="th" sx={{ textAlign: 'right', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Actions</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {rows.map((pc) => (
                      <Box component="tr" key={pc.id} sx={{ '&:nth-of-type(even)': { backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.100' } }}>
                        <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{pc.name}</Box>
                        <Box component="td" sx={{ p: 1.5, textTransform: 'capitalize', color: 'text.primary' }}>{pc.status}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{pc.brand || '-'}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{pc.serial_number || '-'}</Box>
                        <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>
                          <Tooltip title="Edit">
                            <IconButton color="info" onClick={() => handleOpenEdit(pc)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => confirmDelete(pc.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create/Edit PC Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit PC' : 'Add PC'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
              <TextField
                label="Status"
                select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="working">Working</MenuItem>
                <MenuItem value="not_working">Not Working</MenuItem>
              </TextField>
              <TextField
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
              <TextField
                label="Serial Number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
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

      {/* Delete Confirm */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete PC?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this PC? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LabDetail;
