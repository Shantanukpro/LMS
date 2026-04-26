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
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Search, ExpandMore } from '@mui/icons-material';
import { labEquipmentAPI, labsAPI } from '../services/api';
import type { LabEquipment, Lab, NetworkEquipmentDetails, ServerDetails, ProjectorDetails, ElectricalApplianceDetails } from '../types';
import { Eye, Server as ServerIcon, Network, Cpu, HardDrive, Activity, X } from 'lucide-react';
import ModernTable from '../components/Common/ModernTable';
import ModernTableRow from '../components/Common/ModernTableRow';
import EquipmentCard from '../components/Labs/EquipmentCard';
import BooleanBadge from '../components/Labs/BooleanBadge';

const EQUIPMENT_TYPES = [
  'ROUTER', 'SWITCH', 'HUB', 'SERVER', 'PROJECTOR', 'E_BOARD', 'AC', 'FAN', 'LIGHT', 'UPS', 'OTHER'
] as const;
const STATUS = ['working', 'not_working', 'under_repair'] as const;

type EquipmentForm = {
  lab: number | '';
  name: string;
  equipment_code: string;
  equipment_type: (typeof EQUIPMENT_TYPES)[number] | '';
  brand: string;
  model_name: string;
  location_in_lab: string;
  status: (typeof STATUS)[number] | '';
};

