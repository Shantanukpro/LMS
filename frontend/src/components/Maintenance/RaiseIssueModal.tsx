import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, Typography, 
  ToggleButtonGroup, ToggleButton, Box, CircularProgress,
  useTheme
} from '@mui/material';
import { AlertCircle, Send, Info } from 'lucide-react';
import { ticketsAPI, labsAPI, pcsAPI, labEquipmentAPI } from '../../services/api';
import type { Lab, PC, LabEquipment } from '../../types';

interface RaiseIssueProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (ticket: any) => void;
  studentId: number;
}

const RaiseIssueModal: React.FC<RaiseIssueProps> = ({ open, onClose, onSuccess, studentId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [issueType, setIssueType] = useState<'pc' | 'equipment'>('pc');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  
  // Form State
  const [fLab, setFLab] = useState<number | ''>('');
  const [fItem, setFItem] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    if (open) {
      loadLabs();
    }
  }, [open]);

  useEffect(() => {
    if (fLab) {
      loadItems(fLab);
    } else {
      setPcs([]);
      setEquipment([]);
      setFItem('');
    }
  }, [fLab, issueType]);

  const loadLabs = async () => {
    try {
      setDataLoading(true);
      const res = await labsAPI.getAll();
      setLabs(res);
    } catch (e) {
      setError('Failed to load labs');
    } finally {
      setDataLoading(false);
    }
  };

  const loadItems = async (labId: number) => {
    try {
      setDataLoading(true);
      if (issueType === 'pc') {
        const res = await pcsAPI.getByLab(labId);
        setPcs(res);
      } else {
        const res = await labEquipmentAPI.getByLab(labId);
        setEquipment(res);
      }
    } catch (e) {
      setError('Failed to load items');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fLab || !fItem || description.length < 20) return;

    try {
      setLoading(true);
      setError('');
      
      const newTicket = await ticketsAPI.create({
        student: studentId,
        pc: issueType === 'pc' ? (fItem as number) : undefined as any, // Adjust based on your API's ability to handle equipment tickets
        issue_description: `[${urgency.toUpperCase()}] ${description}`,
      });

      onSuccess(newTicket);
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFLab('');
    setFItem('');
    setDescription('');
    setUrgency('Medium');
    setError('');
    onClose();
  };

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

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
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
        <DialogTitle sx={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 700, pb: 1, p: 3 }}>
          Raise New Issue
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: isDark ? '#2e3a50' : '#e2e8f0', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: isDark ? '#4a5568' : '#94a3b8', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: isDark ? '#718096' : '#64748b' }
        }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Box sx={{ 
                p: 2, 
                borderRadius: '8px', 
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', 
                border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, 
                display: 'flex', gap: 1.5, alignItems: 'center'
              }}>
                <AlertCircle size={18} color="#ef4444" />
                <Typography variant="body2" sx={{ color: isDark ? '#ef4444' : '#b91c1c' }}>{error}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#334155', letterSpacing: '0.1em', mb: 1.5, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                Issue Category
              </Typography>
              <ToggleButtonGroup
                value={issueType}
                exclusive
                onChange={(_, val) => val && setIssueType(val)}
                fullWidth
                size="small"
                sx={{ 
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '9999px !important',
                    border: '0 !important',
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
                      boxShadow: isDark ? '0 4px 12px rgba(59,130,246,0.25)' : '0 4px 10px rgba(59,130,246,0.2)',
                    },
                    '&:hover:not(.Mui-selected)': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                    }
                  } 
                }}
              >
                <ToggleButton value="pc">PC Issue</ToggleButton>
                <ToggleButton value="equipment">Equipment Issue</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Select Lab"
                fullWidth
                required
                value={fLab}
                onChange={(e) => setFLab(e.target.value as unknown as number)}
                disabled={dataLoading}
                sx={getTextFieldSx()}
              >
                {labs.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </TextField>

              <TextField
                select
                label={issueType === 'pc' ? 'Select PC' : 'Select Item'}
                fullWidth
                required
                value={fItem}
                onChange={(e) => setFItem(e.target.value as unknown as number)}
                disabled={!fLab || dataLoading}
                sx={getTextFieldSx()}
              >
                {issueType === 'pc' 
                  ? pcs.map(p => <MenuItem key={p.id} value={p.id}>{p.device_name}</MenuItem>)
                  : equipment.map(e => <MenuItem key={e.id} value={e.id}>{e.equipment_type} ({e.brand || 'No Brand'})</MenuItem>)
                }
              </TextField>
            </Stack>

            <Box>
               <TextField
                label="Issue Description"
                placeholder="Describe the problem in detail (min 20 chars)..."
                multiline
                rows={4}
                fullWidth
                required
                value={description}
                onChange={(e) => setDescription(e.target.value.substring(0, 500))}
                error={description.length > 0 && description.length < 20}
                sx={getTextFieldSx('12px')}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                <Typography variant="caption" sx={{ color: description.length > 0 && description.length < 20 ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8') }}>
                  {description.length > 0 && description.length < 20 ? 'Min 20 characters required' : 'Enter clear details'}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  {description.length} / 500
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#334155', letterSpacing: '0.1em', mb: 1.5, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                Urgency Level
              </Typography>
              <ToggleButtonGroup
                value={urgency}
                exclusive
                onChange={(_, val) => val && setUrgency(val)}
                fullWidth
                size="small"
                sx={{ 
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '9999px !important',
                    border: '0 !important',
                  },
                  '& .MuiToggleButton-root': { 
                    textTransform: 'none',
                    fontWeight: 600,
                    border: `1px solid ${isDark ? '#2e3a50' : '#cbd5e1'} !important`,
                    backgroundColor: isDark ? 'transparent' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#475569',
                    transition: 'all 0.2s',
                    '&.Mui-selected': { 
                      backgroundColor: (theme: any) => urgency === 'High' 
                        ? (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2') 
                        : (isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4') + ' !important',
                      color: (theme: any) => (urgency === 'High' ? '#ef4444' : '#10b981') + ' !important',
                      borderColor: (theme: any) => (urgency === 'High' ? '#ef4444' : '#10b981') + ' !important',
                      boxShadow: 'none',
                    },
                    '&:hover:not(.Mui-selected)': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                    }
                  } 
                }}
              >
                <ToggleButton value="Low">Low</ToggleButton>
                <ToggleButton value="Medium">Medium</ToggleButton>
                <ToggleButton value="High">High</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, borderTop: `1px solid ${isDark ? 'transparent' : 'transparent'}`, mt: 1 }}>
          <Button onClick={handleClose} sx={{ 
            color: isDark ? '#94a3b8' : '#64748b', 
            textTransform: 'none', 
            fontWeight: 600,
            borderRadius: '8px',
            px: 2,
            '&:hover': { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
          }}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation
            disabled={loading || description.length < 20 || !fItem}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
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
              },
              '&.Mui-disabled': {
                backgroundColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.4)',
                color: 'rgba(255,255,255,0.7)'
              }
            }}
          >
            {loading ? 'Submitting...' : 'Raise Issue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RaiseIssueModal;
