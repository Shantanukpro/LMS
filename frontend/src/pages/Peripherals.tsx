import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Stack, TextField, MenuItem, 
  CircularProgress, Button, Grid, Chip, Avatar, Tooltip, Snackbar, Alert 
} from '@mui/material';
import { Search, Monitor, Keyboard, Mouse, Build, LinkOff, CheckCircleOutline } from '@mui/icons-material';
import { peripheralsAPI } from '../services/api';
import type { Peripheral } from '../types';

const getPeripheralIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('keyboard')) return <Keyboard />;
  if (t.includes('mouse')) return <Mouse />;
  if (t.includes('monitor')) return <Monitor />;
  return <Build />;
};

const Peripherals: React.FC = () => {
  const [peripherals, setPeripherals] = useState<any[]>([]); // using any internally to ease mapping extra API fields like pc_name
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [q, setQ] = useState('');
  const [fType, setFType] = useState<string | ''>('');
  const [fStatus, setFStatus] = useState<string | ''>(''); // 'assigned' | 'unassigned'

  const load = async () => {
    try {
      setLoading(true);
      const data = await peripheralsAPI.getAll();
      setPeripherals(data);
    } catch (e: any) {
      console.error('Failed to load peripherals:', e);
      setError('Failed to load peripherals. Connect backend or check data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const types = Array.from(new Set(peripherals.map(p => p.peripheral_type || p.type || 'Unknown').filter(Boolean)));

  const filtered = useMemo(() => {
    return peripherals.filter(p => {
      const typeLabel = p.peripheral_type || p.type || '';
      const text = `${typeLabel} ${p.brand || ''} ${p.model_name || ''} ${p.serial_number || ''}`.toLowerCase();
      
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      const matchType = fType ? typeLabel === fType : true;
      
      const isAssigned = !!p.pc;
      const matchStatus = fStatus === 'assigned' ? isAssigned : 
                          fStatus === 'unassigned' ? !isAssigned : true;

      return matchQ && matchType && matchStatus;
    });
  }, [peripherals, q, fType, fStatus]);

  const handleUnassign = async (id: number) => {
    try {
      // Typically removing it from a PC means patching pc null 
      await peripheralsAPI.update(id, { pc: null } as any);
      setSuccess('Peripheral unassigned successfully');
      load();
    } catch (err) {
      setError('Failed to unassign peripheral');
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px' }}>
          Peripherals Library
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage global inventory of keyboards, mice, and other accessories
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Card className="glass-panel" sx={{ mb: 4, borderRadius: '16px', backgroundImage: 'none' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search Peripherals"
              placeholder="Brand, model, serial..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ endAdornment: <Search fontSize="small" sx={{ color: 'text.secondary' }} /> }}
              sx={{ flex: 1 }}
              size="medium"
            />
            <TextField select label="Type" value={fType} onChange={(e) => setFType(e.target.value)} sx={{ minWidth: 160 }} size="medium">
              <MenuItem value="">All Types</MenuItem>
              {types.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Assignment" value={fStatus} onChange={(e) => setFStatus(e.target.value)} sx={{ minWidth: 160 }} size="medium">
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
            </TextField>
          </Stack>

          {/* Quick status chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`All (${peripherals.length})`} 
              onClick={() => setFStatus('')}
              variant={fStatus === '' ? 'filled' : 'outlined'}
              color={fStatus === '' ? 'primary' : 'default'}
              sx={{ borderRadius: '8px' }}
            />
            <Chip 
              label={`Assigned (${peripherals.filter(p => !!p.pc).length})`} 
              onClick={() => setFStatus('assigned')}
              variant={fStatus === 'assigned' ? 'filled' : 'outlined'}
              color={fStatus === 'assigned' ? 'primary' : 'default'}
              sx={{ borderRadius: '8px' }}
            />
            <Chip 
              label={`Unassigned (${peripherals.filter(p => !p.pc).length})`} 
              onClick={() => setFStatus('unassigned')}
              variant={fStatus === 'unassigned' ? 'filled' : 'outlined'}
              color={fStatus === 'unassigned' ? 'primary' : 'default'}
              sx={{ borderRadius: '8px' }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, px: 2, bgcolor: 'background.paper', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <CheckCircleOutline sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No peripherals found</Typography>
          {fStatus === 'unassigned' && (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>All peripherals are currently assigned to PCs.</Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map(p => {
            const isAssigned = !!p.pc;
            const typeLabel = p.peripheral_type || p.type || 'Unknown';
            const nameLabel = `${p.brand || ''} ${p.model_name || ''}`.trim() || typeLabel;
            
            return (
              <Grid size={{ xs: 12, md: 4 }} key={p.id}>
                <Card 
                  sx={{ 
                    borderRadius: '16px', 
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    border: '1px solid',
                    borderColor: !isAssigned ? 'rgba(245, 158, 11, 0.4)' : 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    ...( !isAssigned ? {
                      boxShadow: '0 4px 20px rgba(245, 158, 11, 0.05)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      }
                    } : {
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                      }
                    })
                  }}
                >
                  <CardContent sx={{ flex: 1, p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: !isAssigned ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                        color: !isAssigned ? '#f59e0b' : '#6366f1',
                        borderRadius: '12px'
                      }}>
                        {getPeripheralIcon(typeLabel)}
                      </Avatar>
                      <Chip 
                        label={isAssigned ? 'Assigned' : 'Unassigned'} 
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          bgcolor: isAssigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: isAssigned ? '#10b981' : '#f59e0b',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                      />
                    </Stack>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{nameLabel}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 2 }}>
                      {typeLabel.toUpperCase()} {p.serial_number ? `• S/N: ${p.serial_number}` : ''}
                    </Typography>

                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      {isAssigned ? (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Connected PC</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.pc_name || `PC #${p.pc}`}</Typography>
                          </Box>
                          <Tooltip title="Unassign from PC">
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="warning" 
                              onClick={() => handleUnassign(p.id)}
                              sx={{ minWidth: 0, p: 1, borderRadius: '8px' }}
                            >
                              <LinkOff fontSize="small" />
                            </Button>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Available in inventory storage
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Peripherals;
