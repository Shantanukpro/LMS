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
import { Add, ArrowBack, Delete, Edit, Refresh, Upload } from '@mui/icons-material';
import { labsAPI, pcsAPI, importAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Lab, PC } from '../types';

const emptyPC = { 
  device_name: '', 
  product_id: '',
  status: 'working', 
  brand: '', 
  serial_number: '', 
  processor: '', 
  ram: '', 
  storage: '',
  graphics_card: '',
  connected: true,
  gpu: false,
  cpu_model: '',
  cpu_clock_speed: '',
  cpu_core_count: '' as number | '',
  cpu_integrated_graphics: false,
  keyboard_status: 'working',
  mouse_status: 'working',
  base_price: '' as string | number,
  cpu_price: '' as string | number,
  os_name: 'Windows 11 Pro',
  os_license_cost: '' as string | number,
  keyboard_price: '' as string | number,
  mouse_price: '' as string | number,
};

type PCForm = typeof emptyPC;

import LabPCTable from '../components/Labs/LabPCTable';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [lab, setLab] = useState<Lab | null>(null);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
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
    const keyboard = pc.peripherals_list?.find(p => p.type.toLowerCase() === 'keyboard')
                     || pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'keyboard');
    const mouse = pc.peripherals_list?.find(p => p.type.toLowerCase() === 'mouse')
                  || pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'mouse');

    setEditingId(pc.id);
    setFormData({
      device_name: pc.device_name || '',
      product_id: pc.product_id || '',
      status: pc.status as any || 'working',
      brand: pc.brand || '',
      serial_number: pc.serial_number || '',
      processor: pc.processor || '',
      ram: pc.ram || '',
      storage: pc.storage || '',
      graphics_card: pc.graphics_card || '',
      connected: pc.connected ?? true,
      gpu: pc.gpu ?? false,
      cpu_model: pc.cpu?.model || '',
      cpu_clock_speed: pc.cpu?.clock_speed || '',
      cpu_core_count: pc.cpu?.core_count || '',
      cpu_integrated_graphics: pc.cpu?.integrated_graphics || false,
      keyboard_status: (keyboard?.status as any) || 'working',
      mouse_status: (mouse?.status as any) || 'working',
      base_price: pc.base_price || '',
      cpu_price: pc.cpu?.price || '',
      os_name: pc.os?.name || 'Windows 11 Pro',
      os_license_cost: pc.os?.license_cost || '',
      keyboard_price: keyboard?.price || '',
      mouse_price: mouse?.price || '',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_name.trim() || !formData.product_id.trim()) {
      setError('PC name and Product ID are required');
      return;
    }
    const payload = {
      device_name: formData.device_name.trim(),
      product_id: formData.product_id.trim(),
      status: formData.status as any,
      connected: formData.connected,
      brand: formData.brand?.trim() || undefined,
      serial_number: formData.serial_number?.trim() || undefined,
      processor: formData.processor?.trim() || undefined,
      ram: formData.ram?.trim() || undefined,
      storage: formData.storage?.trim() || undefined,
      graphics_card: formData.graphics_card?.trim() || undefined,
      gpu: formData.gpu,
      base_price: formData.base_price === '' ? 0 : Number(formData.base_price),
      os: {
        name: formData.os_name.trim() || 'Windows 11 Pro',
        license_cost: formData.os_license_cost === '' ? 0 : Number(formData.os_license_cost)
      },
      cpu: {
        model: formData.cpu_model.trim() || undefined,
        clock_speed: formData.cpu_clock_speed.trim() || undefined,
        core_count: formData.cpu_core_count || undefined,
        integrated_graphics: formData.cpu_integrated_graphics,
        price: formData.cpu_price === '' ? 0 : Number(formData.cpu_price)
      },
      peripheral_devices: [
        { peripheral_type: 'keyboard', status: formData.keyboard_status, price: formData.keyboard_price === '' ? 0 : Number(formData.keyboard_price) },
        { peripheral_type: 'mouse', status: formData.mouse_status, price: formData.mouse_price === '' ? 0 : Number(formData.mouse_price) }
      ]
    };

    try {
      setSaving(true);
      if (editingId) {
        const updated = await pcsAPI.update(editingId, payload as any);
        setPcs((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setSuccess('PC updated successfully');
      } else {
        const created = await pcsAPI.create(labId, payload as any);
        setPcs((prev) => [created, ...prev]);
        setSuccess('PC created successfully');
      }
      setOpenForm(false);
    } catch (err: any) {
      console.error('Failed to save PC:', err);
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setError(data.length > 100 ? 'Save failed: Server Error' : data);
        } else if (typeof data === 'object') {
          // Extract specific field errors
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset file input for re-selection
    e.target.value = '';
    
    try {
      setImporting(true);
      setError('');
      const result = await importAPI.importPCs(file, labId);
      
      const createdCount = result.created ?? 0;
      const skippedCount = result.skipped ?? 0;
      const errorCount = result.errors?.length ?? 0;
      
      setSuccess(`${createdCount} PCs imported successfully. ${skippedCount} skipped. ${errorCount} errors.`);
      
      // Show detailed errors if any
      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }
      
      // Refresh the PC list
      await loadAll();
    } catch (err: any) {
      console.error('Import failed:', err);
      const msg = err?.response?.data?.detail || err?.formattedMessage || 'Import failed';
      setError(msg);
    } finally {
      setImporting(false);
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
              {isAdmin && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="contained"
                    startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <Upload />}
                    onClick={handleImportClick}
                    disabled={importing}
                  >
                    {importing ? 'Importing...' : 'Import PCs'}
                  </Button>
                </>
              )}
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Add PC</Button>
            </Stack>
          </Box>

          <LabPCTable 
            pcs={pcs} 
            onEdit={handleOpenEdit} 
            onDelete={confirmDelete} 
          />
        </>
      )}

      {/* Create/Edit PC Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit PC' : 'Add PC'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>Basic Information</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="PC Name (COMP ID)"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    required
                    fullWidth
                    autoFocus
                  />
                  <TextField
                    label="Product ID / PC Code"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    fullWidth
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Status"
                    select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="working">Working</MenuItem>
                    <MenuItem value="not_working">Not Working</MenuItem>
                  </TextField>
                  <TextField
                    label="Network"
                    select
                    value={formData.connected ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, connected: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Connected</MenuItem>
                    <MenuItem value="false">Disconnected</MenuItem>
                  </TextField>
                  <TextField
                    label="Base Price (₹)"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Hardware Overview (Legacy / Basic)</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Basic Processor Info"
                    value={formData.processor}
                    onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                    fullWidth
                    placeholder="e.g. Intel Core i7"
                  />
                  <TextField
                    label="RAM Capacity"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    fullWidth
                    placeholder="e.g. 16GB DDR4"
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Graphics Card (Dedicated)"
                    select
                    value={formData.gpu ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, gpu: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Yes (Has GPU)</MenuItem>
                    <MenuItem value="false">No Dedicated GPU</MenuItem>
                  </TextField>
                  {formData.gpu && (
                    <TextField
                      label="GPU Model / Name"
                      value={formData.graphics_card}
                      onChange={(e) => setFormData({ ...formData, graphics_card: e.target.value })}
                      fullWidth
                    />
                  )}
                  <TextField
                    label="Storage Capacity"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    fullWidth
                    placeholder="e.g. 512GB SSD"
                  />
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold' }}>CPU Specifications (Deep Details)</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="CPU Model"
                    value={formData.cpu_model}
                    onChange={(e) => setFormData({ ...formData, cpu_model: e.target.value })}
                    fullWidth
                    placeholder="e.g. Intel Core i7-12700"
                  />
                  <TextField
                    label="Clock Speed"
                    value={formData.cpu_clock_speed}
                    onChange={(e) => setFormData({ ...formData, cpu_clock_speed: e.target.value })}
                    fullWidth
                    placeholder="e.g. 3.6 GHz"
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Core Count"
                    type="number"
                    value={formData.cpu_core_count}
                    onChange={(e) => setFormData({ ...formData, cpu_core_count: e.target.value === '' ? '' : Number(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Integrated Graphics"
                    select
                    value={formData.cpu_integrated_graphics ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, cpu_integrated_graphics: e.target.value === 'true' })}
                    fullWidth
                  >
                    <MenuItem value="true">Yes (Integrated)</MenuItem>
                    <MenuItem value="false">No (Dedicated Only)</MenuItem>
                  </TextField>
                  <TextField
                    label="CPU Price (₹)"
                    type="number"
                    value={formData.cpu_price}
                    onChange={(e) => setFormData({ ...formData, cpu_price: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold' }}>Operating System</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="OS Name & Version"
                    value={formData.os_name}
                    onChange={(e) => setFormData({ ...formData, os_name: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="OS License Cost (₹)"
                    type="number"
                    value={formData.os_license_cost}
                    onChange={(e) => setFormData({ ...formData, os_license_cost: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Peripherals Status</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Keyboard Status"
                    select
                    value={formData.keyboard_status}
                    onChange={(e) => setFormData({ ...formData, keyboard_status: e.target.value as any })}
                    fullWidth
                  >
                    <MenuItem value="working">Working</MenuItem>
                    <MenuItem value="not_working">Broken</MenuItem>
                  </TextField>
                  <TextField
                    label="Mouse Status"
                    select
                    value={formData.mouse_status}
                    onChange={(e) => setFormData({ ...formData, mouse_status: e.target.value as any })}
                    fullWidth
                  >
                    <MenuItem value="working">Working</MenuItem>
                    <MenuItem value="not_working">Broken</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Keyboard Price (₹)"
                    type="number"
                    value={formData.keyboard_price}
                    onChange={(e) => setFormData({ ...formData, keyboard_price: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Mouse Price (₹)"
                    type="number"
                    value={formData.mouse_price}
                    onChange={(e) => setFormData({ ...formData, mouse_price: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Physical Inventory Labels</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Serial Number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Box>
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
