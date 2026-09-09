import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building2,
  DollarSign,
  Maximize2,
  Compass,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINR, formatINRCompact } from '../../utils/crmFormatters';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export function EditUnitModal({ isOpen, onClose, unit, onSuccess }) {
  const [formData, setFormData] = useState({
    unitNumber: '',
    unitType: '2 BHK',
    floor: '1',
    area: '1200',
    price: '',
    facing: 'East',
    status: 'AVAILABLE',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeFacing = (f) => {
    if (!f) return 'East';
    const str = String(f).trim();
    if (/^north-?east/i.test(str)) return 'North-East';
    if (/^north/i.test(str)) return 'North';
    if (/^east/i.test(str)) return 'East';
    if (/^west/i.test(str)) return 'West';
    if (/^south/i.test(str)) return 'South';
    return str;
  };

  useEffect(() => {
    if (unit && isOpen) {
      setFormData({
        unitNumber: unit.unit_number || unit.unitNumber || '',
        unitType: unit.unit_type || unit.type || '2 BHK',
        floor: String(unit.floor !== undefined ? unit.floor : '1'),
        area: String(unit.area || '1200'),
        price: String(unit.price || ''),
        facing: normalizeFacing(unit.facing),
        status: unit.status || 'AVAILABLE',
      });
      setErrors({});
    }
  }, [unit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unit) return;

    const newErrors = {};
    if (!formData.unitNumber.trim()) newErrors.unitNumber = 'Unit number is required';
    if (!formData.floor || isNaN(formData.floor)) newErrors.floor = 'Valid floor level is required';
    if (!formData.area || isNaN(formData.area) || Number(formData.area) <= 0) {
      newErrors.area = 'Super Area must be greater than 0';
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid unit price is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await propertyService.updateUnit(unit.id, {
        unit_number: formData.unitNumber.trim(),
        unit_type: formData.unitType,
        floor: parseInt(formData.floor, 10),
        area: parseFloat(formData.area),
        price: parseFloat(formData.price),
        facing: formData.facing,
        status: formData.status,
      });

      onSuccess?.(unit.id);
      onClose();
    } catch (err) {
      console.error('Failed to update unit:', err);
      setErrors({
        submit: err.message || 'Failed to update inventory unit. Please check input values.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!unit) return null;

  const projName = unit.building?.project?.name || unit.projectName || 'Development Project';
  const bldName = unit.building?.name || unit.buildingName || 'Tower Block';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={`Edit Unit: ${unit.unit_number || unit.unitNumber}`}
      description={`${projName} • ${bldName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project & Tower Header Badge */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span className="font-semibold">{projName}</span>
          </div>
          <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {bldName}
          </span>
        </div>

        {/* Row 1: Unit Number & Typology */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Unit Number"
            required
            placeholder="e.g. A-101, B-402"
            value={formData.unitNumber}
            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
            error={errors.unitNumber}
          />

          <Select
            label="Typology / Configuration"
            required
            value={formData.unitType}
            onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
            options={[
              { value: '1BHK', label: '1 BHK Executive' },
              { value: '2BHK', label: '2 BHK Premium' },
              { value: '3BHK', label: '3 BHK Luxury' },
              { value: '3 BHK Grand', label: '3 BHK Grand' },
              { value: '4BHK', label: '4 BHK Ultra' },
              { value: 'Penthouse', label: 'Sky Penthouse' },
              { value: 'Duplex Villa', label: 'Duplex Villa' },
            ]}
          />
        </div>

        {/* Row 2: Floor & Super Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Floor Level"
            type="number"
            min="0"
            max="120"
            required
            placeholder="e.g. 5"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            error={errors.floor}
            helperText="0 = Ground Floor"
          />

          <div>
            <Input
              label="Super Built-up Area (sq ft)"
              type="number"
              min="100"
              required
              placeholder="e.g. 1650"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              error={errors.area}
              helperText={
                formData.area && Number(formData.area) > 0
                  ? `Est. Carpet: ~${Math.round(Number(formData.area) * 0.76)} sq ft`
                  : undefined
              }
            />
          </div>
        </div>

        {/* Row 3: Facing & Inventory Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Balcony / Vastu Facing"
            value={formData.facing}
            onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
            options={[
              { value: 'East', label: 'East (Morning Sunlight)' },
              { value: 'North', label: 'North (Vastu Compliant)' },
              { value: 'North-East', label: 'North-East (Corner)' },
              { value: 'West', label: 'West (Sunset View)' },
              { value: 'South', label: 'South (Garden View)' },
            ]}
          />

          <Select
            label="Allotment Status"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE (Open for booking)' },
              { value: 'BOOKED', label: 'BOOKED (Allotted to client)' },
              { value: 'BLOCKED', label: 'BLOCKED (Reserved / On Hold)' },
            ]}
          />
        </div>

        {/* Price Input with Live Currency Preview */}
        <div>
          <Input
            label="Total Base Price (INR ₹)"
            type="number"
            min="100000"
            required
            placeholder="e.g. 13500000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={errors.price}
          />
          {formData.price && Number(formData.price) > 0 && (
            <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-semibold">
                Formatted: {formatINRCompact(formData.price)}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {formatINR(formData.price)}
              </span>
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 px-6 mt-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Update Unit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditUnitModal;
