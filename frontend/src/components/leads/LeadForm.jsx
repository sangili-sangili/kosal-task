import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Home,
  Check,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { LEAD_STAGES, STAGE_CONFIG } from '../../mock/mockData';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';

export function LeadForm({ initialData = null, isEdit = false, onSubmit }) {
  const navigate = useNavigate();
  const { employees, projects } = useCrm();

  const defaultFollowupDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      city: 'Bangalore',
      stage: LEAD_STAGES.NEW,
      assignedToId: employees[0]?.id || '',
      preferredProject: projects[0]?.name || 'Prestige Falcon City',
      unitType: '3 BHK Grand',
      budget: '₹1.0 Cr - ₹1.5 Cr',
      source: 'Website',
      followupDate: defaultFollowupDate(),
      followupTime: '11:30 AM',
      priority: 'HIGH',
      notes: '',
    },
  });

  // Watched values for dynamic preview
  const watchedName = watch('name');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedProject = watch('preferredProject');
  const watchedBudget = watch('budget');
  const watchedStage = watch('stage');
  const watchedAssignedId = watch('assignedToId');
  const watchedPriority = watch('priority');
  const watchedUnitType = watch('unitType');

  const assignedRep = employees.find((e) => e.id === watchedAssignedId) || employees[0];
  const selectedProj = projects.find((p) => p.name === watchedProject) || projects[0];

  // Quick fill sample data for fast testing/evaluation
  const handleQuickFill = () => {
    setValue('name', 'Vikramaditya Singhania', { shouldValidate: true });
    setValue('email', 'vikram.singhania@apexcapital.in', { shouldValidate: true });
    setValue('phone', '+91 98450 88291', { shouldValidate: true });
    setValue('city', 'Bangalore (Indiranagar)');
    setValue('source', 'MagicBricks');
    setValue('preferredProject', projects[0]?.name || 'Prestige Falcon City');
    setValue('unitType', '3 BHK Grand');
    setValue('budget', '₹1.5 Cr - ₹2.5 Cr');
    setValue('stage', LEAD_STAGES.NEW);
    setValue('assignedToId', employees[0]?.id || '');
    setValue('followupDate', defaultFollowupDate());
    setValue('followupTime', '03:00 PM');
    setValue('priority', 'HIGH');
    setValue(
      'notes',
      'HNI client looking for high floor east-facing 3 BHK. Prefers Tower A with clubhouse view. Pre-approved HDFC loan ready.'
    );
  };

  const onFormSubmit = async (data) => {
    await onSubmit(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Form (8 cols on lg) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Quick Demo Fill Bar */}
        {!isEdit && (
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-brand-50 to-indigo-50/60 rounded-xl border border-brand-100 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Quick-Fill Enterprise Demo</p>
                <p className="text-[11px] text-slate-500">Prefill verified HNI prospect data with one click</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleQuickFill}
              className="bg-white border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold shadow-2xs"
            >
              Populate Sample Lead
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Section 1: Contact Information */}
          <Card className="shadow-subtle border-slate-200/90 overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contact Information
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Primary Contact Details</span>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prospect Full Name"
                  placeholder="e.g. Vikramaditya Singhania"
                  required
                  leftIcon={User}
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Minimum 2 characters required' },
                  })}
                />

                <Input
                  label="Contact Phone Number"
                  type="tel"
                  placeholder="+91 98450 12891"
                  required
                  leftIcon={Phone}
                  error={errors.phone?.message}
                  {...register('phone', {
                    required: 'Valid phone number is required',
                    pattern: {
                      value: /^[+]?[0-9\s-]{10,15}$/,
                      message: 'Enter a valid 10-digit phone number',
                    },
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Official Email Address"
                    type="email"
                    placeholder="vikram.s@apexcapital.in"
                    required
                    leftIcon={Mail}
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email address format',
                      },
                    })}
                  />
                </div>

                <Input
                  label="Current City / Location"
                  placeholder="e.g. Bangalore"
                  leftIcon={MapPin}
                  {...register('city')}
                />
              </div>

              <div>
                <Select
                  label="Lead Acquisition Source"
                  options={[
                    { value: 'Website', label: 'Official Developer Website Form' },
                    { value: 'MagicBricks', label: 'MagicBricks Real Estate Portal' },
                    { value: '99acres', label: '99acres Property Portal' },
                    { value: 'Housing.com', label: 'Housing.com Direct Inquiry' },
                    { value: 'Walk-in', label: 'Sales Experience Gallery Walk-in' },
                    { value: 'Referral', label: 'Existing Resident / HNI Referral' },
                    { value: 'Channel Partner', label: 'Registered Channel Partner / Broker' },
                  ]}
                  {...register('source')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Opportunity & Allocation */}
          <Card className="shadow-subtle border-slate-200/90 overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Requirements & Assignment
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Inventory & Stage Setup</span>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Preferred Development Project"
                  options={projects.map((p) => ({
                    value: p.name,
                    label: `${p.name} — ${p.city} (${p.startingPrice})`,
                  }))}
                  {...register('preferredProject')}
                />

                <Select
                  label="Target Typology"
                  options={[
                    { value: '2 BHK Luxury', label: '2 BHK Luxury (1,240 - 1,450 sq.ft)' },
                    { value: '3 BHK Grand', label: '3 BHK Grand (1,850 - 2,200 sq.ft)' },
                    { value: '4 BHK Signature', label: '4 BHK Signature (2,800 - 3,400 sq.ft)' },
                    { value: 'Penthouse / Sky Villa', label: 'Penthouse / Sky Villa (4,200+ sq.ft)' },
                    { value: 'Commercial / Retail', label: 'Commercial Retail / Office Suite' },
                  ]}
                  {...register('unitType')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Target Budget Bracket"
                  options={[
                    { value: '₹50 L - ₹75 L', label: '₹50 L - ₹75 L (Affordable)' },
                    { value: '₹75 L - ₹1.0 Cr', label: '₹75 L - ₹1.0 Cr' },
                    { value: '₹1.0 Cr - ₹1.5 Cr', label: '₹1.0 Cr - ₹1.5 Cr (Mid-Premium)' },
                    { value: '₹1.5 Cr - ₹2.5 Cr', label: '₹1.5 Cr - ₹2.5 Cr (Premium)' },
                    { value: '₹2.5 Cr - ₹5.0 Cr', label: '₹2.5 Cr - ₹5.0 Cr (Luxury HNI)' },
                    { value: '₹5.0 Cr+', label: '₹5.0 Cr+ (Ultra High Net Worth)' },
                  ]}
                  {...register('budget')}
                />

                <Select
                  label="Initial Pipeline Stage"
                  options={Object.values(LEAD_STAGES).map((st) => ({
                    value: st,
                    label: `${STAGE_CONFIG[st].label} — Stage ${st}`,
                  }))}
                  {...register('stage')}
                />
              </div>

              <div>
                <Select
                  label="Assigned Sales Representative"
                  options={employees.map((e) => ({
                    value: e.id,
                    label: `${e.name} — ${e.title} (${e.assignedProjects?.[0] || 'All Projects'})`,
                  }))}
                  {...register('assignedToId')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Next Touchpoint & Notes */}
          <Card className="shadow-subtle border-slate-200/90 overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Initial Touchpoint & SLA
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">First Action Schedule</span>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Follow-up Date"
                  type="date"
                  leftIcon={Calendar}
                  {...register('followupDate')}
                />

                <Input
                  label="Follow-up Time"
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  leftIcon={Clock}
                  {...register('followupTime')}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {['HIGH', 'MEDIUM', 'LOW'].map((p) => {
                      const isSelected = watchedPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setValue('priority', p)}
                          className={`py-2 px-1 text-center text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? p === 'HIGH'
                                ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs ring-1 ring-rose-300'
                                : p === 'MEDIUM'
                                ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-xs ring-1 ring-amber-300'
                                : 'bg-slate-100 border-slate-400 text-slate-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Textarea
                label={isEdit ? 'Update Notes' : 'Client Requirements / Discussion Log'}
                placeholder="e.g. Looking for high floor 3 BHK with 2 covered car parking slots. Prefers east-facing entrance with unobstructed green views..."
                rows={3}
                {...register('notes')}
              />
            </CardContent>

            <CardFooter className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={Send}
                className="shadow-sm"
              >
                {isEdit ? 'Update Opportunity' : 'Create Opportunity'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

      {/* Right Column: Dynamic Live Preview & Enterprise SLA Cards (4 cols on lg) */}
      <div className="lg:col-span-4 space-y-5">
        {/* Dynamic Opportunity Live Preview Card */}
        <Card className="border-slate-200/90 shadow-subtle overflow-hidden sticky top-20">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-400" />
                Live Opportunity Preview
              </span>
              <Badge
                variant={
                  watchedPriority === 'HIGH'
                    ? 'danger'
                    : watchedPriority === 'MEDIUM'
                    ? 'warning'
                    : 'default'
                }
                size="xs"
              >
                {watchedPriority || 'MEDIUM'}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5 truncate">
              {watchedName || 'Prospect Name Pending'}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {watch('city') || 'Location Unspecified'}
            </p>
          </div>

          <div className="p-4 space-y-3.5 text-xs">
            {/* Contact Snapshot */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{watchedPhone || '+91 ••••• •••••'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{watchedEmail || 'email@domain.com'}</span>
              </div>
            </div>

            {/* Target Property & Budget */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Target Project:</span>
                <span className="font-semibold text-slate-900 text-right truncate max-w-[170px]">
                  {watchedProject || selectedProj?.name || 'Prestige Falcon City'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Typology:</span>
                <span className="font-medium text-slate-800">{watchedUnitType || '3 BHK Grand'}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Budget Range:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {watchedBudget || '₹1.0 Cr - ₹1.5 Cr'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Pipeline Stage:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {watchedStage ? STAGE_CONFIG[watchedStage]?.label : 'New Lead'}
                </span>
              </div>
            </div>

            {/* Assigned Executive */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-1.5">Assigned Opportunity Owner</p>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {assignedRep?.name?.[0] || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{assignedRep?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{assignedRep?.title}</p>
                </div>
              </div>
            </div>

            {/* SLA Badge */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Enterprise First-Touch SLA</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                Initial outreach must be logged within <strong>15 minutes</strong> of intake. Scheduled follow-up: {watch('followupTime') || '11:30 AM'}.
              </p>
            </div>
          </div>
        </Card>

        {/* Lead Automation Routing Card */}
        <Card className="border-slate-200/90 shadow-subtle p-4 space-y-2.5 bg-white">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated Intake Workflows</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-500">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Instant WhatsApp & SMS introduction trigger</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Project brochure auto-delivery to email</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Round-robin executive capacity balancing</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default LeadForm;
