import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Search } from '@mui/icons-material';
import { softwareAPI, labsAPI, pcsAPI } from '../services/api';
import type { Software as SoftwareType, Lab, PC } from '../types';

type SoftwareForm = {
  pc: number | '';
  name: string;
  version: string;
  license_key: string;
  expiry_date: string; // YYYY-MM-DD
};

const emptyForm: SoftwareForm = {
  pc: '',
  name: '',
  version: '',
  license_key: '',
  expiry_date: '',
};

const Software: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<SoftwareType[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fPc, setFPc] = useState<number | ''>('');

  // form
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SoftwareForm>(emptyForm);

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [labsData, softwareData] = await Promise.all([
        labsAPI.getAll(),
        softwareAPI.getAll(),
      ]);
      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const labsArray = toArray(labsData);
      const softwareArray = toArray(softwareData);
      setLabs(labsArray);

      // Load PCs for all labs so we can map pc -> lab
      const pcsAll: PC[] = [];
      for (const lab of labsArray) {
        try {
          const labPcs = await pcsAPI.getByLab(lab.id);
          // Extract results from paginated response if needed
          const pcsArray = Array.isArray((labPcs as any)?.results) ? (labPcs as any).results : (Array.isArray(labPcs) ? labPcs : []);
          pcsAll.push(...pcsArray);
        } catch (err: any) {
          console.warn(`Failed to load PCs for lab ${lab.id}:`, err);
        }
      }
      setPcs(pcsAll);
      setItems(softwareArray);
    } catch (e: any) {
      console.error('Failed to load software:', e);
      setError(e?.response?.data?.detail || 'Failed to load software. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pcToLab = (pcId: number) => pcs.find((p) => p.id === pcId)?.lab;
  const pcsForLab = (labId: number | '') => (labId ? pcs.filter((p) => p.lab === labId) : pcs);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchLab = fLab ? pcToLab(it.pc) === fLab : true;
      const matchPc = fPc ? it.pc === fPc : true;
      const text = `${it.name} ${it.version ?? ''} ${it.license_key ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      return matchLab && matchPc && matchQ;
    });
  }, [items, fLab, fPc, q, pcs]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (row: SoftwareType) => {
    setEditingId(row.id);
    setFormData({
      pc: row.pc,
      name: row.name,
      version: row.version || '',
      license_key: row.license_key || '',
      expiry_date: row.expiry_date ? row.expiry_date.slice(0,10) : '',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pc || !formData.name.trim()) {
      setError('PC and name are required');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        pc: formData.pc,
        name: formData.name.trim(),
        version: formData.version.trim() || undefined,
        license_key: formData.license_key.trim() || undefined,
        expiry_date: formData.expiry_date || undefined,
      };
      if (editingId) {
        const updated = await softwareAPI.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setSuccess('Software updated');
      } else {
        const created = await softwareAPI.create(formData.pc as number, payload);
        setItems((prev) => [created, ...prev]);
        setSuccess('Software created');
      }
      setOpenForm(false);
    } catch (err: any) {
      console.error('Failed to save software:', err);
      const data = err?.response?.data;
      if (data) {
        const msgs: string[] = [];
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`);
          else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
        });
        setError(msgs.join('\n') || 'Save failed');
      } else {
        setError('Failed to save software. Please check your data and try again.');
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
      await softwareAPI.delete(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setSuccess('Software deleted');
    } catch (e) {
      setError('Delete failed');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Software
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Search"
              placeholder="Name, version or license..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ endAdornment: <Search fontSize="small" /> }}
              sx={{ flex: 1 }}
            />
            <TextField select label="Lab" value={fLab} onChange={(e) => { setFLab(e.target.value === '' ? '' : Number(e.target.value)); setFPc(''); }} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              {labs.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="PC" value={fPc} onChange={(e) => setFPc(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              {pcsForLab(fLab).map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadAll} disabled={loading}>
                  {loading ? <CircularProgress size={22} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Software</Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm p-8 text-center text-[var(--text-secondary)]">
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            No software found
          </Typography>
          <Typography>
            Try changing filters or add new software.
          </Typography>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Lab / PC</th>
                  <th className="px-6 py-4 whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Version</th>
                  <th className="px-6 py-4 whitespace-nowrap">License</th>
                  <th className="px-6 py-4 whitespace-nowrap">Expiry</th>
                  {isAdmin && <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-[var(--bg-main)] transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm group"
                  >
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">
                      <div className="font-medium text-[var(--text-primary)]">
                        {pcs.find((p) => p.id === row.pc)?.name || row.pc}
                      </div>
                      <div className="text-xs mt-0.5">
                        {labs.find((l) => l.id === pcToLab(row.pc))?.name || pcToLab(row.pc) || 'Unknown Lab'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] font-medium">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {row.version || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {row.license_key ? (
                        <span className="font-mono text-xs bg-[var(--bg-main)] px-2 py-1 rounded">
                          {row.license_key}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {row.expiry_date ? row.expiry_date.slice(0,10) : '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <button
                              onClick={() => openEdit(row)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Edit fontSize="small" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <button
                              onClick={() => confirmDelete(row.id)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Delete fontSize="small" />
                            </button>
                          </Tooltip>
                        </Stack>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isAdmin && (
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Software' : 'Add Software'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Lab" value={fLab} onChange={(e) => { const labVal = e.target.value === '' ? '' : Number(e.target.value); setFLab(labVal); setFormData({ ...formData, pc: '' }); }} fullWidth>
                  <MenuItem value="">Select Lab (optional)</MenuItem>
                  {labs.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="PC" value={formData.pc} onChange={(e) => setFormData({ ...formData, pc: e.target.value === '' ? '' : Number(e.target.value) })} required fullWidth>
                  {pcsForLab(fLab).map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
                <TextField label="Version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="License Key" value={formData.license_key} onChange={(e) => setFormData({ ...formData, license_key: e.target.value })} fullWidth />
                <TextField label="Expiry Date" type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
      )}

      {/* Delete confirm */}
      {isAdmin && (
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Software?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this software? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ whiteSpace: 'pre-line' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Software;
