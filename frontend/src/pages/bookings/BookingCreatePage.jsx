import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ArrowLeft,
  Search,
  Building2,
  Layers,
  User,
  CheckCircle2,
  BookmarkCheck,
  ShieldCheck,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINR, formatINRCompact } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export function BookingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { leads, projects, units, createBooking, currentUser } = useCrm();

  const preselectedLeadId = searchParams.get('leadId') || '';
  const preselectedUnitId = searchParams.get('unitId') || '';

  // Stepper State (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState(preselectedLeadId && preselectedUnitId ? 4 : 1);

  // Form State across steps
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId);
  const [bookingAmount, setBookingAmount] = useState(500000);

  // Confirmation Modal & Success State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmedBookingResult, setConfirmedBookingResult] = useState(null);

  // Prepopulate project and building if unitId provided
  useEffect(() => {
    if (preselectedUnitId) {
      const u = units.find((item) => item.id === preselectedUnitId);
      if (u) {
        setSelectedProjectId(u.projectId);
        setSelectedBuildingId(u.buildingId);
        setSelectedUnitId(u.id);
      }
    }
  }, [preselectedUnitId, units]);

  // Derived selections
  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  // Available units for selected project & building
  const availableUnits = units.filter(
    (u) =>
      u.status === UNIT_STATUS.AVAILABLE &&
      (!selectedProjectId || u.projectId === selectedProjectId) &&
      (!selectedBuildingId || u.buildingId === selectedBuildingId)
  );

  // Filter leads for Step 1
  const filteredLeads = leads.filter((l) => {
    if (!leadSearchQuery) return true;
    const q = leadSearchQuery.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q);
  });

  const handleConfirmSubmit = () => {
    try {
      const newBooking = createBooking({
        leadId: selectedLeadId,
        unitId: selectedUnitId,
        bookingAmount,
      });
      setConfirmedBookingResult(newBooking);
      setConfirmModalOpen(false);
    } catch (err) {
      alert(err.message);
      setConfirmModalOpen(false);
    }
  };

  // SUCCESS VIEW
  if (confirmedBookingResult) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="text-center p-8 border-emerald-200 bg-white">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Unit allocation has been registered and marked as booked. The customer profile has been updated.
          </p>

          {/* Booking Summary Box */}
          <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Booking Reference:</span>
              <span className="font-mono font-bold text-brand-700 text-sm">
                {confirmedBookingResult.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Buyer Name:</span>
              <span className="font-semibold text-slate-900">{confirmedBookingResult.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Property & Unit:</span>
              <span className="font-semibold text-slate-900">
                {confirmedBookingResult.projectName} • {confirmedBookingResult.buildingName} • Unit {confirmedBookingResult.unitNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Agreement Value:</span>
              <span className="font-bold text-slate-900">{formatINR(confirmedBookingResult.totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Token Amount Received:</span>
              <span className="font-bold text-emerald-700">{formatINR(confirmedBookingResult.bookingAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sales Representative:</span>
              <span className="font-medium text-slate-700">{confirmedBookingResult.bookedBy}</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/bookings">
              <Button variant="primary" size="md">
                View All Bookings
              </Button>
            </Link>
            <Link to="/units">
              <Button variant="secondary" size="md">
                Check Inventory
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Select Lead' },
    { num: 2, title: 'Select Property' },
    { num: 3, title: 'Select Unit' },
    { num: 4, title: 'Confirm' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bookings</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
          New Unit Booking Workflow
        </h1>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                <div
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.num);
                  }}
                  className={`flex items-center gap-2 ${
                    isCompleted ? 'cursor-pointer' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isCurrent ? 'text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                      currentStep > step.num ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SELECT LEAD */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Step 1: Select Prospective Buyer</CardTitle>
              <CardDescription>Search and link a registered lead to this reservation</CardDescription>
            </div>
            <Link to="/leads/create">
              <Button variant="secondary" size="xs">
                + Add New Lead
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by customer name, phone, or email..."
              isSearch
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
            />

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredLeads.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLeadId(l.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    selectedLeadId === l.id ? 'bg-brand-50/80 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{l.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {l.phone} • {l.email}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-600">{l.preferredProject}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{l.budget}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <Button
                variant="primary"
                size="md"
                disabled={!selectedLeadId}
                onClick={() => setCurrentStep(2)}
                rightIcon={ChevronRight}
              >
                Proceed to Property Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SELECT PROPERTY & BUILDING */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Step 2: Select Development & Tower</CardTitle>
              <CardDescription>Choose the project and architectural block</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Residential Development
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setSelectedBuildingId('');
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-subtle'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm">{proj.name}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {proj.location}
                      </div>
                      <div className={`mt-2 font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
                        {proj.priceRange}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProject && (
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  2. Select Tower / Block
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProject.buildings.map((bld) => {
                    const isSelected = selectedBuildingId === bld.id;
                    return (
                      <div
                        key={bld.id}
                        onClick={() => setSelectedBuildingId(bld.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>{bld.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{bld.floors} Floors</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedProjectId || !selectedBuildingId}
                onClick={() => setCurrentStep(3)}
                rightIcon={ChevronRight}
              >
                View Available Units
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: SELECT UNIT */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Step 3: Select Available Unit</CardTitle>
              <CardDescription>
                Live inventory for {selectedProject?.name} •{' '}
                {selectedProject?.buildings.find((b) => b.id === selectedBuildingId)?.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableUnits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                {availableUnits.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-card'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-sm tracking-tight">
                            Unit {unit.unitNumber}
                          </span>
                          <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            Floor {unit.floor} • {unit.facing || 'East Facing'}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {unit.type}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100/20 flex items-center justify-between">
                        <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {unit.area} sq ft
                        </span>
                        <span className={`font-bold font-mono text-sm ${isSelected ? 'text-emerald-300' : 'text-slate-900'}`}>
                          {formatINR(unit.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No units available in this tower right now. Please select another tower.
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedUnitId}
                onClick={() => setCurrentStep(4)}
                rightIcon={ChevronRight}
              >
                Review Booking Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: REVIEW BOOKING SUMMARY */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Step 4: Booking Summary & Final Review</CardTitle>
              <CardDescription>
                Verify customer allocation, pricing breakdown, and initial booking token
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Detail Grid */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 divide-y divide-slate-200 text-xs">
              <div className="py-2.5 first:pt-0 flex items-center justify-between">
                <span className="text-slate-500">Prospective Buyer:</span>
                <span className="font-semibold text-slate-900">{selectedLead?.name || 'Selected Lead'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Contact Details:</span>
                <span className="text-slate-700 font-mono">
                  {selectedLead?.phone} • {selectedLead?.email}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Project & Building:</span>
                <span className="font-semibold text-slate-900">
                  {selectedUnit?.projectName} ({selectedUnit?.buildingName})
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Selected Unit:</span>
                <span className="font-mono font-bold text-slate-900">
                  Unit {selectedUnit?.unitNumber} ({selectedUnit?.type}, {selectedUnit?.area} sq ft)
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Total Agreement Price:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {formatINR(selectedUnit?.price)}
                </span>
              </div>
            </div>

            {/* Token Deposit Amount */}
            <div className="space-y-1.5 max-w-sm">
              <Input
                label="Booking Token Amount (₹)"
                type="number"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(e.target.value)}
                helperText="Minimum recommended token is ₹2,00,000"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setConfirmModalOpen(true)}
                leftIcon={BookmarkCheck}
              >
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Unit Allocation"
        description="Are you sure you want to finalize this unit booking?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            You are about to book{' '}
            <strong className="text-slate-900">
              Unit {selectedUnit?.unitNumber} ({selectedUnit?.projectName})
            </strong>{' '}
            for <strong className="text-slate-900">{selectedLead?.name}</strong>.
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Unit Price:</span>
              <span className="font-semibold">{formatINR(selectedUnit?.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Token Amount:</span>
              <span className="font-bold text-emerald-700">{formatINR(bookingAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSubmit}>
              Commit & Book Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BookingCreatePage;
