import React, { useState, useEffect } from 'react';
import { labEquipmentAPI } from '../../services/api';
import type { LabEquipment, NetworkEquipmentDetails, ServerDetails, ProjectorDetails, ElectricalApplianceDetails } from '../../types';

interface LabEquipmentFormProps {
  equipment?: LabEquipment;
  labId: number;
  onSuccess?: (equipment: LabEquipment) => void;
  onCancel?: () => void;
}

const LabEquipmentForm: React.FC<LabEquipmentFormProps> = ({ 
  equipment, 
  labId, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<LabEquipment>>({
    equipment_code: '',
    name: '',
    category: 'INFRASTRUCTURE',
    equipment_type: 'OTHER',
    brand: '',
    model_name: '',
    quantity: 1,
    status: 'working',
    is_networked: false,
    installation_date: '',
    location_in_lab: '',
    remarks: ''
  });

  const [networkDetails, setNetworkDetails] = useState({
    ip_address: '',
    mac_address: '',
    firmware_version: '',
    number_of_ports: '',
    rack_unit_size: '',
    managed_switch: false,
    bandwidth_capacity: '',
    power_rating: ''
  });

  const [serverDetails, setServerDetails] = useState({
    cpu_model: '',
    total_ram: '',
    total_storage: '',
    raid_config: '',
    virtualization_enabled: false,
    operating_system: ''
  });

  const [projectorDetails, setProjectorDetails] = useState({
    resolution: '',
    brightness_lumens: '',
    throw_type: '',
    hdmi_ports: ''
  });

  const [electricalDetails, setElectricalDetails] = useState({
    power_rating: '',
    voltage: '',
    inverter_type: false,
    energy_rating: '',
    service_due_date: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipment_code: equipment.equipment_code,
        name: equipment.name,
        category: equipment.category,
        equipment_type: equipment.equipment_type,
        brand: equipment.brand || '',
        model_name: equipment.model_name || '',
        quantity: equipment.quantity,
        status: equipment.status,
        is_networked: equipment.is_networked,
        installation_date: equipment.installation_date || '',
        location_in_lab: equipment.location_in_lab || '',
        remarks: equipment.remarks || ''
      });

      // Load sub-details if they exist
      if (equipment.network_details) {
        setNetworkDetails({
          ip_address: equipment.network_details.ip_address || '',
          mac_address: equipment.network_details.mac_address || '',
          firmware_version: equipment.network_details.firmware_version || '',
          number_of_ports: equipment.network_details.number_of_ports?.toString() || '',
          rack_unit_size: equipment.network_details.rack_unit_size?.toString() || '',
          managed_switch: equipment.network_details.managed_switch,
          bandwidth_capacity: equipment.network_details.bandwidth_capacity || '',
          power_rating: equipment.network_details.power_rating || ''
        });
      }
      // Similar for other detail types...
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const equipmentData: Partial<LabEquipment> = {
        ...formData,
        lab: labId,
        installation_date: formData.installation_date || undefined
      };

      let savedEquipment: LabEquipment;
      
      if (equipment) {
        savedEquipment = await labEquipmentAPI.update(equipment.id, equipmentData);
      } else {
        savedEquipment = await labEquipmentAPI.create(equipmentData);
      }

      // Save sub-details based on equipment type
      const equipmentType = savedEquipment.equipment_type;
      
      if (['ROUTER', 'SWITCH', 'HUB', 'SERVER', 'E_BOARD'].includes(equipmentType)) {
        await labEquipmentAPI.updateNetworkDetails(savedEquipment.id, {
          ...networkDetails,
          number_of_ports: networkDetails.number_of_ports ? parseInt(networkDetails.number_of_ports) : undefined,
          rack_unit_size: networkDetails.rack_unit_size ? parseInt(networkDetails.rack_unit_size) : undefined
        });
      }

      if (equipmentType === 'SERVER') {
        await labEquipmentAPI.updateServerDetails(savedEquipment.id, serverDetails);
      }

      if (equipmentType === 'PROJECTOR') {
        await labEquipmentAPI.updateProjectorDetails(savedEquipment.id, {
          ...projectorDetails,
          brightness_lumens: projectorDetails.brightness_lumens ? parseInt(projectorDetails.brightness_lumens) : undefined,
          hdmi_ports: projectorDetails.hdmi_ports ? parseInt(projectorDetails.hdmi_ports) : undefined
        });
      }

      if (['AC', 'FAN', 'LIGHT'].includes(equipmentType)) {
        await labEquipmentAPI.updateElectricalDetails(savedEquipment.id, electricalDetails);
      }

      onSuccess?.(savedEquipment);
    } catch (error) {
      console.error('Failed to save equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const networkTypes = ['ROUTER', 'SWITCH', 'HUB', 'SERVER', 'E_BOARD'];
  const serverTypes = ['SERVER'];
  const projectorTypes = ['PROJECTOR'];
  const electricalTypes = ['AC', 'FAN', 'LIGHT'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Code *
            </label>
            <input
              type="text"
              required
              value={formData.equipment_code}
              onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., LAB1-SW-01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Cisco Core Switch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="APPLIANCE">Appliance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Type *
            </label>
            <select
              value={formData.equipment_type}
              onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SERVER">Server</option>
              <option value="ROUTER">Router</option>
              <option value="SWITCH">Switch</option>
              <option value="HUB">Hub</option>
              <option value="PROJECTOR">Projector</option>
              <option value="E_BOARD">E-Board</option>
              <option value="AC">Air Conditioner</option>
              <option value="FAN">Fan</option>
              <option value="LIGHT">Light</option>
              <option value="UPS">UPS</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="working">Working</option>
              <option value="not_working">Not Working</option>
              <option value="under_repair">Under Repair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Date
            </label>
            <input
              type="date"
              value={formData.installation_date}
              onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location in Lab
            </label>
            <input
              type="text"
              value={formData.location_in_lab}
              onChange={(e) => setFormData({ ...formData, location_in_lab: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Rack 2, Wall A"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_networked}
              onChange={(e) => setFormData({ ...formData, is_networked: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Networked Equipment</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Type-specific details would go here - simplified for brevity */}
      
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
          {loading ? 'Saving...' : (equipment ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default LabEquipmentForm;
