import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Card, CardContent, Stack, TextField, MenuItem, Chip, CircularProgress, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Search, Refresh, Add, Edit, Delete, ExpandMore } from '@mui/icons-material';
import { labsAPI, pcsAPI } from '../services/api';
import type { Lab, PC } from '../types';
import LabPCTable from '../components/Labs/LabPCTable';
import { X } from 'lucide-react';

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
    os_name: '',
    os_version: '',
    os_product_key: '',
    os_architecture: '64-bit' as '64-bit' | '32-bit',
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
    os_name: '',
    os_version: '',
    os_product_key: '',
    os_architecture: '64-bit' as '64-bit' | '32-bit',
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
      os_name: pc.os?.name || '',
      os_version: pc.os?.version || '',
      os_product_key: pc.os?.product_key || '',
      os_architecture: pc.os?.architecture || '64-bit',
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
        
        try {
          if (formData.os_name) {
            await pcsAPI.updateOS(editingId, {
              name: formData.os_name,
              version: formData.os_version,
              product_key: formData.os_product_key,
              architecture: formData.os_architecture,
            });
          }
          if (formData.cpu_model) {
            await pcsAPI.updateCPU(editingId, {
              model: formData.cpu_model,
              clock_speed: formData.cpu_clock_speed,
              core_count: Number(formData.cpu_core_count) || undefined,
              integrated_graphics: formData.cpu_integrated_graphics,
            });
          }
        } catch (e) {
          console.warn("Failed saving OS/CPU details:", e);
        }

        await load();
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

      {/* Tailwind CSS Filter Bar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white/50 dark:bg-slate-900/40 p-3 rounded-[1.25rem] border border-slate-200 dark:border-slate-800/60 shadow-sm backdrop-blur-xl transition-all duration-300">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search fontSize="small" className="text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Name, brand or serial..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 shadow-sm transition-all duration-300"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
            {/* Filter Dropdowns using native select with Tailwind styling */}
            <select
              value={fLab}
              onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))}
              className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md"
            >
              <option value="" className="dark:bg-slate-800">All Labs</option>
              {labs.map((l) => (
                <option key={l.id} value={l.id} className="dark:bg-slate-800">{l.name}</option>
              ))}
            </select>

            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md"
            >
              <option value="" className="dark:bg-slate-800">All Statuses</option>
              <option value="working" className="dark:bg-slate-800">Working</option>
              <option value="not_working" className="dark:bg-slate-800">Not Working</option>
              <option value="under_repair" className="dark:bg-slate-800">Under Repair</option>
            </select>

            {/* Quick Stats Chips */}
            <div className="hidden xl:flex items-center gap-1.5 ml-2 mr-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 tracking-wide uppercase">Total: {totals.total}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 tracking-wide uppercase">Works: {totals.working}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 tracking-wide uppercase">Fail: {totals.not_working}</span>
            </div>

            <Tooltip title="Refresh">
              <button
                onClick={load}
                disabled={loading}
                className="p-2.5 rounded-full border border-transparent text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 disabled:opacity-50"
              >
                {loading ? <CircularProgress size={18} color="inherit" /> : <Refresh fontSize="small" />}
              </button>
            </Tooltip>

            {isAdmin && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ml-1"
              >
                <Add fontSize="small" />
                <span>Add PC</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(q || fLab || fStatus) && (
          <div className="flex flex-wrap gap-2 items-center px-2 animate-fade-in">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 uppercase tracking-wider">Active Filters:</span>
            
            {q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                <span className="text-slate-400">Search:</span> {q}
                <button onClick={() => setQ('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                  <X size={14} />
                </button>
              </span>
            )}
            
            {fLab && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                <span className="text-slate-400">Lab:</span> {labs.find(l => l.id === fLab)?.name}
                <button onClick={() => setFLab('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                  <X size={14} />
                </button>
              </span>
            )}

            {fStatus && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 capitalize">
                <span className="text-slate-400">Status:</span> {fStatus.replace('_', ' ')}
                <button onClick={() => setFStatus('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                  <X size={14} />
                </button>
              </span>
            )}

            <button
              onClick={() => { setQ(''); setFLab(''); setFStatus(''); }}
              className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold px-2 py-1 ml-1 cursor-pointer transition-colors duration-300 opacity-80 hover:opacity-100"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

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

                {/* Section 3: CPU & OS Deep Details (Collapsible) */}
                <Box>
                  <Accordion sx={{ bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 2 }} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                      CPU Configuration (Advanced)
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <TextField
                          label="Exact CPU Model"
                          value={formData.cpu_model}
                          onChange={(e) => setFormData({ ...formData, cpu_model: e.target.value })}
                          fullWidth size="small"
                        />
                        <TextField
                          label="Clock Speed"
                          value={formData.cpu_clock_speed}
                          onChange={(e) => setFormData({ ...formData, cpu_clock_speed: e.target.value })}
                          fullWidth size="small"
                          placeholder="e.g. 3.2GHz"
                        />
                        <TextField
                          label="Cores"
                          type="number"
                          value={formData.cpu_core_count}
                          onChange={(e) => setFormData({ ...formData, cpu_core_count: e.target.value ? parseInt(e.target.value) : '' })}
                          fullWidth size="small"
                        />
                      </Stack>
                      <TextField
                        select
                        label="Integrated Graphics"
                        value={formData.cpu_integrated_graphics ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, cpu_integrated_graphics: e.target.value === 'true' })}
                        fullWidth size="small" sx={{ maxWidth: 250 }}
                      >
                        <MenuItem value="true">Supports Integrated</MenuItem>
                        <MenuItem value="false">No Integrated Support</MenuItem>
                      </TextField>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={{ bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                      Operating System Configuration
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <TextField
                          select
                          label="OS Type"
                          value={formData.os_name}
                          onChange={(e) => setFormData({ ...formData, os_name: e.target.value })}
                          fullWidth size="small"
                        >
                          <MenuItem value="">Select OS</MenuItem>
                          <MenuItem value="Windows 10">Windows 10</MenuItem>
                          <MenuItem value="Windows 11">Windows 11</MenuItem>
                          <MenuItem value="Ubuntu Linux">Ubuntu Linux</MenuItem>
                          <MenuItem value="macOS">macOS</MenuItem>
                        </TextField>
                        <TextField
                          label="Version/Build"
                          value={formData.os_version}
                          onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                          fullWidth size="small"
                          placeholder="22H2"
                        />
                        <TextField
                          select
                          label="Architecture"
                          value={formData.os_architecture}
                          onChange={(e) => setFormData({ ...formData, os_architecture: e.target.value as any })}
                          fullWidth size="small"
                        >
                          <MenuItem value="64-bit">64-bit</MenuItem>
                          <MenuItem value="32-bit">32-bit</MenuItem>
                        </TextField>
                      </Stack>
                      <TextField
                        label="License / Product Key"
                        value={formData.os_product_key}
                        onChange={(e) => setFormData({ ...formData, os_product_key: e.target.value })}
                        fullWidth size="small"
                        sx={{ input: { fontFamily: 'monospace' } }}
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      />
                    </AccordionDetails>
                  </Accordion>
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
