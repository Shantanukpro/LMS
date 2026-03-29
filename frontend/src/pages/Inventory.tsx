import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Typography, Stack, Chip, CircularProgress, 
  Alert, Paper, Container 
} from '@mui/material';
import { 
  Package, CheckCircle2, AlertTriangle, 
  Settings, LayoutList, ChevronRight 
} from 'lucide-react';
import { inventoryAPI, labsAPI } from '../services/api';
import type { Inventory as InventoryRow, Lab } from '../types';

type Agg = {
  total: number;
  working: number;
  not_working: number;
  under_repair: number;
};

const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 2.5, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2.5,
      backgroundColor: 'var(--bg-glass)',
      border: '1px solid var(--border-panel)',
      borderRadius: '16px',
      flex: 1,
      minWidth: '200px',
      boxShadow: theme => theme.palette.mode === 'dark' 
        ? '0 4px 20px rgba(0,0,0,0.2)' 
        : '0 4px 12px rgba(0,0,0,0.03)'
    }}
  >
    <Box sx={{ 
      p: 1.5, 
      borderRadius: '12px', 
      backgroundColor: `${color}15`, 
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color: 'var(--text-primary)', lineHeight: 1, fontWeight: 800, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const Inventory: React.FC = () => {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [invData, labsData] = await Promise.all([
        inventoryAPI.getAll(),
        labsAPI.getAll()
      ]);
      setRows(Array.isArray(invData) ? invData : []);
      setLabs(labsData);
    } catch (e: any) {
      console.error('Failed to load inventory:', e);
      setError('Failed to sync inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totals: Agg = useMemo(() => {
    return rows.reduce((acc, r) => ({
      total: acc.total + r.total_quantity,
      working: acc.working + r.working_quantity,
      not_working: acc.not_working + r.not_working_quantity,
      under_repair: acc.under_repair + r.under_repair_quantity,
    }), { total: 0, working: 0, not_working: 0, under_repair: 0 });
  }, [rows]);

  const byType = useMemo(() => {
    const map: Record<string, Agg> = {};
    rows.forEach((r) => {
      let agg = map[r.equipment_type];
      agg ??= { total: 0, working: 0, not_working: 0, under_repair: 0 };
      agg.total += r.total_quantity;
      agg.working += r.working_quantity;
      agg.not_working += r.not_working_quantity;
      agg.under_repair += r.under_repair_quantity;
      map[r.equipment_type] = agg;
    });
    return map;
  }, [rows]);

  const byLab = useMemo(() => {
    const map: Record<number, Agg> = {} as Record<number, Agg>;
    rows.forEach((r) => {
      const agg = (map[r.lab] ??= { total: 0, working: 0, not_working: 0, under_repair: 0 });
      agg.total += r.total_quantity;
      agg.working += r.working_quantity;
      agg.not_working += r.not_working_quantity;
      agg.under_repair += r.under_repair_quantity;
    });
    return map;
  }, [rows]);

  const typeKeys = Object.keys(byType);
  const maxTypeTotal = Math.max(1, ...typeKeys.map((k) => (byType[k]?.total || 0)));

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Inventory Overview
        </Typography>
        <Typography sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
          Real-time tracking of lab hardware and assets across all departments
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: '12px' }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={4}>
          {/* KPI Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
            gap: 3 
          }}>
            <StatCard label="Total Equipment" value={totals.total} color="#64748b" icon={<Package size={22} />} />
            <StatCard label="Working Assets" value={totals.working} color="#10b981" icon={<CheckCircle2 size={22} />} />
            <StatCard label="Defective" value={totals.not_working} color="#ef4444" icon={<AlertTriangle size={22} />} />
            <StatCard label="Under Maintenance" value={totals.under_repair} color="#f59e0b" icon={<Settings size={22} />} />
          </Box>

          {/* Visual Data & Per-Lab Breakdown */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1fr' }, 
            gap: 4 
          }}>
            {/* Table Section */}
            <Box sx={{ 
              p: 0, 
              backgroundColor: 'var(--bg-glass)', 
              border: '1px solid var(--border-panel)', 
              borderRadius: '20px',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <Box sx={{ p: 3, borderBottom: '1px solid var(--border-panel)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LayoutList size={20} color="#3b82f6" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Lab Inventory Breakdown</Typography>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-[var(--bg-main)]/50">
                    <tr>
                      <th className="px-6 py-4 border-b border-[var(--border-panel)]">
                        <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>Lab</Typography>
                      </th>
                      <th className="px-6 py-4 border-b border-[var(--border-panel)] text-center">
                        <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>Total</Typography>
                      </th>
                      <th className="px-6 py-4 border-b border-[var(--border-panel)] text-center">
                        <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>Working</Typography>
                      </th>
                      <th className="px-6 py-4 border-b border-[var(--border-panel)] text-center">
                        <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>Defective</Typography>
                      </th>
                      <th className="px-6 py-4 border-b border-[var(--border-panel)] text-center">
                        <Typography variant="overline" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>Repair</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-panel)]">
                    {Object.entries(byLab).map(([labId, agg]) => {
                      const labName = labs.find(l => l.id === Number(labId))?.name || `Lab ${labId}`;
                      return (
                        <tr key={labId} className="hover:bg-[var(--bg-hover)] transition-colors group">
                          <td className="px-6 py-5">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: '#3b82f6', opacity: 0.3 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{labName}</Typography>
                            </Box>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <Chip label={agg.total} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(148,163,184,0.1)', color: 'var(--text-secondary)' }} />
                          </td>
                          <td className="px-6 py-5 text-center text-emerald-600 dark:text-emerald-400 font-bold">{agg.working}</td>
                          <td className="px-6 py-5 text-center text-rose-500 font-bold">{agg.not_working}</td>
                          <td className="px-6 py-5 text-center text-amber-500 font-bold">{agg.under_repair}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </Box>

            {/* Chart Section */}
            <Box sx={{ 
              p: 3, 
              backgroundColor: 'var(--bg-glass)', 
              border: '1px solid var(--border-panel)', 
              borderRadius: '20px',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.05)',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Availability by Hardware</Typography>
              {typeKeys.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography sx={{ color: 'var(--text-secondary)' }}>No equipment data recorded.</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Box component="svg" width="100%" height={320} viewBox={`0 0 ${Math.max(400, typeKeys.length * 100)} 300`}>
                    {typeKeys.map((k, idx) => {
                      const agg = byType[k]!;
                      const x = 50 + idx * 90;
                      const scale = (v: number) => (v / maxTypeTotal) * 160;
                      
                      return (
                        <g key={k}>
                          <rect x={x} y={220 - scale(agg.working)} width={12} height={scale(agg.working)} fill="#10b981" rx={2} />
                          <rect x={x + 15} y={220 - scale(agg.not_working)} width={12} height={scale(agg.not_working)} fill="#ef4444" rx={2} />
                          <rect x={x + 30} y={220 - scale(agg.under_repair)} width={12} height={scale(agg.under_repair)} fill="#f59e0b" rx={2} />
                          <text x={x + 15} y={250} textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600" transform={`rotate(15, ${x+15}, 250)`}>{k}</text>
                        </g>
                      );
                    })}
                    <line x1="40" y1="220" x2="100%" y2="220" stroke="var(--border-panel)" strokeWidth="1" />
                    <text x={20} y={40} fontSize="10" fill="var(--text-secondary)">Qty</text>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default Inventory;
