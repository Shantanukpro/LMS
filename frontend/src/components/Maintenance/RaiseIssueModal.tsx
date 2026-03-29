import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, Typography, 
  ToggleButtonGroup, ToggleButton, Box, CircularProgress
} from '@mui/material';
import { AlertCircle, Send, Info } from 'lucide-react';
import { ticketsAPI, labsAPI, pcsAPI, labEquipmentAPI } from '../../services/api';
import type { Lab, PC, LabEquipment } from '../../types';

interface RaiseIssueProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: number;
}

const RaiseIssueModal: React.FC<RaiseIssueProps> = ({ open, onClose, onSuccess, studentId }) => {
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
      
      await ticketsAPI.create({
        student: studentId,
        pc: issueType === 'pc' ? (fItem as number) : undefined as any, // Adjust based on your API's ability to handle equipment tickets
        issue_description: `[${urgency.toUpperCase()}] ${description}`,
      });

      onSuccess();
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

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
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
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700, pb: 1 }}>
          Raise New Issue
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Box sx={{ 
                p: 2, 
                borderRadius: '8px', 
                backgroundColor: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.2)', 
                display: 'flex', gap: 1.5, alignItems: 'center'
              }}>
                <AlertCircle size={18} color="#ef4444" />
                <Typography variant="body2" sx={{ color: '#ef4444' }}>{error}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1.5, display: 'block', fontWeight: 600 }}>
                Issue Category
              </Typography>
              <ToggleButtonGroup
                value={issueType}
                exclusive
                onChange={(_, val) => val && setIssueType(val)}
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
                      borderColor: '#3b82f6',
                      '&:hover': { backgroundColor: 'rgba(59,130,246,0.15)' }
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
                slotProps={{ 
                  input: { sx: { borderRadius: '8px' } },
                  inputLabel: { sx: { color: 'var(--text-secondary)' } }
                }}
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
                slotProps={{ 
                  input: { sx: { borderRadius: '8px' } },
                  inputLabel: { sx: { color: 'var(--text-secondary)' } }
                }}
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
                slotProps={{ 
                  input: { sx: { borderRadius: '12px' } },
                  inputLabel: { sx: { color: 'var(--text-secondary)' } }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: description.length < 20 ? '#ef4444' : 'var(--text-secondary)' }}>
                  {description.length < 20 ? 'Min 20 characters required' : 'Enter clear details'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  {description.length} / 500
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1.5, display: 'block', fontWeight: 600 }}>
                Urgency Level
              </Typography>
              <ToggleButtonGroup
                value={urgency}
                exclusive
                onChange={(_, val) => val && setUrgency(val)}
                fullWidth
                size="small"
                sx={{ 
                  '& .MuiToggleButton-root': { 
                    borderColor: 'rgba(48,54,61,1)', 
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    '&.Mui-selected': { 
                      backgroundColor: (theme: any) => urgency === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: (theme: any) => urgency === 'High' ? '#ef4444' : '#10b981',
                      borderColor: (theme: any) => urgency === 'High' ? '#ef4444' : '#10b981',
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
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} sx={{ color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 600 }}>
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
              fontWeight: 700,
              '&:hover': { backgroundColor: '#2563eb' }
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
