import React from 'react';
import { Box, Stack, TextField, MenuItem, IconButton, Button, InputAdornment } from '@mui/material';
import { Search, RotateCcw, Plus } from 'lucide-react';
import type { Lab, PC, LabEquipment } from '../../types';

interface FilterProps {
  role: 'admin' | 'student';
  q: string;
  setQ: (val: string) => void;
  fLab: number | '';
  setFLab: (val: number | '') => void;
  fEquipment: string;
  setFEquipment: (val: string) => void;
  fStatus: string;
  setFStatus: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  labs: Lab[];
  pcs: PC[];
  equipment: LabEquipment[];
}

const MaintenanceFilterBar: React.FC<FilterProps> = ({ 
  role, q, setQ, fLab, setFLab, fEquipment, setFEquipment, fStatus, setFStatus, from, setFrom, to, setTo, onRefresh, onAdd, labs, pcs, equipment 
}) => {
  return (
    <Box sx={{ 
      p: 2, 
      mb: 4, 
      backgroundColor: 'rgba(22,27,34,0.6)', 
      border: '1px solid rgba(48,54,61,1)', 
      borderRadius: '12px' 
    }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="center">
        <TextField
          placeholder="Search logs..."
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ flex: 1, minWidth: '200px' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="var(--text-secondary)" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '8px', 
                backgroundColor: 'var(--bg-main)',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' }
              }
            }
          }}
        />

        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          <TextField
            select
            size="small"
            value={fLab}
            onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ width: '150px' }}
            slotProps={{ select: { sx: { borderRadius: '8px' } } }}
          >
            <MenuItem value="">All Labs</MenuItem>
            {labs.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>

          <TextField
            select
            size="small"
            value={fEquipment}
            onChange={(e) => setFEquipment(e.target.value)}
            sx={{ width: '160px' }}
            slotProps={{ select: { sx: { borderRadius: '8px' } } }}
          >
            <MenuItem value="">All Items</MenuItem>
            <optgroup label="PCs">
              {pcs.map(p => <MenuItem key={`pc-${p.id}`} value={`pc-${p.id}`}>PC: {p.device_name}</MenuItem>)}
            </optgroup>
            <optgroup label="Equipment">
              {equipment.map(e => <MenuItem key={`eq-${e.id}`} value={`eq-${e.id}`}>{e.equipment_type}</MenuItem>)}
            </optgroup>
          </TextField>

          <TextField
            select
            size="small"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            sx={{ width: '130px' }}
            slotProps={{ select: { sx: { borderRadius: '8px' } } }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="escalated">Escalated</MenuItem>
          </TextField>

          <TextField
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            sx={{ width: '140px' }}
            slotProps={{ input: { sx: { borderRadius: '8px' } } }}
          />

          <TextField
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            sx={{ width: '140px' }}
            slotProps={{ input: { sx: { borderRadius: '8px' } } }}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={onRefresh} sx={{ color: 'var(--text-secondary)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
            <RotateCcw size={20} />
          </IconButton>
          
          <Button
            variant="contained"
            disableElevation
            startIcon={<Plus size={18} />}
            onClick={onAdd}
            sx={{ 
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            {role === 'admin' ? 'Add Log' : 'Raise Issue'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MaintenanceFilterBar;
