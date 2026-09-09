import React, { useState, useEffect, useMemo } from 'react';
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
  Phone,
  Mail,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { leadService } from '../../services/leadService';
import { propertyService } from '../../services/propertyService';
import { bookingService } from '../../services/bookingService';
import { formatINR, formatINRCompact } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export function BookingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedLeadId = searchParams.get('leadId') || '';
  const preselectedUnitId = searchParams.get('unitId') || '';

  // Stepper State (1: Lead, 2: Property, 3: Unit, 4: Confirm)
  const [currentStep, setCurrentStep] = useState(preselectedLeadId && preselectedUnitId ? 4 : 1);

  // Live Data State
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Selection States
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId);
  const [bookingAmount, setBookingAmount] = useState('500000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Confirmation Modal & Success State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmedBookingResult, setConfirmedBookingResult] = useState(null);

  // Load live Leads, Projects & Available Units
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const [leadsRes, projectsRes, unitsRes] = await Promise.all([
          leadService.getLeads({ limit: 100 }),
          propertyService.getProjects(),
          propertyService.getUnits({ status: 'AVAILABLE', limit: 200 }),
        ]);

        const leadList = leadsRes?.leads || (Array.isArray(leadsRes) ? leadsRes : []);
        const projectList = Array.isArray(projectsRes) ? projectsRes : projectsRes?.projects || [];
        const unitList = unitsRes?.units || (Array.isArray(unitsRes) ? unitsRes : []);

        setLeads(leadList);
        setProjects(projectList);
        setUnits(unitList);

        // If preselected unit provided, auto-link project and building
        if (preselectedUnitId) {
          const targetUnit = unitList.find((u) => String(u.id) === String(preselectedUnitId));
          if (targetUnit) {
            const pId = targetUnit.building?.project?.id || targetUnit.building?.project_id || targetUnit.projectId;
            const bId = targetUnit.building?.id || targetUnit.building_id || targetUnit.buildingId;
            if (pId) setSelectedProjectId(String(pId));
            if (bId) setSelectedBuildingId(String(bId));
            setSelectedUnitId(String(targetUnit.id));
            if (targetUnit.price) {
              setBookingAmount(String(Math.round(Number(targetUnit.price) * 0.1)));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load booking workflow dependencies:', err);
        setFetchError(err.message || 'Failed to load booking workflow options');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [preselectedUnitId]);

  // Derived selections
  const selectedLead = useMemo(() => {
    return leads.find((l) => String(l.id) === String(selectedLeadId));
  }, [leads, selectedLeadId]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => String(p.id) === String(selectedProjectId));
  }, [projects, selectedProjectId]);

  const availableBuildings = useMemo(() => {
    return selectedProject?.buildings || [];
  }, [selectedProject]);

  const selectedBuilding = useMemo(() => {
    return availableBuildings.find((b) => String(b.id) === String(selectedBuildingId));
  }, [availableBuildings, selectedBuildingId]);

  // Available units filtered for selected project and building
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (u.status !== 'AVAILABLE') return false;
      const uBldId = u.building?.id || u.building_id || u.buildingId;
      const uProjId = u.building?.project?.id || u.building?.project_id || u.projectId;

      if (selectedBuildingId && String(uBldId) !== String(selectedBuildingId)) return false;
      if (selectedProjectId && String(uProjId) !== String(selectedProjectId)) return false;
      return true;
    });
  }, [units, selectedProjectId, selectedBuildingId]);

  const selectedUnit = useMemo(() => {
    return units.find((u) => String(u.id) === String(selectedUnitId));
  }, [units, selectedUnitId]);

  // Update default token when unit changes
  useEffect(() => {
    if (selectedUnit && selectedUnit.price) {
      setBookingAmount(String(Math.round(Number(selectedUnit.price) * 0.1)));
    }
  }, [selectedUnit]);

  // Filter leads for Step 1
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery.trim()) return leads;
    const q = leadSearchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q))
    );
  }, [leads, leadSearchQuery]);

  // Submit Booking to Live Backend
  const handleConfirmSubmit = async () => {
    if (!selectedLeadId || !selectedUnitId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        lead_id: parseInt(selectedLeadId, 10),
        unit_id: parseInt(selectedUnitId, 10),
        amount: parseFloat(bookingAmount) || 500000,
        booking_date: new Date().toISOString(),
      };

      const result = await bookingService.createBooking(payload);
      setConfirmedBookingResult(result);
      setConfirmModalOpen(false);
    } catch (err) {
      console.error('Failed to commit unit booking:', err);
      setSubmitError(err.message || 'Failed to complete unit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (confirmedBookingResult) {
    const booking = confirmedBookingResult;
    const lead = booking.lead || selectedLead || {};
    const unit = booking.unit || selectedUnit || {};
    const projName = unit.building?.project?.name || selectedProject?.name || 'Residential Development';
    const bldName = unit.building?.name || selectedBuilding?.name || 'Tower';
    const unitNum = unit.unit_number || unit.unitNumber || 'N/A';
    const unitPrice = Number(unit.price) || 0;
    const tokenAmount = Number(booking.amount) || Number(bookingAmount) || 0;

    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="text-center p-8 border-emerald-200 bg-white shadow-modal animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Unit allocation has been locked and registered in the active sales registry. Customer allotment dossier is ready.
          </p>

          {/* Booking Summary Box */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-left space-y-3 text-xs shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Booking Reference:</span>
              <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/80 text-sm">
                {booking.booking_reference || `BK-${booking.id}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Buyer Name:</span>
              <span className="font-semibold text-slate-900">{lead.name || 'Allotted Customer'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Property & Tower:</span>
              <span className="font-semibold text-slate-900">
                {projName} • {bldName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Selected Unit:</span>
              <span className="font-mono font-bold text-brand-700">
                Unit {unitNum} ({unit.unit_type || 'Luxury Unit'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Agreement Value:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{formatINR(unitPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Token Amount Received:</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">{formatINR(tokenAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Sales Representative:</span>
              <span className="font-medium text-slate-700">
                {booking.bookedBy?.name || 'Direct Sales Staff'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/bookings">
              <Button variant="primary" size="md">
                View All Bookings
              </Button>
            </Link>
            <Link to={`/bookings/${booking.id}`}>
              <Button variant="secondary" size="md">
                View Allotment Dossier
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Select Lead' },
    { num: 2, title: 'Select Development' },
    { num: 3, title: 'Select Unit' },
    { num: 4, title: 'Confirm Terms' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading live leads and inventory catalog...</p>
      </div>
    );
  }

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
          <span>New Unit Booking Workflow</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80">
            Live Allotment
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atomically reserve available property inventory with real-time double-booking protection
        </p>
      </div>

      {/* 4-Step Progress Stepper */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-subtle">
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
                  className={`flex items-center gap-2 ${isCompleted ? 'cursor-pointer' : ''}`}
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
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
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
              {filteredLeads.length > 0 ? (
                filteredLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLeadId(String(l.id))}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                      String(selectedLeadId) === String(l.id)
                        ? 'bg-brand-50/90 border-l-4 border-brand-600 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{l.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {l.phone || 'No phone'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {l.email || 'No email'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {l.stage || 'NEW'}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {l.assignedSalesEmployee?.name || 'Direct'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No leads matching search. You can create a new lead first.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {selectedLead ? (
                  <span>
                    Selected: <strong>{selectedLead.name}</strong>
                  </span>
                ) : (
                  'Please select a buyer'
                )}
              </span>
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

      {/* STEP 2: SELECT PROPERTY & TOWER */}
      {currentStep === 2 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
          <CardHeader>
            <div>
              <CardTitle>Step 2: Select Development & Tower</CardTitle>
              <CardDescription>Choose the project and architectural block</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Residential Development Project
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((proj) => {
                  const isSelected = String(selectedProjectId) === String(proj.id);
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(String(proj.id));
                        setSelectedBuildingId('');
                        setSelectedUnitId('');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-card'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm">{proj.name}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {proj.location}
                      </div>
                      <div className={`mt-2 font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
                        {proj.price_range || proj.priceRange || 'Luxury Tier'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProject && (
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  2. Select Architectural Tower / Block
                </label>
                {availableBuildings.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableBuildings.map((bld) => {
                      const isSelected = String(selectedBuildingId) === String(bld.id);
                      return (
                        <div
                          key={bld.id}
                          onClick={() => {
                            setSelectedBuildingId(String(bld.id));
                            setSelectedUnitId('');
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="font-semibold">{bld.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {bld.description || 'Residential Block'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-xs">
                    No towers registered under this development yet.
                  </div>
                )}
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
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
          <CardHeader>
            <div>
              <CardTitle>Step 3: Select Available Unit</CardTitle>
              <CardDescription>
                Live available inventory for {selectedProject?.name} • {selectedBuilding?.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredUnits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                {filteredUnits.map((unit) => {
                  const isSelected = String(selectedUnitId) === String(unit.id);
                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnitId(String(unit.id))}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-card'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-sm tracking-tight">
                            Unit {unit.unit_number || unit.unitNumber}
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
                          {unit.unit_type || unit.type}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100/20 flex items-center justify-between">
                        <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {unit.area} sq ft
                        </span>
                        <span
                          className={`font-bold font-mono text-sm ${
                            isSelected ? 'text-emerald-300' : 'text-slate-900'
                          }`}
                        >
                          {formatINR(unit.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No units available in this tower right now. Please go back and select another tower or development.
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

      {/* STEP 4: REVIEW & CONFIRM */}
      {currentStep === 4 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-subtle">
          <CardHeader>
            <div>
              <CardTitle>Step 4: Booking Summary & Final Review</CardTitle>
              <CardDescription>
                Verify customer allocation, pricing breakdown, and initial booking token
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Detail Grid */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 divide-y divide-slate-200 text-xs">
              <div className="py-2.5 first:pt-0 flex items-center justify-between">
                <span className="text-slate-500">Prospective Buyer:</span>
                <span className="font-semibold text-slate-900">{selectedLead?.name || 'Selected Customer'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Contact Details:</span>
                <span className="text-slate-700 font-mono">
                  {selectedLead?.phone || 'No phone'} • {selectedLead?.email || 'No email'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Project & Tower:</span>
                <span className="font-semibold text-slate-900">
                  {selectedUnit?.building?.project?.name || selectedProject?.name || 'Project'} (
                  {selectedUnit?.building?.name || selectedBuilding?.name || 'Tower'})
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Selected Unit:</span>
                <span className="font-mono font-bold text-brand-700">
                  Unit {selectedUnit?.unit_number || selectedUnit?.unitNumber} (
                  {selectedUnit?.unit_type || selectedUnit?.type}, {selectedUnit?.area} sq ft, Floor{' '}
                  {selectedUnit?.floor}th)
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
                label="Initial Booking Token Deposit (₹)"
                type="number"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(e.target.value)}
                helperText="Minimum recommended token is ₹2,00,000"
              />
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Formatted Preview:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {formatINR(parseFloat(bookingAmount) || 0)}
                </span>
              </div>
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
        onClose={() => !isSubmitting && setConfirmModalOpen(false)}
        title="Confirm Unit Allocation"
        description="Are you sure you want to finalize this unit reservation in MySQL?"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            You are about to book{' '}
            <strong className="text-slate-900">
              Unit {selectedUnit?.unit_number || selectedUnit?.unitNumber}
            </strong>{' '}
            for <strong className="text-slate-900">{selectedLead?.name}</strong>. The unit will be locked and
            marked as <strong>BOOKED</strong>.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Unit Price:</span>
              <span className="font-bold text-slate-900">{formatINR(selectedUnit?.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Token Amount:</span>
              <span className="font-bold text-emerald-700">{formatINR(parseFloat(bookingAmount) || 0)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmSubmit}
            >
              {isSubmitting ? 'Reserving...' : 'Commit & Book Unit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BookingCreatePage;
