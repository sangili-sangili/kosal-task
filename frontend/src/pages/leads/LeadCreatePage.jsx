import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Sparkles, Shield, Clock, AlertCircle } from 'lucide-react';
import { leadService } from '../../services/leadService';
import LeadForm from '../../components/leads/LeadForm';
import Badge from '../../components/ui/Badge';

export function LeadCreatePage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const handleCreate = async (data) => {
    setSubmitError(null);
    try {
      const payload = {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim() || undefined,
        source: data.source || 'Website',
        stage: data.stage || 'NEW',
        assigned_to: data.assigned_to ? parseInt(data.assigned_to, 10) : undefined,
        follow_up_date: data.follow_up_date || undefined,
        avatar: data.avatar || undefined,
      };

      const created = await leadService.createLead(payload);
      const leadId = created?.id;

      // If initial notes were provided, log them to the lead thread
      if (leadId && data.notes?.trim()) {
        try {
          await leadService.addNote(leadId, data.notes.trim());
        } catch (noteErr) {
          console.error('Note creation warning:', noteErr);
        }
      }

      if (leadId) {
        navigate(`/leads/${leadId}`);
      } else {
        navigate('/leads');
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
      setSubmitError(err.message || 'Failed to create lead in database');
      throw err;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <Link
            to="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to All Leads</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Create New Opportunity
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Register a prospective client into the live sales funnel with automated rep assignment
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="brand" size="sm" className="font-semibold gap-1">
            <Sparkles className="w-3 h-3" />
            Live MySQL Connected
          </Badge>
          <Badge variant="default" size="sm" className="gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Instant Ingestion
          </Badge>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form with 2-column layout and live preview */}
      <LeadForm isEdit={false} onSubmit={handleCreate} />
    </div>
  );
}

export default LeadCreatePage;
