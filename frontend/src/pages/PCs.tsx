import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Card, CardContent, Stack, TextField, MenuItem, Chip, CircularProgress, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { Search, Refresh, Add, Edit, Delete } from '@mui/icons-material';
import { labsAPI, pcsAPI } from '../services/api';
import type { Lab, PC } from '../types';
import LabPCTable from '../components/Labs/LabPCTable';

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
    product_id: '',
    brand: '',
    serial_number: '',
    processor: '',
    ram: '',
    storage: '',
    status: 'working' as 'working' | 'not_working' | 'under_repair',
    connected: true,
    gpu: false,
    cpu_model: '',
    cpu_clock_speed: '',
    cpu_core_count: '' as number | '',
    cpu_integrated_graphics: false,
    keyboard_status: 'working' as 'working' | 'broken',
    mouse_status: 'working' as 'working' | 'broken',
  });

  const emptyForm = {
    device_name: '',
    product_id: '',
    brand: '',
    serial_number: '',
    processor: '',
    ram: '',
    storage: '',
    status: 'working' as 'working' | 'not_working' | 'under_repair',
    connected: true,
    gpu: false,
    cpu_model: '',
    cpu_clock_speed: '',
    cpu_core_count: '' as number | '',
    cpu_integrated_graphics: false,
    keyboard_status: 'working' as 'working' | 'broken',
    mouse_status: 'working' as 'working' | 'broken',
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
    const keyboard = pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'keyboard');
    const mouse = pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'mouse');

    setEditingId(pc.id);
    setFormData({
      device_name: pc.device_name || '',
      product_id: pc.product_id || '',
      brand: pc.brand || '',
      serial_number: pc.serial_number || '',
      processor: pc.processor || '',
      ram: pc.ram || '',
      storage: pc.storage || '',
      status: pc.status as any || 'working',
      connected: pc.connected ?? true,
      gpu: pc.gpu ?? false,
      cpu_model: pc.cpu?.model || '',
      cpu_clock_speed: pc.cpu?.clock_speed || '',
      cpu_core_count: pc.cpu?.core_count || '',
      cpu_integrated_graphics: pc.cpu?.integrated_graphics || false,
      keyboard_status: (keyboard?.status as any) || 'working',
      mouse_status: (mouse?.status as any) || 'working',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_name.trim() || !formData.product_id.trim()) {
      setError('PC name and PC code are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        device_name: formData.device_name.trim(),
        product_id: formData.product_id.trim(),
        brand: formData.brand || undefined,
        serial_number: formData.serial_number || undefined,
        processor: formData.processor?.trim() || undefined,
        ram: formData.ram?.trim() || undefined,
        storage: formData.storage?.trim() || undefined,
        status: formData.status,
        connected: formData.connected,
        gpu: formData.gpu,
        cpu: {
          model: formData.cpu_model.trim() || undefined,
          clock_speed: formData.cpu_clock_speed.trim() || undefined,
          core_count: formData.cpu_core_count || undefined,
          integrated_graphics: formData.cpu_integrated_graphics,
        },
        peripheral_devices: [
          { peripheral_type: 'keyboard', status: formData.keyboard_status },
          { peripheral_type: 'mouse', status: formData.mouse_status }
        ]
      };

      if (editingId) {
        const updated = await pcsAPI.update(editingId, payload as any);
        setPcs((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setSuccess('PC updated');
      } else {
        // Need to select a lab for creating new PC
        if (!fLab) {
          setError('Please select a lab to add a PC');
          return;
        }
        const created = await pcsAPI.create(fLab, payload as any);
        setPcs((prev) => [created, ...prev]);
        setSuccess('PC created');
      }
      setOpenForm(false);
    } catch (err: any) {
      console.error('Failed to save PC:', err);
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setError(data.length > 100 ? 'Save failed: Server Error' : data);
        } else if (typeof data === 'object') {
          const errorMsgs = Object.entries(data)
            .map(([field, errors]) => {
              const msg = Array.isArray(errors) ? errors[0] : errors;
              return `${field}: ${msg}`;
            })
            .join(', ');
          setError(errorMsgs || 'Save failed: Invalid data');
        } else {
          setError('Save failed');
        }
      } else {
        setError(err.message || 'Save failed');
      }
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
          <LabPCTable 
            pcs={filtered} 
            onEdit={openEdit} 
            onDelete={() => {}} // PCs page doesn't seem to have delete logic in the current row
            showLab={true}
          />
        </>
      )}

      {/* Add/Edit PC Dialog */}
      {isAdmin && (
        <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Edit Computer' : 'Add New Computer'}</DialogTitle>
          <Box component="form" onSubmit={handleSave}>
            <DialogContent dividers>
              <Stack spacing={4}>
                {/* Section 1: Identity */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Identifying Information</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField 
                      label="PC Name (COMP ID)" 
                      value={formData.device_name} 
                      onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} 
                      required 
                      fullWidth 
                    />
                    <TextField 
                      label="Product ID / PC Code" 
                      value={formData.product_id} 
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} 
                      required 
                      fullWidth 
                    />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <TextField label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} fullWidth />
                    <TextField label="Serial Number" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} fullWidth />
                  </Stack>
                </Box>

                {/* Section 2: Hardware Specs (Global request) */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Hardware Overview (Legacy / Basic)</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label="Processor Info"
                      value={formData.processor}
                      onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="RAM Capacity"
                      value={formData.ram}
                      onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <TextField
                      label="Graphics Card"
                      select
                      value={formData.gpu ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, gpu: e.target.value === 'true' })}
                      fullWidth
                    >
                      <MenuItem value="true">Yes (Dedicated)</MenuItem>
                      <MenuItem value="false">No (Integrated)</MenuItem>
                    </TextField>
                    <TextField
                      label="Storage Capacity"
                      value={formData.storage}
                      onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                      fullWidth
                    />
                  </Stack>
                </Box>

                {/* Section 3: CPU Deep Details */}
                <Box>
                  <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold' }}>CPU Specifications (Deep Details)</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label="Exact CPU Model"
                      value={formData.cpu_model}
                      onChange={(e) => setFormData({ ...formData, cpu_model: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="Clock Speed"
                      value={formData.cpu_clock_speed}
                      onChange={(e) => setFormData({ ...formData, cpu_clock_speed: e.target.value })}
                      fullWidth
                      placeholder="e.g. 3.2GHz"
                    />
                    <TextField
                      label="Cores"
                      type="number"
                      value={formData.cpu_core_count}
                      onChange={(e) => setFormData({ ...formData, cpu_core_count: e.target.value ? parseInt(e.target.value) : '' })}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" sx={{ mt: 1 }}>
                    <MenuItem sx={{ p: 0 }}>
                      <TextField
                        select
                        label="Integrated Graphics"
                        value={formData.cpu_integrated_graphics ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, cpu_integrated_graphics: e.target.value === 'true' })}
                        fullWidth
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <MenuItem value="true">Supports Integrated</MenuItem>
                        <MenuItem value="false">No Integrated Support</MenuItem>
                      </TextField>
                    </MenuItem>
                  </Stack>
                </Box>

                {/* Section 4: Peripherals & Status */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Peripheral Status</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      select
                      label="Keyboard Status"
                      value={formData.keyboard_status}
                      onChange={(e) => setFormData({ ...formData, keyboard_status: e.target.value as any })}
                      fullWidth
                    >
                      <MenuItem value="working">Working</MenuItem>
                      <MenuItem value="broken">Broken / Missing</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Mouse Status"
                      value={formData.mouse_status}
                      onChange={(e) => setFormData({ ...formData, mouse_status: e.target.value as any })}
                      fullWidth
                    >
                      <MenuItem value="working">Working</MenuItem>
                      <MenuItem value="broken">Broken / Missing</MenuItem>
                    </TextField>
                  </Stack>
                </Box>

                {/* Section 5: Network & OS Status */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Operational Status</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField 
                      select 
                      label="Functional Status" 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
                      fullWidth
                    >
                      <MenuItem value="working">Working</MenuItem>
                      <MenuItem value="not_working">Not Working</MenuItem>
                      <MenuItem value="under_repair">Under Repair</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Lan Connectivity"
                      value={formData.connected ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, connected: e.target.value === 'true' })}
                      fullWidth
                    >
                      <MenuItem value="true">Connected / Active</MenuItem>
                      <MenuItem value="false">Disconnected</MenuItem>
                    </TextField>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, bg: 'var(--bg-main)' }}>
              <Button onClick={() => setOpenForm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving} sx={{ px: 4, borderRadius: '8px' }}>
                {saving ? 'Processing...' : 'Save Computer'}
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
