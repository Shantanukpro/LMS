import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, Typography, 
  ToggleButtonGroup, ToggleButton, Box, CircularProgress,
  FormControlLabel, Switch, Alert, Divider
} from '@mui/material';
import { Save, User as UserIcon, Wrench, ShieldCheck, History } from 'lucide-react';
import { maintenanceAPI, usersAPI, labsAPI, pcsAPI, labEquipmentAPI } from '../../services/api';
import type { MaintenanceLog, User as AppUser, Lab, PC, LabEquipment, Ticket } from '../../types';

interface AddLogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (log: MaintenanceLog) => void;
  editingLog: MaintenanceLog | null;
  convertingTicket: Ticket | null;
  users: AppUser[];
  labs: Lab[];
}

const AddLogModal: React.FC<AddLogProps> = ({ 
  open, onClose, onSuccess, editingLog, convertingTicket, users, labs 
}) => {
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
        setFItem(convertingTicket.pc);
        setTitle(convertingTicket.issue_description);
        setReportedBy(convertingTicket.student);
        setStatus('Pending');
        setError('Converting student ticket...');
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

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err?.formattedMessage || 'Failed to save maintenance log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: '#0d1117', 
          border: '1px solid rgba(48,54,61,1)', 
          backgroundImage: 'none',
          borderRadius: '16px'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700, p: 3, pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Wrench size={24} color="#3b82f6" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingLog ? 'Update Maintenance Record' : 'Create Maintenance Log'}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity={error.includes('Converting') ? "info" : "error"} sx={{ borderRadius: '8px' }}>{error}</Alert>}

            {/* Category Toggle */}
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1.5, display: 'block', fontWeight: 600 }}>
                Inventory Category
              </Typography>
              <ToggleButtonGroup
                value={itemType}
                exclusive
                onChange={(_, val) => val && setItemType(val)}
                fullWidth
                size="small"
                sx={{ 
                  '& .MuiToggleButton-root': { 
                    borderColor: 'rgba(48,54,61,1)', 
                    color: 'var(--text-secondary)',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&.Mui-selected': { 
                      backgroundColor: 'rgba(59,130,246,0.1)', 
                      color: '#3b82f6',
                      borderColor: '#3b82f6'
                    }
                  } 
                }}
              >
                <ToggleButton value="pc">Personal Computers</ToggleButton>
                <ToggleButton value="equipment">Lab Equipment / Appliances</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ borderColor: 'rgba(48,54,61,1)' }} />

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                select
                label="Lab Location"
                value={fLab}
                onChange={(e) => setFLab(e.target.value as unknown as number)}
                fullWidth
                required
                slotProps={{ input: { sx: { borderRadius: '8px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
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
                slotProps={{ input: { sx: { borderRadius: '8px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
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
              slotProps={{ input: { sx: { borderRadius: '8px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
            />

            <TextField
              label="Technical Remarks / Action Taken"
              placeholder="Detailed notes on fault finding and resolution..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              slotProps={{ input: { sx: { borderRadius: '12px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
            />

            <Divider sx={{ borderColor: 'rgba(48,54,61,1)' }} />

            {/* Lifecycle Status */}
            <Box>
              <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, mb: 2, display: 'block' }}>
                Maintenance Lifecycle
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  select
                  label="Current Log Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  fullWidth
                  slotProps={{ 
                    input: { sx: { borderRadius: '8px', color: status.toLowerCase() === 'resolved' ? '#10b981' : 'inherit' } }, 
                    inputLabel: { sx: { color: 'var(--text-secondary)' } } 
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
                  slotProps={{ input: { sx: { borderRadius: '8px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
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
                  slotProps={{ input: { sx: { borderRadius: '8px' } }, inputLabel: { sx: { color: 'var(--text-secondary)' } } }}
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
                slotProps={{ 
                   input: { sx: { borderRadius: '8px' }, startAdornment: <UserIcon size={16} style={{ marginRight: 8, color: 'var(--text-secondary)' }} /> }, 
                   inputLabel: { sx: { color: 'var(--text-secondary)' } } 
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
                slotProps={{ 
                  input: { sx: { borderRadius: '8px' }, startAdornment: <ShieldCheck size={16} style={{ marginRight: 8, color: 'var(--text-secondary)' }} /> }, 
                  inputLabel: { sx: { color: 'var(--text-secondary)' } } 
                }}
              >
                <MenuItem value="">Not Specified</MenuItem>
                {users.filter(u => u.role === 'admin').map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
              </TextField>
            </div>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} sx={{ color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 600 }}>
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
              fontWeight: 700,
              '&:hover': { backgroundColor: '#2563eb' }
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
