import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Card, CardContent, Stack, TextField, MenuItem, Chip, CircularProgress, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { Search, Refresh, Add, Edit, Delete } from '@mui/icons-material';
import { labsAPI, pcsAPI } from '../services/api';
import type { Lab, PC } from '../types';

type Agg = { total: number; working: number; not_working: number; under_repair: number; other: number };

const getStatusChip = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || '';

  if (normalizedStatus === 'working') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
        Working
      </span>
    );
  } else if (normalizedStatus === 'not_working') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
        Not Working
      </span>
    );
  } else if (normalizedStatus === 'under_repair') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
        Under Repair
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
        {status || 'Unknown'}
      </span>
    );
  }
};

const getPeripheral = (pc: PC, type: string) => {
  const p = pc.peripheral_devices?.find(d => d.peripheral_type === type);
  if (!p) return '-';
  return p.status === 'working' ? '✅ Working' : '❌ Not Working';
};

const PCs: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fStatus, setFStatus] = useState<string | ''>('');

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    device_name: '',
    pc_code: '',
    brand: '',
    serial_number: '',
    processor: '',
    ram: '',
    storage: '',
    status: 'working' as 'working' | 'not_working' | 'under_repair',
    connected: true,
    gpu: false,
    peripherals: false,
  });

  const emptyForm = {
    device_name: '',
    pc_code: '',
    brand: '',
    serial_number: '',
    processor: '',
    ram: '',
    storage: '',
    status: 'working' as 'working' | 'not_working' | 'under_repair',
    connected: true,
    gpu: false,
    peripherals: false,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const labsData = await labsAPI.getAll();
      setLabs(labsData);

      const all: PC[] = [];
      for (const lab of labsData) {
        try {
          const labPcs = await pcsAPI.getByLab(lab.id);
          all.push(...labPcs);
        } catch (err) {
          console.warn(`Failed to load PCs for lab ${lab.id}:`, err);
        }
      }
      setPcs(all);
    } catch (e: any) {
      console.error('Failed to load PCs:', e);
      setError(e?.response?.data?.detail || 'Failed to load PCs. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return pcs.filter((p) => {
      const matchLab = fLab ? p.lab === fLab : true;
      const text = `${p.device_name ?? ''} ${p.brand ?? ''} ${p.serial_number ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      const matchStatus = fStatus ? (p.status || '').toLowerCase() === fStatus : true;
      return matchLab && matchQ && matchStatus;
    });
  }, [pcs, fLab, q, fStatus]);

  const totals: Agg = useMemo(() => {
    return filtered.reduce((acc, p) => {
      acc.total += 1;
      const s = (p.status || '').toLowerCase();
      if (s === 'working') acc.working += 1;
      else if (s === 'not_working') acc.not_working += 1;
      else if (s === 'under_repair') acc.under_repair += 1;
      else acc.other += 1; // unknown status
      return acc;
    }, { total: 0, working: 0, not_working: 0, under_repair: 0, other: 0 });
  }, [filtered]);

  const byLab: Record<number, Agg> = useMemo(() => {
    const map: Record<number, Agg> = {} as any;
    filtered.forEach((p) => {
      const entry = (map[p.lab] ??= { total: 0, working: 0, not_working: 0, under_repair: 0, other: 0 });
      entry.total += 1;
      const s = (p.status || '').toLowerCase();
      if (s === 'working') entry.working += 1;
      else if (s === 'not_working') entry.not_working += 1;
      else if (s === 'under_repair') entry.under_repair += 1;
      else entry.other += 1;
    });
    return map;
  }, [filtered]);

  const labIds = Object.keys(byLab).map(Number);
  const maxLabTotal = Math.max(1, ...labIds.map((id) => byLab[id]?.total || 0));

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (pc: PC) => {
    setEditingId(pc.id);
    setFormData({
      device_name: pc.device_name || '',
      pc_code: pc.pc_code || '',
      brand: pc.brand || '',
      serial_number: pc.serial_number || '',
      processor: pc.processor || '',
      ram: pc.ram || '',
      storage: pc.storage || '',
      status: pc.status || 'working',
      connected: pc.connected,
      gpu: pc.gpu,
      peripherals: pc.peripherals,
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_name.trim() || !formData.pc_code.trim()) {
      setError('PC name and PC code are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        device_name: formData.device_name.trim(),
        pc_code: formData.pc_code.trim(),
        brand: formData.brand || undefined,
        serial_number: formData.serial_number || undefined,
        processor: formData.processor || undefined,
        ram: formData.ram || undefined,
        storage: formData.storage || undefined,
        status: formData.status,
        connected: formData.connected,
        gpu: formData.gpu,
        peripherals: formData.peripherals,
      };

      if (editingId) {
        const updated = await pcsAPI.update(editingId, payload);
        setPcs((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setSuccess('PC updated');
      } else {
        // Need to select a lab for creating new PC
        if (!fLab) {
          setError('Please select a lab to add a PC');
          return;
        }
        const created = await pcsAPI.create(fLab, payload);
        setPcs((prev) => [created, ...prev]);
        setSuccess('PC created');
      }
      setOpenForm(false);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        const msgs: string[] = [];
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`);
          else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
        });
        setError(msgs.join('\n') || 'Save failed');
      } else setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>PCs Dashboard</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Track all PC assets across labs</Typography>
      </Box>

      {/* Filters */}
      <Card
        className="panel"
        sx={{ mb: 4, bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Search"
              placeholder="Name, brand or serial..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ endAdornment: <Search fontSize="small" /> }}
              sx={{ flex: 1 }}
            />
            <TextField select label="Lab" value={fLab} onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              {labs.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="working">Working</MenuItem>
              <MenuItem value="not_working">Not Working</MenuItem>
              <MenuItem value="under_repair">Under Repair</MenuItem>
            </TextField>
            <Box>
              <Chip label={`Total: ${totals.total}`} sx={{ mr: 1 }} />
              <Chip color="success" label={`Working: ${totals.working}`} sx={{ mr: 1 }} />
              <Chip color="error" label={`Not Working: ${totals.not_working}`} sx={{ mr: 1 }} />
              <Chip color="warning" label={`Under Repair: ${totals.under_repair}`} sx={{ mr: 1 }} />
              {totals.other > 0 && <Chip color="default" label={`Other: ${totals.other}`} />}
            </Box>
            <Tooltip title="Refresh">
              <IconButton onClick={load} disabled={loading}>
                {loading ? <CircularProgress size={22} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                Add PC
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Bar Chart by Lab */}
          <Card
            className="panel"
            sx={{ mb: 4, bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>PCs by Lab</Typography>
              {labIds.length === 0 ? (
                <Typography color="text.secondary">No data</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Box component="svg" width={Math.max(600, labIds.length * 160)} height={280} sx={{ '& text': { fill: 'currentColor' } }}>
                    {labIds.map((id, idx) => {
                      const agg = byLab[id]!;
                      const x = 70 + idx * 140;
                      const scale = (v: number) => (v / maxLabTotal) * 160;
                      return (
                        <g key={id}>
                          <rect x={x} y={60 + (160 - scale(agg.working))} width={28} height={scale(agg.working)} fill="#16a34a" rx={4} />
                          <rect x={x + 34} y={60 + (160 - scale(agg.not_working))} width={28} height={scale(agg.not_working)} fill="#dc2626" rx={4} />
                          <rect x={x + 68} y={60 + (160 - scale(agg.under_repair))} width={28} height={scale(agg.under_repair)} fill="#f59e0b" rx={4} />
                          <text x={x + 48} y={240} textAnchor="middle" fontSize="12">Lab {id}</text>
                        </g>
                      );
                    })}
                    <g>
                      <rect x={10} y={10} width={12} height={12} fill="#16a34a" />
                      <text x={28} y={20} fontSize="12">Working</text>
                      <rect x={110} y={10} width={12} height={12} fill="#dc2626" />
                      <text x={128} y={20} fontSize="12">Not Working</text>
                      <rect x={230} y={10} width={12} height={12} fill="#f59e0b" />
                      <text x={248} y={20} fontSize="12">Under Repair</text>
                    </g>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Lab</th>
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
                    {isAdmin && <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filtered.map((p) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-[var(--bg-main)] transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm group"
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">Lab {p.lab}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-primary)] font-medium">{p.device_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.brand || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.processor || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.ram || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.storage || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.gpu ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{p.cpu?.model || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{getPeripheral(p, 'keyboard')}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{getPeripheral(p, 'mouse')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusChip(p.status)}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Tooltip title="Edit PC">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Edit fontSize="small" />
                            </button>
                          </Tooltip>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 13 : 12} className="px-6 py-8 text-center text-sm text-[var(--text-secondary)]">
                        No PCs found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit PC Dialog */}
      {isAdmin && (
        <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
          <DialogTitle>{editingId ? 'Edit PC' : 'Add PC'}</DialogTitle>
          <Box component="form" onSubmit={handleSave}>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TextField 
                    label="PC Name (COMP ID)" 
                    value={formData.device_name} 
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} 
                    required 
                    fullWidth 
                  />
                  <TextField 
                    label="PC Code" 
                    value={formData.pc_code} 
                    onChange={(e) => setFormData({ ...formData, pc_code: e.target.value })} 
                    required 
                    fullWidth 
                  />
                </Stack>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TextField label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} fullWidth />
                  <TextField label="Serial Number" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} fullWidth />
                </Stack>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TextField label="Processor" value={formData.processor} onChange={(e) => setFormData({ ...formData, processor: e.target.value })} fullWidth />
                  <TextField label="RAM" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} fullWidth />
                </Stack>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TextField label="Storage" value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} fullWidth />
                  <TextField 
                    select 
                    label="Status" 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
                    fullWidth
                  >
                    <MenuItem value="working">Working</MenuItem>
                    <MenuItem value="not_working">Not Working</MenuItem>
                    <MenuItem value="under_repair">Under Repair</MenuItem>
                  </TextField>
                </Stack>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    select
                    label="Connected"
                    value={String(formData.connected)}
                    onChange={(e) => setFormData({ ...formData, connected: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Connected</MenuItem>
                    <MenuItem value="false">Disconnected</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="GPU"
                    value={String(formData.gpu)}
                    onChange={(e) => setFormData({ ...formData, gpu: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Has GPU</MenuItem>
                    <MenuItem value="false">No GPU</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Peripherals"
                    value={String(formData.peripherals)}
                    onChange={(e) => setFormData({ ...formData, peripherals: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Has Peripherals</MenuItem>
                    <MenuItem value="false">No Peripherals</MenuItem>
                  </TextField>
                </Stack>
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

      {/* Success/Error Messages */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ whiteSpace: 'pre-line' }} variant="filled">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PCs;
