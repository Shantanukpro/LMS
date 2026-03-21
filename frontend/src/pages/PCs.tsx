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
    return <Chip label="Working" color="success" size="small" />;
  } else if (normalizedStatus === 'not_working') {
    return <Chip label="Not Working" color="error" size="small" />;
  } else if (normalizedStatus === 'under_repair') {
    return <Chip label="Under Repair" color="warning" size="small" />;
  } else {
    return <Chip label={status || 'Unknown'} color="default" size="small" />;
  }
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
    name: '',
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
    name: '',
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
      // Extract results from paginated response
      const labsArray = Array.isArray(labsData) ? labsData : [];
      setLabs(labsArray);

      const all: PC[] = [];
      for (const lab of labsArray) {
        try {
          const labPcs = await pcsAPI.getByLab(lab.id);
          // Extract results from paginated response if needed
          const pcsArray = Array.isArray(labPcs) ? labPcs : [];
          all.push(...pcsArray);
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
      const text = `${p.name ?? ''} ${p.brand ?? ''} ${p.serial_number ?? ''}`.toLowerCase();
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
      name: pc.name || '',
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
    if (!formData.name.trim() || !formData.pc_code.trim()) {
      setError('PC name and PC code are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
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
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        PCs Dashboard
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
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
          <Card sx={{ mb: 2 }}>
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
          <Card>
            <CardContent>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <Box component="thead" sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.100' : 'grey.200' }}>
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Lab</Box>
                    <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Name</Box>
                    <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Brand</Box>
                    <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Serial</Box>
                    <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Status</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {filtered.map((p) => (
                    <Box key={p.id} component="tr" sx={{ '&:nth-of-type(even)': { backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.100' } }}>
                      <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>Lab {p.lab}</Box>
                      <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{p.name}</Box>
                      <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{p.brand || '-'}</Box>
                      <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{p.serial_number || '-'}</Box>
                      <Box component="td" sx={{ p: 1.5 }}>{getStatusChip(p.status)}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
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
                    label="PC Name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
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
                    value={formData.connected}
                    onChange={(e) => setFormData({ ...formData, connected: e.target.value as any })}
                    fullWidth
                  >
                    <MenuItem value={true}>Connected</MenuItem>
                    <MenuItem value={false}>Disconnected</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="GPU"
                    value={formData.gpu}
                    onChange={(e) => setFormData({ ...formData, gpu: e.target.value as any })}
                    fullWidth
                  >
                    <MenuItem value={true}>Has GPU</MenuItem>
                    <MenuItem value={false}>No GPU</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Peripherals"
                    value={formData.peripherals}
                    onChange={(e) => setFormData({ ...formData, peripherals: e.target.value as any })}
                    fullWidth
                  >
                    <MenuItem value={true}>Has Peripherals</MenuItem>
                    <MenuItem value={false}>No Peripherals</MenuItem>
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
