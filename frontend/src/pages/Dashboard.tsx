import React, { useState, useEffect } from 'react';
import { Monitor, Server, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import { labEquipmentAPI, labsAPI, maintenanceAPI, pcsAPI } from '../services/api';
import type { LabEquipment, Lab, MaintenanceLog, PC } from '../types';

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
  const [error, setError] = useState('');
  

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch all data in parallel
        const [labs, equipment, pcs, maintenance] = await Promise.all<[
          any,
          any,
          any,
          any
        ]>([
          labsAPI.getAll(),
          labEquipmentAPI.getAll(),
          pcsAPI.getAll(),
          maintenanceAPI.getAll(),
        ]);

        // Extract results from paginated responses
        const labsArray = (Array.isArray(labs) ? labs : (labs?.results ?? [])) as Lab[];
        const equipmentArray = (Array.isArray(equipment) ? equipment : (equipment?.results ?? [])) as LabEquipment[];
        const pcsArray = (Array.isArray(pcs) ? pcs : (pcs?.results ?? [])) as PC[];
        const maintenanceArray = (Array.isArray(maintenance) ? maintenance : (maintenance?.results ?? [])) as MaintenanceLog[];

        // Calculate stats from actual equipment data
        const totalLabs = labsArray.length;
        const totalEquipment = equipmentArray.length;
        const workingEquipment = equipmentArray.filter((item: LabEquipment) => item.status === 'working').length;
        const notWorkingEquipment = equipmentArray.filter((item: LabEquipment) => item.status === 'not_working').length;
        const underRepairEquipment = equipmentArray.filter((item: LabEquipment) => item.status === 'under_repair').length;
        const totalPCs = pcsArray.length;
        const workingPCs = pcsArray.filter((item: PC) => item.status === 'working').length;
        const pendingMaintenance = maintenanceArray.filter((log: MaintenanceLog) => log.status === 'pending').length;

        setStats({
          totalLabs,
          totalEquipment,
          workingEquipment,
          notWorkingEquipment,
          underRepairEquipment,
          pendingMaintenance,
          totalPCs,
          workingPCs,
        });

      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err?.response?.data?.detail || 'Failed to load dashboard data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'orange';
  }> = ({ title, value, icon, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      amber: 'from-amber-500 to-amber-600',
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
    };

    return (
      <div className="rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border" 
           style={{ 
             backgroundColor: 'var(--card-bg)', 
             borderColor: 'var(--border-color)',
             boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
           }}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 mb-6 border" style={{ 
        backgroundColor: '#FEE2E2', 
        borderColor: '#FCA5A5'
      }}>
        <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monitor and manage your lab infrastructure and resources</p>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total PCs"
          value={stats.totalPCs}
          icon={<Monitor className="h-6 w-6 text-white" />}
          color="blue"
        />
        <StatCard
          title="Working PCs"
          value={stats.workingPCs}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="green"
        />
        <StatCard
          title="Total Equipment"
          value={stats.totalEquipment}
          icon={<Server className="h-6 w-6 text-white" />}
          color="purple"
        />
        <StatCard
          title="Working Equipment"
          value={stats.workingEquipment}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="green"
        />
        <StatCard
          title="Not Working Equipment"
          value={stats.notWorkingEquipment}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="red"
        />
        <StatCard
          title="Under Repair Equipment"
          value={stats.underRepairEquipment}
          icon={<Wrench className="h-6 w-6 text-white" />}
          color="amber"
        />
        <StatCard
          title="Pending Maintenance"
          value={stats.pendingMaintenance}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="orange"
        />
      </div>
    </div>
  );
};

export default Dashboard;
