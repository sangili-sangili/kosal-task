import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { leadService } from '../../services/leadService';
import LeadForm from '../../components/leads/LeadForm';
import Button from '../../components/ui/Button';

export function LeadEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLead = async () => {
      setLoading(true);
      setError(null);
      try {
        const leadData = await leadService.getLeadById(id);
        if (isMounted) {
          setLead(leadData);
        }
      } catch (err) {
        console.error('Failed to load lead for edit:', err);
        if (isMounted) {
          setError(err.message || 'Lead not found');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchLead();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdate = async (data) => {
    setSubmitError(null);
    try {
      const payload = {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim() || undefined,
        source: data.source || 'Website',
        stage: data.stage,
        assigned_to: data.assigned_to ? parseInt(data.assigned_to, 10) : undefined,
        follow_up_date: data.follow_up_date || undefined,
      };

      await leadService.updateLead(id, payload);

      if (data.notes?.trim()) {
        try {
          await leadService.addNote(id, data.notes.trim());
        } catch (noteErr) {
          console.error('Note creation warning:', noteErr);
        }
      }

      navigate(`/leads/${id}`);
    } catch (err) {
      console.error('Failed to update lead:', err);
      setSubmitError(err.message || 'Failed to save changes');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading lead details for editing...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Lead Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested lead does not exist.'}</p>
        <div className="mt-4">
          <Link to="/leads">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Back to Leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div>
        <Link
          to={`/leads/${lead.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Profile: {lead.name}</span>
        </Link>

        <div className="mt-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Opportunity: {lead.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update contact information, pipeline stages, or sales representative assignments
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form in Edit Mode */}
      <LeadForm initialData={lead} isEdit={true} onSubmit={handleUpdate} />
    </div>
  );
}

export default LeadEditPage;