const emptyForm: EquipmentForm = {
  lab: '',
  name: '',
  equipment_code: '',
  equipment_type: '',
  brand: '',
  model_name: '',
  location_in_lab: '',
  status: 'working',
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

const Equipment: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<LabEquipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fType, setFType] = useState<(typeof EQUIPMENT_TYPES)[number] | ''>('');
  const [fStatus, setFStatus] = useState<(typeof STATUS)[number] | ''>('');

  // form
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EquipmentForm>(emptyForm);
  const [detailsData, setDetailsData] = useState<any>({});

  // details dialog
  const [detailsItem, setDetailsItem] = useState<LabEquipment | null>(null);

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [eqps, labsData] = await Promise.all([
        labEquipmentAPI.getAll(),
        labsAPI.getAll(),
      ]);
      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const equipmentArray = toArray(eqps);
      const labsArray = toArray(labsData);
      setItems(equipmentArray);
      setLabs(labsArray);
    } catch (e: any) {
      console.error('Failed to load equipment:', e);
      setError(e?.response?.data?.detail || 'Failed to load equipment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchLab = fLab ? it.lab === fLab : true;
      const matchType = fType ? it.equipment_type === fType : true;
      const matchStatus = fStatus ? it.status === fStatus : true;
      const text = `${it.brand ?? ''} ${it.model_name ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      return matchLab && matchType && matchStatus && matchQ;
    });
  }, [items, fLab, fType, fStatus, q]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDetailsData({});
    setOpenForm(true);
  };

  const openEdit = (row: LabEquipment) => {
    setEditingId(row.id);
    setFormData({
      lab: row.lab,
      name: row.name || '',
      equipment_code: row.equipment_code || '',
      equipment_type: row.equipment_type,
      brand: row.brand || '',
      model_name: row.model_name || '',
      location_in_lab: row.location_in_lab || '',
      status: row.status as any,
    });
    setDetailsData(row.details || {});
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lab || !formData.equipment_type || !formData.name.trim() || !formData.equipment_code.trim()) {
      setError('Lab, equipment type, name, and equipment code are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        lab: formData.lab,
        name: formData.name.trim(),
        equipment_code: formData.equipment_code.trim(),
        equipment_type: formData.equipment_type,
        brand: formData.brand || undefined,
        model_name: formData.model_name || undefined,
        location_in_lab: formData.location_in_lab || undefined,
        status: formData.status || 'working',
      };
      if (editingId) {
        const updated = await labEquipmentAPI.update(editingId, payload);
        
        // Save sub-form details
        try {
          if (['ROUTER', 'SWITCH', 'HUB'].includes(formData.equipment_type)) {
            await labEquipmentAPI.updateNetworkDetails(editingId, detailsData);
          } else if (formData.equipment_type === 'SERVER') {
            await labEquipmentAPI.updateServerDetails(editingId, detailsData);
          } else if (formData.equipment_type === 'PROJECTOR') {
            await labEquipmentAPI.updateProjectorDetails(editingId, detailsData);
          } else if (['AC', 'FAN', 'LIGHT', 'UPS'].includes(formData.equipment_type)) {
            await labEquipmentAPI.updateElectricalDetails(editingId, detailsData);
          }
        } catch (e) {
             console.warn("Failed saving details:", e);
        }

        // reload data to reflect details
        await loadAll();
        setSuccess('Equipment updated');
      } else {
        const created = await labEquipmentAPI.create(payload as any);
        setItems((prev) => [created, ...prev]);
        setSuccess('Equipment created');
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

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await labEquipmentAPI.delete(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setSuccess('Equipment deleted');
    } catch (e) {
      setError('Delete failed');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>Equipment</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Manage and track all lab equipment</Typography>
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
              placeholder="Brand or model..."
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
              value={fType}
              onChange={(e) => setFType(e.target.value as any)}
              className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md capitalize"
            >
              <option value="" className="dark:bg-slate-800">All Types</option>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t} className="dark:bg-slate-800">
                  {t.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>

            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value as any)}
              className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md capitalize"
            >
              <option value="" className="dark:bg-slate-800">All Statuses</option>
              {STATUS.map((s) => (
                <option key={s} value={s} className="dark:bg-slate-800">{s.replace('_', ' ')}</option>
              ))}
            </select>

            <Tooltip title="Refresh">
              <button
                onClick={loadAll}
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
                <span>Add Equipment</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(q || fLab || fType || fStatus) && (
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

            {fType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 capitalize">
                <span className="text-slate-400">Type:</span> {fType.replace('_', ' ').toLowerCase()}
                <button onClick={() => setFType('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
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
              onClick={() => { setQ(''); setFLab(''); setFType(''); setFStatus(''); }}
              className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold px-2 py-1 ml-1 cursor-pointer transition-colors duration-300 opacity-80 hover:opacity-100"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ModernTable
        columns={[
          { header: 'Lab & Location' },
          { header: 'Brand / Model' },
          { header: 'Type' },
          { header: 'Status' },
          { header: 'Actions', align: 'right' }
        ]}
        isEmpty={filtered.length === 0}
        emptyMessage={items.length > 0 ? "No equipment matches filters" : "No equipment found"}
      >
        {filtered.map((item) => (
          <ModernTableRow
            key={item.id}
            colSpan={5}
            mainRow={
              <>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">
                      {labs.find(l => l.id === item.lab)?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                      {item.location_in_lab || 'Unknown Location'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-gray-300 font-medium">
                    {item.brand || 'Generic'} {item.model_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10">
                    {item.equipment_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit Equipment">
                          <IconButton 
                            size="small" 
                            onClick={() => openEdit(item)}
                            sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Equipment">
                          <IconButton 
                            size="small" 
                            onClick={() => confirmDelete(item.id)}
                            sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </td>
              </>
            }
            expandedContent={
              <div className="p-6 bg-slate-50/50 dark:bg-[#0d1117] border-t border-slate-200 dark:border-white/5 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Basic Info Card */}
                  <EquipmentCard 
                    title="Asset Details"
                    icon={ServerIcon}
                    accentColor="blue"
                    fields={[
                      { label: 'Equipment Code', value: item.equipment_code },
                      { label: 'Brand', value: item.brand || '—' },
                      { label: 'Model Name', value: item.model_name || '—' },
                      { label: 'Location', value: item.location_in_lab || '—' }
                    ]}
                  />

                  {/* Technical Specs (if available) */}
                  {item.details && (
                    <EquipmentCard 
                      title={`${item.equipment_type} Specifications`}
                      icon={['ROUTER', 'SWITCH', 'HUB'].includes(item.equipment_type) ? Network : item.equipment_type === 'SERVER' ? HardDrive : Cpu}
                      accentColor="teal"
                      fields={Object.entries(item.details).map(([k, v]) => ({
                        label: k.replace(/_/g, ' '),
                        value: typeof v === 'boolean' ? <BooleanBadge value={v} /> : String(v)
                      }))}
                    />
                  )}

                  {/* Maintenance Card (Static for now or placeholders) */}
                  <EquipmentCard 
                    title="Lifecycle Info"
                    icon={Activity}
                    accentColor="purple"
                    fields={[
                      { label: 'Status', value: item.status.replace('_', ' ').toUpperCase() },
                      { label: 'Primary Lab', value: labs.find(l => l.id === item.lab)?.name || 'N/A' },
                      { label: 'Tracking ID', value: item.id }
                    ]}
                  />
                </div>
              </div>
            }
          />
        ))}
      </ModernTable>
      )}

      {/* Create/Edit Dialog */}
      {isAdmin && (
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField select label="Lab" value={formData.lab} onChange={(e) => setFormData({ ...formData, lab: e.target.value === '' ? '' : Number(e.target.value) })} required fullWidth>
                  {labs.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Type" value={formData.equipment_type} onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value as any })} required fullWidth>
                  {EQUIPMENT_TYPES.map((t) => (
                    <MenuItem key={t} value={t} style={{ textTransform: 'capitalize' }}>
                      {t.replace('_', ' ').toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Equipment Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
                <TextField label="Equipment Code" value={formData.equipment_code} onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })} required fullWidth />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} fullWidth />
                <TextField label="Model" value={formData.model_name} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} fullWidth />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Location" value={formData.location_in_lab} onChange={(e) => setFormData({ ...formData, location_in_lab: e.target.value })} fullWidth />
                <TextField select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} fullWidth>
                  {STATUS.map((s) => (
                    <MenuItem key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              {/* Dynamic Sub-forms */}
              {editingId && ['ROUTER', 'SWITCH', 'HUB'].includes(formData.equipment_type) && (
                <Accordion sx={{ mt: 2, bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                    <Network size={20} className="mr-2 text-indigo-500" />
                    Network Configuration
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2}>
                        <TextField label="IP Address" value={detailsData.ip_address || ''} onChange={(e) => setDetailsData({ ...detailsData, ip_address: e.target.value })} fullWidth size="small" />
                        <TextField label="MAC Address" value={detailsData.mac_address || ''} onChange={(e) => setDetailsData({ ...detailsData, mac_address: e.target.value })} fullWidth size="small" />
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <TextField label="Firmware Version" value={detailsData.firmware_version || ''} onChange={(e) => setDetailsData({ ...detailsData, firmware_version: e.target.value })} fullWidth size="small" />
                        <TextField label="Bandwidth / Speed" value={detailsData.bandwidth_capacity || ''} onChange={(e) => setDetailsData({ ...detailsData, bandwidth_capacity: e.target.value })} fullWidth size="small" />
                      </Stack>
                      <TextField select label="Managed Switch" value={detailsData.managed_switch ? 'true' : 'false'} onChange={(e) => setDetailsData({ ...detailsData, managed_switch: e.target.value === 'true' })} size="small" sx={{ width: '50%' }}>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </TextField>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {editingId && formData.equipment_type === 'SERVER' && (
                <Accordion sx={{ mt: 2, bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                    <ServerIcon size={20} className="mr-2 text-indigo-500" />
                    Server Details
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2}>
                        <TextField label="Total RAM" value={detailsData.total_ram || ''} onChange={(e) => setDetailsData({ ...detailsData, total_ram: e.target.value })} fullWidth size="small" placeholder="e.g. 64GB" />
                        <TextField label="RAID Config" value={detailsData.raid_config || ''} onChange={(e) => setDetailsData({ ...detailsData, raid_config: e.target.value })} fullWidth size="small" placeholder="e.g. RAID 5" />
                      </Stack>
                      <TextField select label="Virtualization Enabled" value={detailsData.virtualization_enabled ? 'true' : 'false'} onChange={(e) => setDetailsData({ ...detailsData, virtualization_enabled: e.target.value === 'true' })} size="small" sx={{ width: '50%' }}>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </TextField>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {editingId && formData.equipment_type === 'PROJECTOR' && (
                <Accordion sx={{ mt: 2, bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                    <Eye size={20} className="mr-2 text-indigo-500" />
                    Projector Specs
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2} direction="row">
                      <TextField label="Resolution" value={detailsData.resolution || ''} onChange={(e) => setDetailsData({ ...detailsData, resolution: e.target.value })} fullWidth size="small" placeholder="1080p, 4K..." />
                      <TextField label="Brightness (Lumens)" type="number" value={detailsData.brightness_lumens || ''} onChange={(e) => setDetailsData({ ...detailsData, brightness_lumens: e.target.value ? Number(e.target.value) : '' })} fullWidth size="small" />
                      <TextField label="Throw Type" value={detailsData.throw_type || ''} onChange={(e) => setDetailsData({ ...detailsData, throw_type: e.target.value })} fullWidth size="small" placeholder="Short Throw" />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {editingId && ['AC', 'FAN', 'LIGHT', 'UPS'].includes(formData.equipment_type) && (
                <Accordion sx={{ mt: 2, bgcolor: 'background.default', borderRadius: '12px', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>
                    <Activity size={20} className="mr-2 text-indigo-500" />
                    Electrical Details
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2} direction="row">
                      <TextField label="Power Rating / Wattage" value={detailsData.power_rating || ''} onChange={(e) => setDetailsData({ ...detailsData, power_rating: e.target.value })} fullWidth size="small" />
                      <TextField label="Voltage" value={detailsData.voltage || ''} onChange={(e) => setDetailsData({ ...detailsData, voltage: e.target.value })} fullWidth size="small" />
                    </Stack>
                    <Stack spacing={2} direction="row" sx={{ mt: 2 }}>
                      <TextField label="Inverter Type" value={detailsData.inverter_type || ''} onChange={(e) => setDetailsData({ ...detailsData, inverter_type: e.target.value })} fullWidth size="small" />
                      <TextField label="Energy Rating" value={detailsData.energy_rating || ''} onChange={(e) => setDetailsData({ ...detailsData, energy_rating: e.target.value })} fullWidth size="small" />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
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
        <DialogTitle>Delete Equipment?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this item? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ whiteSpace: 'pre-line' }} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Equipment;
