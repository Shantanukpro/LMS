import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  MenuItem,
  Chip
} from '@mui/material';
import { Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Software, PC, Lab } from '../../types';

interface LicenseDashboardProps {
  softwareList: Software[];
  pcs: PC[];
  labs: Lab[];
}

type ExpirationItem = {
  id: string; // synthetic ID for UI
  type: 'Software' | 'OS';
  name: string;
  version: string;
  licenseKey: string;
  expiryDate: string; // YYYY-MM-DD
  pcId: number;
  pcName: string;
  labId: number;
  labName: string;
  daysRemaining: number;
};

const LicenseDashboard: React.FC<LicenseDashboardProps> = ({ softwareList, pcs, labs }) => {
  const [q, setQ] = useState('');
  const [fType, setFType] = useState<'All' | 'Software' | 'OS'>('All');

  const items = useMemo(() => {
    const list: ExpirationItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calcDays = (dateStr: string) => {
      const exp = new Date(dateStr);
      const diffTime = exp.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // 1. Add Software
    softwareList.forEach(s => {
      if (!s.expiry_date) return;
      const pc = pcs.find(p => p.id === s.pc);
      const labId = pc?.lab || 0;
      const labName = labs.find(l => l.id === labId)?.name || 'Unknown Lab';
      
      list.push({
        id: `sw-${s.id}`,
        type: 'Software',
        name: s.name,
        version: s.version || '-',
        licenseKey: s.license_key || '-',
        expiryDate: s.expiry_date.slice(0, 10),
        pcId: s.pc,
        pcName: pc?.device_name || `PC #${s.pc}`,
        labId,
        labName,
        daysRemaining: calcDays(s.expiry_date),
      });
    });

    // 2. Add OS
    pcs.forEach(pc => {
      if (!pc.os || !pc.os.expiration_date) return;
      const labName = labs.find(l => l.id === pc.lab)?.name || 'Unknown Lab';
      
      list.push({
        id: `os-${pc.id}`,
        type: 'OS',
        name: pc.os.name,
        version: pc.os.version || '-',
        licenseKey: pc.os.product_key || '-',
        expiryDate: pc.os.expiration_date.slice(0, 10),
        pcId: pc.id,
        pcName: pc.device_name,
        labId: pc.lab,
        labName,
        daysRemaining: calcDays(pc.os.expiration_date),
      });
    });

    // Sort by days remaining (ascending)
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [softwareList, pcs, labs]);

  const filtered = useMemo(() => {
    return items.filter(it => {
      const matchType = fType === 'All' ? true : it.type === fType;
      const text = `${it.name} ${it.version} ${it.pcName} ${it.labName} ${it.licenseKey}`.toLowerCase();
      const matchSearch = q ? text.includes(q.toLowerCase()) : true;
      return matchType && matchSearch;
    });
  }, [items, q, fType]);

  const stats = useMemo(() => {
    return {
      expired: items.filter(i => i.daysRemaining < 0).length,
      critical: items.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 30).length,
      healthy: items.filter(i => i.daysRemaining > 30).length,
    };
  }, [items]);

  return (
    <Box>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <Typography variant="h4" className="text-red-700 dark:text-red-400 font-bold leading-none">{stats.expired}</Typography>
              <Typography variant="body2" className="text-red-600 dark:text-red-500 font-medium mt-1">Expired Licenses</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={24} />
            </div>
            <div>
              <Typography variant="h4" className="text-orange-700 dark:text-orange-400 font-bold leading-none">{stats.critical}</Typography>
              <Typography variant="body2" className="text-orange-600 dark:text-orange-500 font-medium mt-1">Expiring within 30 days</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <Typography variant="h4" className="text-emerald-700 dark:text-emerald-400 font-bold leading-none">{stats.healthy}</Typography>
              <Typography variant="body2" className="text-emerald-600 dark:text-emerald-500 font-medium mt-1">Healthy Licenses</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Search Licenses"
              placeholder="Name, PC, Lab, Key..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Type"
              value={fType}
              onChange={(e) => setFType(e.target.value as any)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Software">Software</MenuItem>
              <MenuItem value="OS">Operating Systems</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              No licenses match your filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Item</th>
                  <th className="px-6 py-4 whitespace-nowrap">Location</th>
                  <th className="px-6 py-4 whitespace-nowrap">License Key</th>
                  <th className="px-6 py-4 whitespace-nowrap">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((row) => {
                  let statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
                  let statusText = 'Healthy';
                  
                  if (row.daysRemaining < 0) {
                    statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
                    statusText = 'Expired';
                  } else if (row.daysRemaining <= 30) {
                    statusColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
                    statusText = `Expires in ${row.daysRemaining}d`;
                  }

                  return (
                    <tr 
                      key={row.id} 
                      className={`transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm ${row.daysRemaining <= 30 ? 'bg-orange-50/10' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {row.type} • {row.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-secondary)]">
                        <div className="font-medium text-[var(--text-primary)]">
                          {row.pcName}
                        </div>
                        <div className="text-xs mt-0.5">
                          {row.labName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        <span className="font-mono bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-color)]">
                          {row.licenseKey}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-[var(--text-primary)]">
                        {row.expiryDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Box>
  );
};

export default LicenseDashboard;
