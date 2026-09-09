import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import LeadForm from '../../components/leads/LeadForm';
import Button from '../../components/ui/Button';

export function LeadEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead } = useCrm();

  const lead = leads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Lead not found</h2>
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

  const handleUpdate = (data) => {
    updateLead(lead.id, data);
    navigate(`/leads/${lead.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div>
        <Link
          to={`/leads/${lead.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile: {lead.name}</span>
        </Link>

        <div className="mt-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Opportunity: {lead.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update contact information, property preferences, or stage assignments
          </p>
        </div>
      </div>

      {/* Form in Edit Mode */}
      <LeadForm initialData={lead} isEdit={true} onSubmit={handleUpdate} />
    </div>
  );
}

export default LeadEditPage;
