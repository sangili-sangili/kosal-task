import React, { useState, useEffect } from 'react';
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
import { leadService } from '../../services/leadService';
import { LEAD_STAGES, STAGE_CONFIG } from '../../constants/crmConstants';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';

export function LeadForm({ initialData = null, isEdit = false, onSubmit }) {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const defaultFollowupDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Load active sales reps & projects from DB
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [usersData, projectsData] = await Promise.all([
          leadService.getUsers().catch(() => []),
          leadService.getProjects().catch(() => []),
        ]);
        if (isMounted) {
          setEmployees(Array.isArray(usersData) ? usersData : []);
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
      } catch (err) {
        console.error('Failed to load users/projects for LeadForm:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          source: initialData.source || 'Website',
          stage: initialData.stage || LEAD_STAGES.NEW,
          assigned_to: initialData.assigned_to || initialData.assignedSalesEmployee?.id || '',
          follow_up_date: initialData.follow_up_date || initialData.followupDate || defaultFollowupDate(),
          notes: '',
        }
      : {
          name: '',
          email: '',
          phone: '',
          source: 'Website',
          stage: LEAD_STAGES.NEW,
          assigned_to: '',
          follow_up_date: defaultFollowupDate(),
          notes: '',
        },
  });

  // Watched values for live preview
  const watchedName = watch('name');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedSource = watch('source');
  const watchedStage = watch('stage');
  const watchedAssignedId = watch('assigned_to');
  const watchedFollowupDate = watch('follow_up_date');

  const assignedRep =
    employees.find((e) => String(e.id) === String(watchedAssignedId)) || employees[0];

  // Quick fill demo data for testing
  const handleQuickFill = () => {
    setValue('name', 'Vikramaditya Singhania', { shouldValidate: true });
    setValue('email', 'vikram.singhania@apexcapital.in', { shouldValidate: true });
    setValue('phone', '+919845088291', { shouldValidate: true });
    setValue('source', 'Website');
    setValue('stage', LEAD_STAGES.NEW);
    if (employees.length > 0) {
      setValue('assigned_to', String(employees[0].id));
    }
    setValue('follow_up_date', defaultFollowupDate());
    setValue(
      'notes',
      'HNI client looking for 3 BHK luxury residence. Pre-approved HDFC loan ready.'
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
                <p className="text-xs font-semibold text-slate-800">Quick-Fill Sample Prospect</p>
                <p className="text-[11px] text-slate-500">Prefill verified prospect data with one click</p>
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
              <span className="text-[11px] font-medium text-slate-400">Primary Details</span>
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
                  placeholder="+919845012891"
                  required
                  leftIcon={Phone}
                  error={errors.phone?.message}
                  {...register('phone', {
                    required: 'Valid phone number is required',
                    pattern: {
                      value: /^[+]?[0-9\s-]{5,25}$/,
                      message: 'Enter a valid phone number (at least 5 digits)',
                    },
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Email Address"
                  type="email"
                  placeholder="vikram.s@apexcapital.in"
                  leftIcon={Mail}
                  error={errors.email?.message}
                  {...register('email', {
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Enter a valid email address format',
                    },
                  })}
                />

                <Select
                  label="Lead Acquisition Source"
                  options={[
                    { value: 'Website', label: 'Website Inquiry' },
                    { value: 'MagicBricks', label: 'MagicBricks Portal' },
                    { value: '99acres', label: '99acres Property Portal' },
                    { value: 'Housing.com', label: 'Housing.com Direct' },
                    { value: 'Walk-in', label: 'Sales Gallery Walk-in' },
                    { value: 'Referral', label: 'Existing Resident Referral' },
                    { value: 'Channel Partner', label: 'Channel Partner / Broker' },
                  ]}
                  {...register('source')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Pipeline Stage & Assignment */}
          <Card className="shadow-subtle border-slate-200/90 overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pipeline & Assignment
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Sales Funnel Setup</span>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Initial Pipeline Stage"
                  options={Object.values(LEAD_STAGES).map((st) => ({
                    value: st,
                    label: `${STAGE_CONFIG[st]?.label || st} (${st})`,
                  }))}
                  {...register('stage')}
                />

                <Select
                  label="Assigned Sales Representative"
                  placeholder="Select representative"
                  options={employees.map((e) => ({
                    value: String(e.id),
                    label: `${e.name} (${e.role})`,
                  }))}
                  {...register('assigned_to')}
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
                  Follow-up & Discussion Notes
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Interaction Details</span>
            </div>

            <CardContent className="p-5 space-y-4">
              <div>
                <Input
                  label="Initial Follow-up Date"
                  type="date"
                  leftIcon={Calendar}
                  {...register('follow_up_date')}
                />
              </div>

              <Textarea
                label={isEdit ? 'Additional Notes' : 'Interaction Notes / Discussion Log'}
                placeholder="Record customer preferences, site visit notes, or initial requirements..."
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
                {isEdit ? 'Update Lead Details' : 'Create Opportunity'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

      {/* Right Column: Dynamic Live Preview Card (4 cols on lg) */}
      <div className="lg:col-span-4 space-y-5">
        <Card className="border-slate-200/90 shadow-subtle overflow-hidden sticky top-20">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-400" />
                Live Opportunity Preview
              </span>
              <Badge variant="brand" size="xs">
                {watchedStage ? STAGE_CONFIG[watchedStage]?.label : 'NEW'}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5 truncate">
              {watchedName || 'Prospect Name Pending'}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              Source: {watchedSource || 'Website'}
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
                <span className="truncate">{watchedEmail || 'No email provided'}</span>
              </div>
            </div>

            {/* Stage & Touchpoint */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Pipeline Stage:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {watchedStage ? STAGE_CONFIG[watchedStage]?.label : 'New Lead'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Scheduled Follow-up:</span>
                <span className="font-semibold text-slate-800">
                  {watchedFollowupDate || 'None scheduled'}
                </span>
              </div>
            </div>

            {/* Assigned Executive */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-1.5">Assigned Opportunity Owner</p>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {assignedRep?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {assignedRep?.name || 'Unassigned'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {assignedRep?.email || 'Sales Consultant'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LeadForm;
