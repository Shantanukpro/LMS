import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, Typography, 
  ToggleButtonGroup, ToggleButton, Box, CircularProgress,
  FormControlLabel, Switch, Alert, Divider, useTheme
} from '@mui/material';
import { Save, User as UserIcon, Wrench, ShieldCheck, History } from 'lucide-react';
import { maintenanceAPI, usersAPI, labsAPI, pcsAPI, labEquipmentAPI, ticketsAPI } from '../../services/api';
import type { MaintenanceLog, User as AppUser, Lab, PC, LabEquipment, Ticket } from '../../types';

interface AddLogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (log: MaintenanceLog) => void;
  editingLog: MaintenanceLog | null;
  convertingTicket: Ticket | null;
  users: AppUser[];
  labs: Lab[];
  allPcs: PC[];
}

const AddLogModal: React.FC<AddLogProps> = ({ 
  open, onClose, onSuccess, editingLog, convertingTicket, users, labs, allPcs 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [itemType, setItemType] = useState<'pc' | 'equipment'>('pc');
  const [pcs, setPcs] = useState<PC[]>([]);
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);

  // Form State
  const [fLab, setFLab] = useState<number | ''>('');
  const [fItem, setFItem] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Resolved' | 'Escalated'>('Pending');
  const [statusBefore, setStatusBefore] = useState('');
  const [statusAfter, setStatusAfter] = useState('');
  const [reportedBy, setReportedBy] = useState<number | ''>('');
  const [fixedBy, setFixedBy] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      if (editingLog) {
        // Populate from existing log
        const type = editingLog.pc ? 'pc' : 'equipment';
        setItemType(type);
        setFLab(editingLog.lab || '');
        setFItem(editingLog.pc || editingLog.lab_equipment || '');
        setTitle(editingLog.issue_description || '');
        setDescription(editingLog.remarks || '');
        setStatus(editingLog.status as any || 'Pending');
        setStatusBefore(editingLog.status_before || '');
        setStatusAfter(editingLog.status_after || '');
        setReportedBy(editingLog.reported_by?.id || '');
        setFixedBy(editingLog.fixed_by?.id || '');
      } else if (convertingTicket) {
        // Populate from student ticket
        setItemType('pc');
        
        const ticketPcObj = allPcs.find(p => p.id === convertingTicket.pc);
        if (ticketPcObj) {
          setFLab(ticketPcObj.lab);
          setPcs(allPcs.filter(p => p.lab === ticketPcObj.lab));
        }

        setFItem(convertingTicket.pc);
        setTitle(convertingTicket.issue_description);
        setReportedBy(convertingTicket.student);
        setStatus('Pending');
        setError('');
      } else {
        resetForm();
      }
    }
  }, [open, editingLog, convertingTicket]);

  useEffect(() => {
    if (fLab) loadItems(fLab);
  }, [fLab, itemType]);

  const loadItems = async (labId: number) => {
    try {
      if (itemType === 'pc') {
        const res = await pcsAPI.getByLab(labId);
        setPcs(res);
      } else {
        const res = await labEquipmentAPI.getByLab(labId);
        setEquipment(res);
      }
    } catch (e) {
      console.error('Failed to load items', e);
    }
  };

  const resetForm = () => {
    setFLab('');
    setFItem('');
    setTitle('');
    setDescription('');
    setStatus('Pending');
    setStatusBefore('Working');
    setStatusAfter('');
    setReportedBy('');
    setFixedBy('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fItem || !title || !statusBefore) {
      setError('Please fill in all required fields');
      return;
    }

    if (status === 'Resolved' && !statusAfter) {
      setError('Status After is required when marking as Resolved');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload: any = {
        pc: itemType === 'pc' ? fItem : null,
        lab_equipment: itemType === 'equipment' ? fItem : null,
        issue_description: title,
        remarks: description,
        status: status.toLowerCase().replace(' ', '_'),
        status_before: statusBefore,
        status_after: statusAfter,
        reported_by: reportedBy || undefined,
        fixed_by: fixedBy || undefined,
        lab: fLab || undefined
      };

      let result;
      if (editingLog) {
        result = await maintenanceAPI.update(editingLog.id, payload);
      } else {
        result = await maintenanceAPI.create(payload);
      }

      if (convertingTicket) {
        await ticketsAPI.update(convertingTicket.id, { status: payload.status });
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err?.formattedMessage || 'Failed to save maintenance log');
    } finally {
      setLoading(false);
    }
  };

  // Shared TextField Styles
  const getTextFieldSx = (borderRadius = '8px') => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0f1623' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#1e293b',
      borderRadius,
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDark ? '#2e3a50' : '#cbd5e1',
        borderWidth: isDark ? '1px' : '1.5px',
      },
      '&:hover fieldset': {
        borderColor: isDark ? '#475569' : '#94a3b8',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3b82f6',
        borderWidth: '1.5px',
        boxShadow: !isDark ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
      },
      '& .MuiOutlinedInput-input::placeholder': {
        color: isDark ? '#64748b' : '#94a3b8',
        opacity: 1,
      }
    },
    '& .MuiInputLabel-root': {
      color: isDark ? '#94a3b8' : '#475569',
      fontSize: '13px',
      fontWeight: 500,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3b82f6',
    },
    '& .MuiSelect-icon': {
      color: isDark ? '#94a3b8' : '#475569',
    }
  });

  const getBannerText = () => {
    if (!convertingTicket) return '';
    const student = users.find(u => u.id === convertingTicket.student)?.username || 'Unknown Student';
    const pcObj = allPcs.find(p => p.id === convertingTicket.pc);
    const pcName = pcObj?.device_name || `PC ID: ${convertingTicket.pc}`;
    const labObj = labs.find(l => l.id === pcObj?.lab);
    const labName = labObj?.name || 'Unknown Lab';
    const date = convertingTicket.created_at 
      ? new Date(convertingTicket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'Unknown Date';
    
    return `Converting ticket from: ${student} | PC: ${pcName} | Lab: ${labName} | Raised on: ${date}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: isDark ? '#1a1f2e' : '#ffffff', 
          border: isDark ? '1px solid #2e3a50' : 'none', 
          backgroundImage: 'none',
          borderRadius: '16px',
          boxShadow: isDark 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 700, p: 3, pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Wrench size={24} color="#3b82f6" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingLog ? 'Update Maintenance Record' : 'Create Maintenance Log'}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 3,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: isDark ? '#2e3a50' : '#e2e8f0', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: isDark ? '#4a5568' : '#94a3b8', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: isDark ? '#718096' : '#64748b' }
        }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {convertingTicket && (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
                  color: isDark ? '#60a5fa' : '#1d4ed8',
                  borderLeft: `4px solid ${isDark ? '#1d4ed8' : '#3b82f6'}`,
                  '& .MuiAlert-icon': { color: isDark ? '#60a5fa' : '#1d4ed8' }
                }}
              >
                {getBannerText()}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {/* Category Toggle */}
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#334155', letterSpacing: '0.1em', mb: 1.5, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                Inventory Category
              </Typography>
              <ToggleButtonGroup
                value={itemType}
                exclusive
                onChange={(_, val) => val && setItemType(val)}
                fullWidth
                size="small"
                sx={{ 
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '9999px !important',
                  },
                  '& .MuiToggleButton-root': { 
                    textTransform: 'none',
                    fontWeight: 600,
                    border: `1px solid ${isDark ? '#2e3a50' : '#cbd5e1'} !important`,
                    backgroundColor: isDark ? 'transparent' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#475569',
                    transition: 'all 0.2s',
                    '&.Mui-selected': { 
                      backgroundColor: '#3b82f6 !important', 
                      color: '#ffffff !important',
                      borderColor: '#3b82f6 !important',
                      boxShadow: isDark ? '0 4px 12px rgba(59,130,246,0.25)' : '0 4px 10px rgba(59,130,246,0.2)'
                    },
                    '&:hover:not(.Mui-selected)': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                    }
                  } 
                }}
              >
                <ToggleButton value="pc">Personal Computers</ToggleButton>
                <ToggleButton value="equipment">Lab Equipment / Appliances</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ borderColor: isDark ? '#2e3a50' : '#e2e8f0' }} />

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Lab Location"
                value={fLab}
                onChange={(e) => setFLab(e.target.value as unknown as number)}
                fullWidth
                required
                sx={getTextFieldSx()}
              >
                {labs.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </TextField>

              <TextField
                select
                label="Select Target Item"
                value={fItem}
                onChange={(e) => setFItem(e.target.value as unknown as number)}
                fullWidth
                required
                disabled={!fLab}
                sx={getTextFieldSx()}
              >
                {itemType === 'pc' 
                  ? pcs.map(p => <MenuItem key={p.id} value={p.id}>{p.device_name}</MenuItem>)
                  : equipment.map(e => <MenuItem key={e.id} value={e.id}>{e.equipment_type} ({e.brand || 'No Brand'})</MenuItem>)
                }
              </TextField>
            </div>

            <TextField
              label="Issue Summary"
              placeholder="e.g. Blue screen of death, Monitor flickering..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              sx={getTextFieldSx()}
            />

            <TextField
              label="Technical Remarks / Action Taken"
              placeholder="Detailed notes on fault finding and resolution..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              sx={getTextFieldSx('12px')}
            />

            <Divider sx={{ borderColor: isDark ? '#2e3a50' : '#e2e8f0' }} />

            {/* Lifecycle Status */}
            <Box>
              <Typography variant="overline" sx={{ color: isDark ? '#64748b' : '#334155', letterSpacing: '0.1em', fontWeight: 700, mb: 2, display: 'block' }}>
                Maintenance Lifecycle
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  select
                  label="Current Log Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  fullWidth
                  sx={{
                    ...getTextFieldSx(),
                    '& .MuiOutlinedInput-input': {
                      color: status.toLowerCase() === 'resolved' ? '#10b981' : (isDark ? '#e2e8f0' : '#1e293b'),
                      fontWeight: status.toLowerCase() === 'resolved' ? 600 : 400
                    }
                  }}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Escalated">Escalated</MenuItem>
                </TextField>

                <TextField
                  label="Status Before Fix"
                  placeholder="e.g. Not Booting"
                  value={statusBefore}
                  onChange={(e) => setStatusBefore(e.target.value)}
                  fullWidth
                  required
                  sx={getTextFieldSx()}
                />

                <TextField
                  label="Status After Fix"
                  placeholder="e.g. Working Fine"
                  value={statusAfter}
                  onChange={(e) => setStatusAfter(e.target.value)}
                  fullWidth
                  required={status === 'Resolved'}
                  disabled={status !== 'Resolved'}
                  error={status === 'Resolved' && !statusAfter}
                  sx={{
                    ...getTextFieldSx(),
                    ...(status !== 'Resolved' && {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDark ? 'rgba(15,22,35,0.5)' : '#f8fafc',
                        opacity: 0.7
                      }
                    })
                  }}
                />
              </div>
            </Box>

            {/* Responsibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Reported By (User)"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value as unknown as number)}
                fullWidth
                sx={getTextFieldSx()}
                slotProps={{
                  input: {
                    startAdornment: <UserIcon size={16} style={{ marginRight: 8, color: isDark ? '#94a3b8' : '#64748b' }} />
                  }
                }}
              >
                <MenuItem value="">Not Specified</MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.username} ({u.role})</MenuItem>)}
              </TextField>

              <TextField
                select
                label="Resolved By (Admin)"
                value={fixedBy}
                onChange={(e) => setFixedBy(e.target.value as unknown as number)}
                fullWidth
                sx={getTextFieldSx()}
                slotProps={{
                  input: {
                    startAdornment: <ShieldCheck size={16} style={{ marginRight: 8, color: isDark ? '#94a3b8' : '#64748b' }} />
                  }
                }}
              >
                <MenuItem value="">Not Specified</MenuItem>
                {users.filter(u => u.role === 'admin').map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
              </TextField>
            </div>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, borderTop: `1px solid ${isDark ? 'transparent' : 'transparent'}`, mt: 1 }}>
          <Button onClick={onClose} sx={{ 
            color: isDark ? '#94a3b8' : '#64748b', 
            textTransform: 'none', 
            fontWeight: 600,
            borderRadius: '8px',
            px: 2,
            '&:hover': { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
          }}>
            Discard
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            sx={{ 
              backgroundColor: '#3b82f6', 
              borderRadius: '8px',
              textTransform: 'none',
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: isDark ? '0 4px 12px rgba(59,130,246,0.25)' : '0 4px 10px rgba(59,130,246,0.15)',
              transition: 'all 0.2s',
              '&:hover': { 
                backgroundColor: '#2563eb',
                transform: 'translateY(-1px)',
                boxShadow: isDark ? '0 6px 16px rgba(59,130,246,0.35)' : '0 6px 14px rgba(59,130,246,0.25)'
              }
            }}
          >
            {loading ? 'Saving Changes...' : (editingLog ? 'Update Record' : 'Save Log Entry')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddLogModal;
