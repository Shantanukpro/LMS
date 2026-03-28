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

const emptyPC = { device_name: '', status: 'working', brand: '', serial_number: '', processor: '', ram: '', storage: '' };

type PCForm = typeof emptyPC;

const getPeripheral = (pc: PC, type: string) => {
  const p = pc.peripheral_devices?.find(d => d.peripheral_type === type);
  if (!p) return '-';
  return p.status === 'working' ? '✅ Working' : '❌ Not Working';
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s === 'working') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">Working</span>;
  }
  if (s === 'not_working') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">Not Working</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 capitalize">{status.replace('_', ' ')}</span>;
};

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
      setPcs(Array.isArray(pcData) ? pcData : []);
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
      device_name: pc.device_name || '',
      status: pc.status,
      brand: pc.brand || '',
      serial_number: pc.serial_number || '',
      processor: pc.processor || '',
      ram: pc.ram || '',
      storage: pc.storage || '',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_name.trim()) {
      setError('PC name is required');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        const updated = await pcsAPI.update(editingId, {
          device_name: formData.device_name.trim(),
          status: formData.status as any,
          brand: formData.brand?.trim() || undefined,
          serial_number: formData.serial_number?.trim() || undefined,
          processor: formData.processor?.trim() || undefined,
          ram: formData.ram?.trim() || undefined,
          storage: formData.storage?.trim() || undefined,
        });
        setPcs((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setSuccess('PC updated successfully');
      } else {
        const created = await pcsAPI.create(labId, {
          device_name: formData.device_name.trim(),
          status: formData.status as any,
          brand: formData.brand?.trim() || undefined,
          serial_number: formData.serial_number?.trim() || undefined,
          processor: formData.processor?.trim() || undefined,
          ram: formData.ram?.trim() || undefined,
          storage: formData.storage?.trim() || undefined,
        });
        setPcs((prev) => [created, ...prev]);
        setSuccess('PC created successfully');
      }
      setOpenForm(false);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data) {
        if (typeof data === 'string') {
           setError(data);
        } else {
           const msgs: string[] = [];
           Object.entries(data).forEach(([k, v]) => {
             if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`);
             else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
           });
           setError(msgs.join('\n') || 'Save failed');
        }
      } else {
        setError('Save failed');
      }
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

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
            <div className="overflow-x-auto">
              {rows.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  <Typography variant="body1">No PCs found. Click "Add PC" to create one.</Typography>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">PC Name (COMP ID)</th>
                      <th className="px-6 py-4 whitespace-nowrap">Brand</th>
                      <th className="px-6 py-4 whitespace-nowrap">Processor</th>
                      <th className="px-6 py-4 whitespace-nowrap">RAM</th>
                      <th className="px-6 py-4 whitespace-nowrap">Storage</th>
                      <th className="px-6 py-4 whitespace-nowrap">Graphics Card</th>
                      <th className="px-6 py-4 whitespace-nowrap">CPU</th>
                      <th className="px-6 py-4 whitespace-nowrap">Keyboard</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mouse</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {rows.map((pc) => (
                      <tr 
                        key={pc.id} 
                        className="hover:bg-[var(--bg-main)] transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm group"
                      >
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-primary)] font-medium">{pc.device_name || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.brand || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.processor || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.ram || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.storage || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.gpu ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{pc.cpu?.model || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{getPeripheral(pc, 'keyboard')}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">{getPeripheral(pc, 'mouse')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(pc.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit">
                              <button
                                onClick={() => handleOpenEdit(pc)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <Edit fontSize="small" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <button
                                onClick={() => confirmDelete(pc.id)}
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
              )}
            </div>
          </div>
        </>
      )}

      {/* Create/Edit PC Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit PC' : 'Add PC'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="PC Name (COMP ID)"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                required
                autoFocus
              />
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
              <TextField
                label="Processor"
                value={formData.processor}
                onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
              />
              <TextField
                label="RAM"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
              />
              <TextField
                label="Storage"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
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
