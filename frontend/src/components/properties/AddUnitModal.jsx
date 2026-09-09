import React, { useState } from 'react';
import {
  Layers,
  Building2,
  Sparkles,
  Compass,
  DollarSign,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINR } from '../../utils/crmFormatters';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export function AddUnitModal({
  isOpen,
  onClose,
  defaultProjectId = '',
  defaultProjectName = '',
  towers = [],
}) {
  const { projects, addUnit } = useCrm();

  const selectedProj =
    projects.find((p) => p.id === defaultProjectId || p.name === defaultProjectName) ||
    projects[0];

  const availableTowers = towers.length > 0 ? towers : selectedProj?.buildings || [];

  const [formData, setFormData] = useState({
    projectId: defaultProjectId || selectedProj?.id || '',
    projectName: defaultProjectName || selectedProj?.name || '',
    buildingId: availableTowers[0]?.id || 'bld-1',
    buildingName: availableTowers[0]?.name || 'Tower A',
    unitNumber: '',
    type: '3 BHK Grand',
    floor: '5',
    area: '1680',
    price: '13500000',
    facing: 'East',
    status: UNIT_STATUS.AVAILABLE,
  });

  const [errors, setErrors] = useState({});

  // Quick fill sample unit
  const handleQuickFill = () => {
    const tower = availableTowers[0] || { id: 'bld-1', name: 'Tower A' };
    setFormData({
      projectId: defaultProjectId || selectedProj?.id || '',
      projectName: defaultProjectName || selectedProj?.name || '',
      buildingId: tower.id,
      buildingName: tower.name,
      unitNumber: `${tower.name.replace('Tower ', '')}-1204`,
      type: '3 BHK Grand',
      floor: '12',
      area: '1750',
      price: '14200000',
      facing: 'East',
      status: UNIT_STATUS.AVAILABLE,
    });
    setErrors({});
  };

  const handleProjectChange = (e) => {
    const pId = e.target.value;
    const proj = projects.find((p) => p.id === pId);
    if (proj) {
      const firstTower = proj.buildings?.[0] || { id: 'bld-1', name: 'Tower A' };
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        projectName: proj.name,
        buildingId: firstTower.id,
        buildingName: firstTower.name,
      }));
    }
  };

  const handleTowerChange = (e) => {
    const bldId = e.target.value;
    const tower = availableTowers.find((b) => b.id === bldId);
    if (tower) {
      setFormData((prev) => ({
        ...prev,
        buildingId: tower.id,
        buildingName: tower.name,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.unitNumber.trim()) newErrors.unitNumber = 'Unit number is required (e.g. A-304)';
    if (!formData.area || parseInt(formData.area, 10) <= 0)
      newErrors.area = 'Enter valid super area in sq ft';
    if (!formData.price || parseInt(formData.price, 10) <= 0)
      newErrors.price = 'Enter valid base price';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addUnit({
      ...formData,
      unitNumber: formData.unitNumber.trim(),
      floor: parseInt(formData.floor, 10) || 1,
      area: parseInt(formData.area, 10) || 1500,
      price: parseInt(formData.price, 10) || 10000000,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        defaultProjectName
          ? `Add Inventory Unit to ${defaultProjectName}`
          : 'Add New Unit to Project Inventory'
      }
      description="Configure residential unit specifications, floor level, facing, and base allotment pricing"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Demo Fill Banner */}
        <div className="flex items-center justify-between p-3 bg-brand-50/70 border border-brand-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-800">
              Want to auto-populate unit details?
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleQuickFill}
            className="bg-white border-brand-300 text-brand-700 hover:bg-brand-50 text-xs font-semibold"
          >
            Fill Sample Unit
          </Button>
        </div>

        {/* 1. Target Project & Tower Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Associated Development Project"
              required
              disabled={Boolean(defaultProjectId)}
              value={formData.projectId}
              onChange={handleProjectChange}
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.city})`,
              }))}
            />
            {defaultProjectName && (
              <p className="text-[11px] text-slate-400 mt-1">
                Locked to currently viewed property project
              </p>
            )}
          </div>

          <div>
            <Select
              label="Architectural Tower / Block"
              required
              value={formData.buildingId}
              onChange={handleTowerChange}
              options={availableTowers.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.floors} Floors)`,
              }))}
            />
          </div>
        </div>

        {/* 2. Unit Identification & Typology */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Unit Number"
            placeholder="e.g. A-1204"
            required
            value={formData.unitNumber}
            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
            error={errors.unitNumber}
          />

          <Select
            label="Typology / Configuration"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '1 BHK Compact', label: '1 BHK Compact (650 - 750 sq ft)' },
              { value: '2 BHK Luxury', label: '2 BHK Luxury (1,150 - 1,350 sq ft)' },
              { value: '3 BHK Grand', label: '3 BHK Grand (1,650 - 1,950 sq ft)' },
              { value: '4 BHK Signature', label: '4 BHK Signature (2,400 - 3,200 sq ft)' },
              { value: 'Penthouse / Sky Villa', label: 'Penthouse / Sky Villa (3,800+ sq ft)' },
            ]}
          />

          <Input
            label="Floor Level"
            type="number"
            min="1"
            max="60"
            required
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
          />
        </div>

        {/* 3. Area, Price & Facing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Super Built-up Area (sq ft)"
            type="number"
            placeholder="e.g. 1720"
            required
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            error={errors.area}
          />

          <Select
            label="Facing Direction"
            value={formData.facing}
            onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
            options={[
              { value: 'East', label: 'East (Morning Sunlight)' },
              { value: 'North', label: 'North' },
              { value: 'North-East', label: 'North-East (Vastu Compliant)' },
              { value: 'West', label: 'West' },
              { value: 'South', label: 'South' },
            ]}
          />

          <Select
            label="Initial Availability Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: UNIT_STATUS.AVAILABLE, label: 'AVAILABLE (Ready for Allotment)' },
              { value: UNIT_STATUS.BLOCKED, label: 'BLOCKED (Temporary Hold)' },
              { value: UNIT_STATUS.BOOKED, label: 'BOOKED (Token Allotted)' },
            ]}
          />
        </div>

        {/* 4. Pricing Calculation Preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
          <Input
            label="Base Allotment Price in INR (₹)"
            type="number"
            placeholder="e.g. 14200000"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={errors.price}
          />
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Formatted Price Preview:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {formatINR(parseInt(formData.price, 10) || 0)}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 px-6 shadow-xs mt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" leftIcon={Layers}>
            Save & Add Unit to Catalog
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddUnitModal;
