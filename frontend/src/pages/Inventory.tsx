import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, CircularProgress, Alert } from '@mui/material';
// import { inventoryAPI } from '../services/api';
import type { Inventory as InventoryRow } from '../types';

type Agg = {
  total: number;
  working: number;
  not_working: number;
  under_repair: number;
};

const Inventory: React.FC = () => {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      // const data = await inventoryAPI.getAll();
      // Extract results from paginated response
      // const inventoryArray = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      const inventoryArray: InventoryRow[] = []; // Temporary empty data
      setRows(inventoryArray);
    } catch (e: any) {
      console.error('Failed to load inventory:', e);
      setError(e?.response?.data?.detail || 'Failed to load inventory. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
  const maxTypeTotal = Math.max(1, ...typeKeys.map((k) => (byType[k] ? byType[k]!.total : 0)));

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Inventory Overview
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* KPI Cards */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="overline">Total Equipment</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totals.total}</Typography>
            </CardContent></Card>
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="overline">Working</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>{totals.working}</Typography>
                <Chip size="small" label={`${Math.round((totals.working/(totals.total||1))*100)}%`} color="success" />
              </Stack>
            </CardContent></Card>
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="overline">Not Working</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>{totals.not_working}</Typography>
                <Chip size="small" label={`${Math.round((totals.not_working/(totals.total||1))*100)}%`} color="error" />
              </Stack>
            </CardContent></Card>
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="overline">Under Repair</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{totals.under_repair}</Typography>
                <Chip size="small" label={`${Math.round((totals.under_repair/(totals.total||1))*100)}%`} color="warning" />
              </Stack>
            </CardContent></Card>
          </Stack>

          {/* Simple SVG Bar Chart by Equipment Type */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>By Equipment Type</Typography>
              {typeKeys.length === 0 ? (
                <Typography color="text.secondary">No data</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Box component="svg" width={Math.max(600, typeKeys.length * 140)} height={280}>
                    {typeKeys.map((k, idx) => {
                      const agg = byType[k]!;
                      const x = 60 + idx * 120;
                      const scale = (v: number) => (v / maxTypeTotal) * 160;
                      return (
                        <g key={k}>
                          {/* Bars */}
                          <rect x={x} y={60 + (160 - scale(agg.working))} width={24} height={scale(agg.working)} fill="#16a34a" rx={4} />
                          <rect x={x + 30} y={60 + (160 - scale(agg.not_working))} width={24} height={scale(agg.not_working)} fill="#dc2626" rx={4} />
                          <rect x={x + 60} y={60 + (160 - scale(agg.under_repair))} width={24} height={scale(agg.under_repair)} fill="#f59e0b" rx={4} />
                          {/* Labels */}
                          <text x={x + 30} y={240} textAnchor="middle" fontSize="12">{k}</text>
                          <text x={x + 12} y={50} textAnchor="middle" fontSize="11" fill="#16a34a">W:{agg.working}</text>
                          <text x={x + 42} y={50} textAnchor="middle" fontSize="11" fill="#dc2626">NW:{agg.not_working}</text>
                          <text x={x + 72} y={50} textAnchor="middle" fontSize="11" fill="#f59e0b">UR:{agg.under_repair}</text>
                        </g>
                      );
                    })}
                    {/* Legend */}
                    <g>
                      <rect x={10} y={10} width={12} height={12} fill="#16a34a" />
                      <text x={28} y={20} fontSize="12">Working</text>
                      <rect x={90} y={10} width={12} height={12} fill="#dc2626" />
                      <text x={108} y={20} fontSize="12">Not Working</text>
                      <rect x={200} y={10} width={12} height={12} fill="#f59e0b" />
                      <text x={218} y={20} fontSize="12">Under Repair</text>
                    </g>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Per-Lab Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>By Lab</Typography>
              {Object.keys(byLab).length === 0 ? (
                <Typography color="text.secondary">No data</Typography>
              ) : (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <Box component="thead" sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.100' : 'grey.200' }}>
                    <Box component="tr">
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Lab</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Total</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Working</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Not Working</Box>
                      <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Under Repair</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {Object.entries(byLab).map(([lab, agg]) => (
                      <Box key={lab} component="tr" sx={{ '&:nth-of-type(even)': { backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.100' } }}>
                        <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>Lab {lab}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{agg.total}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'success.main' }}>{agg.working}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'error.main' }}>{agg.not_working}</Box>
                        <Box component="td" sx={{ p: 1.5, color: 'warning.main' }}>{agg.under_repair}</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Inventory;
