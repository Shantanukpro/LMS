import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Server,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Building2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { labEquipmentAPI, labsAPI, maintenanceAPI, pcsAPI } from '../services/api';
import type { LabEquipment, Lab, MaintenanceLog, PC } from '../types';

// ── Types ─────────────────────────────────────
interface DashboardStats {
  totalLabs: number;
  totalEquipment: number;
  workingEquipment: number;
  notWorkingEquipment: number;
  underRepairEquipment: number;
  pendingMaintenance: number;
  totalPCs: number;
  workingPCs: number;
}

// ── Stat Card ─────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;         // Tailwind bg class for the icon circle
  trend?: string;          // optional sub-text e.g. "of 24 total"
  accentBar?: string;      // top accent bar colour class
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, trend, accentBar }) => (
  <div className="
    relative bg-white dark:bg-gray-900
    border border-gray-100 dark:border-gray-800
    rounded-2xl p-5
    shadow-[0_1px_3px_rgba(0,0,0,0.05)]
    hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]
    hover:-translate-y-0.5
    transition-all duration-200 ease-out
    overflow-hidden
    group
  ">
    {/* Top accent line */}
    {accentBar && (
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar} opacity-80 group-hover:opacity-100 transition-opacity`} />
    )}

    <div className="flex items-start justify-between">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>

      {/* Value */}
      <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none mt-0.5">
        {value}
      </span>
    </div>

    {/* Label */}
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {title}
      </p>
      {trend && (
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{trend}</p>
      )}
    </div>
  </div>
);

// ── Skeleton loader ─────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="w-12 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  </div>
);

// ── Dashboard ──────────────────────────────────
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLabs: 0,
    totalEquipment: 0,
    workingEquipment: 0,
    notWorkingEquipment: 0,
    underRepairEquipment: 0,
    pendingMaintenance: 0,
    totalPCs: 0,
    workingPCs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [labs, equipment, pcs, maintenance] = await Promise.all<[any, any, any, any]>([
          labsAPI.getAll(),
          labEquipmentAPI.getAll(),
          pcsAPI.getAll(),
          maintenanceAPI.getAll(),
        ]);

        const toArr = (d: any) =>
          Array.isArray(d) ? d : (d?.results ?? []);

        const labsArray:        Lab[]            = toArr(labs);
        const equipmentArray:   LabEquipment[]   = toArr(equipment);
        const pcsArray:         PC[]             = toArr(pcs);
        const maintenanceArray: MaintenanceLog[] = toArr(maintenance);

        setStats({
          totalLabs:            labsArray.length,
          totalEquipment:       equipmentArray.length,
          workingEquipment:     equipmentArray.filter(i => i.status === 'working').length,
          notWorkingEquipment:  equipmentArray.filter(i => i.status === 'not_working').length,
          underRepairEquipment: equipmentArray.filter(i => i.status === 'under_repair').length,
          totalPCs:             pcsArray.length,
          workingPCs:           pcsArray.filter(i => i.status === 'working').length,
          pendingMaintenance:   maintenanceArray.filter(i => i.status === 'pending').length,
        });
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err?.response?.data?.detail || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ── Card definitions (no fake data — values come from stats) ──
  const cards: StatCardProps[] = [
    {
      title:     'Total Labs',
      value:     stats.totalLabs,
      icon:      <Building2  size={18} className="text-indigo-600" />,
      iconBg:    'bg-indigo-50 dark:bg-indigo-900/30',
      accentBar: 'bg-indigo-400',
    },
    {
      title:     'Total PCs',
      value:     stats.totalPCs,
      icon:      <Monitor    size={18} className="text-blue-600" />,
      iconBg:    'bg-blue-50 dark:bg-blue-900/30',
      trend:     `${stats.workingPCs} working`,
      accentBar: 'bg-blue-400',
    },
    {
      title:     'Working PCs',
      value:     stats.workingPCs,
      icon:      <CheckCircle size={18} className="text-emerald-600" />,
      iconBg:    'bg-emerald-50 dark:bg-emerald-900/30',
      accentBar: 'bg-emerald-400',
    },
    {
      title:     'Total Equipment',
      value:     stats.totalEquipment,
      icon:      <Server     size={18} className="text-purple-600" />,
      iconBg:    'bg-purple-50 dark:bg-purple-900/30',
      trend:     `${stats.workingEquipment} working`,
      accentBar: 'bg-purple-400',
    },
    {
      title:     'Working Equipment',
      value:     stats.workingEquipment,
      icon:      <Activity   size={18} className="text-teal-600" />,
      iconBg:    'bg-teal-50 dark:bg-teal-900/30',
      accentBar: 'bg-teal-400',
    },
    {
      title:     'Not Working',
      value:     stats.notWorkingEquipment,
      icon:      <AlertTriangle size={18} className="text-red-600" />,
      iconBg:    'bg-red-50 dark:bg-red-900/30',
      accentBar: 'bg-red-400',
    },
    {
      title:     'Under Repair',
      value:     stats.underRepairEquipment,
      icon:      <Wrench     size={18} className="text-amber-600" />,
      iconBg:    'bg-amber-50 dark:bg-amber-900/30',
      accentBar: 'bg-amber-400',
    },
    {
      title:     'Pending Maintenance',
      value:     stats.pendingMaintenance,
      icon:      <TrendingUp size={18} className="text-orange-600" />,
      iconBg:    'bg-orange-50 dark:bg-orange-900/30',
      accentBar: 'bg-orange-400',
    },
  ];

  return (
    <div className="animate-fade-in space-y-7">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your lab infrastructure</p>
        </div>
        {/* You can add a refresh button or date here if needed */}
      </div>

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map(card => <StatCard key={card.title} {...card} />)
        }
      </div>
    </div>
  );
};

export default Dashboard;
