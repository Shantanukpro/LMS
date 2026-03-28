import React, { useState, useEffect } from 'react';
import { maintenanceAPI, pcsAPI, labEquipmentAPI } from '../../services/api';
import type { MaintenanceLog, PC, LabEquipment } from '../../types';

interface MaintenanceFormProps {
  maintenance?: MaintenanceLog;
  labId?: number;
  onSuccess?: (maintenance: MaintenanceLog) => void;
  onCancel?: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  maintenance, 
  labId, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    pc: '',
    lab_equipment: '',
    peripheral: '',
    issue_description: '',
    status_before: '',
    status_after: '',
    status: 'pending' as 'pending' | 'fixed',
    remarks: ''
  });

  const [pcs, setPCs] = useState<PC[]>([]);
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'pc' | 'lab_equipment' | 'peripheral'>('pc');

  useEffect(() => {
    if (labId) {
      fetchLabData();
    }
    if (maintenance) {
      setFormData({
        pc: maintenance.pc?.toString() || '',
        lab_equipment: maintenance.lab_equipment?.toString() || '',
        peripheral: maintenance.peripheral?.toString() || '',
        issue_description: maintenance.issue_description || '',
        status_before: maintenance.status_before || '',
        status_after: maintenance.status_after || '',
        status: maintenance.status,
        remarks: maintenance.remarks || ''
      });
      
      // Determine target type based on what's set
      if (maintenance.pc) setTargetType('pc');
      else if (maintenance.lab_equipment) setTargetType('lab_equipment');
      else if (maintenance.peripheral) setTargetType('peripheral');
    }
  }, [maintenance, labId]);

  const fetchLabData = async () => {
    try {
      const [pcsData, equipmentData] = await Promise.all([
        pcsAPI.getByLab(labId!),
        labEquipmentAPI.getByLab(labId!)
      ]);
      setPCs(pcsData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Failed to fetch lab data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const maintenanceData = {
        ...formData,
        pc: targetType === 'pc' ? parseInt(formData.pc) : undefined,
        lab_equipment: targetType === 'lab_equipment' ? parseInt(formData.lab_equipment) : undefined,
        peripheral: targetType === 'peripheral' ? parseInt(formData.peripheral) : undefined,
        lab: labId
      };

      let savedMaintenance: MaintenanceLog;
      
      if (maintenance) {
        savedMaintenance = await maintenanceAPI.update(maintenance.id, maintenanceData);
      } else {
        savedMaintenance = await maintenanceAPI.create(maintenanceData);
      }

      onSuccess?.(savedMaintenance);
    } catch (error) {
      console.error('Failed to save maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          {maintenance ? 'Edit Maintenance Log' : 'Create Maintenance Log'}
        </h3>
        
        {/* Target Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Type *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="pc"
                checked={targetType === 'pc'}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm">PC</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="lab_equipment"
                checked={targetType === 'lab_equipment'}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm">Lab Equipment</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="peripheral"
                checked={targetType === 'peripheral'}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm">Peripheral</span>
            </label>
          </div>
        </div>

        {/* Target Selection */}
        <div className="mb-6">
          {targetType === 'pc' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PC *
              </label>
              <select
                required
                value={formData.pc}
                onChange={(e) => setFormData({ ...formData, pc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a PC</option>
                {pcs.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.device_name} - {pc.brand}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'lab_equipment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab Equipment *
              </label>
              <select
                required
                value={formData.lab_equipment}
                onChange={(e) => setFormData({ ...formData, lab_equipment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Equipment</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.equipment_code} - {eq.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'peripheral' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peripheral *
              </label>
              <select
                required
                value={formData.peripheral}
                onChange={(e) => setFormData({ ...formData, peripheral: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Peripheral</option>
                {/* This would need to be populated based on selected PC */}
                <option value="1">Example Peripheral</option>
              </select>
            </div>
          )}
        </div>

        {/* Issue Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Description *
            </label>
            <textarea
              required
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Before Issue
              </label>
              <select
                value={formData.status_before}
                onChange={(e) => setFormData({ ...formData, status_before: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                <option value="working">Working</option>
                <option value="not_working">Not Working</option>
                <option value="under_repair">Under Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status After Fix
              </label>
              <select
                value={formData.status_after}
                onChange={(e) => setFormData({ ...formData, status_after: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                <option value="working">Working</option>
                <option value="not_working">Not Working</option>
                <option value="under_repair">Under Repair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Saving...' : (maintenance ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default MaintenanceForm;
