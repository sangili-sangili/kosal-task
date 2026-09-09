import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Clock,
  Phone,
  Mail,
  Building2,
  DollarSign,
  BookmarkCheck,
  CheckCircle2,
  MessageSquare,
  History,
  AlertCircle,
  Plus,
  Send,
  User,
  Shield,
  Layers,
  Check,
} from 'lucide-react';
import { leadService } from '../../services/leadService';
import { LEAD_STAGES, STAGE_CONFIG } from '../../constants/crmConstants';
import { formatCRMDate } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

export function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dynamic Data State
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '11:00 AM',
    note: '',
    priority: 'HIGH',
  });
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // New Note input state
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Completing Followup State
  const [isCompletingFollowup, setIsCompletingFollowup] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Load Lead details, notes, and followups from DB
  const loadLeadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadData, notesData, followupsData] = await Promise.all([
        leadService.getLeadById(id),
        leadService.getNotes(id).catch(() => []),
        leadService.getFollowups(id).catch(() => []),
      ]);
      setLead(leadData);
      setSelectedStage(leadData?.stage || LEAD_STAGES.NEW);
      setNotes(Array.isArray(notesData) ? notesData : []);
      setFollowups(Array.isArray(followupsData) ? followupsData : []);
    } catch (err) {
      console.error('Failed to load lead details:', err);
      setError(err.message || 'Failed to retrieve lead data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLeadDetails();
  }, [loadLeadDetails]);

  // Stage update handler
  const handleStageChangeSubmit = async () => {
    if (!selectedStage) return;
    setIsUpdatingStage(true);
    try {
      const updated = await leadService.updateLeadStage(id, selectedStage);
      setLead((prev) => ({ ...prev, stage: updated?.stage || selectedStage }));
      setStageModalOpen(false);
      showFeedback(`Stage updated to ${STAGE_CONFIG[selectedStage]?.label || selectedStage}`);
    } catch (err) {
      showFeedback(err.message || 'Failed to update stage', 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Follow-up scheduling handler
  const handleFollowupSubmit = async (e) => {
    e.preventDefault();
    if (!followupData.date) return;
    setIsSubmittingFollowup(true);
    try {
      const payload = {
        follow_up_date: followupData.date,
        remarks: followupData.note?.trim() || 'Follow-up interaction call',
        assigned_to: lead?.assigned_to || undefined,
      };
      await leadService.scheduleFollowup(id, payload);
      setFollowupModalOpen(false);
      showFeedback('Follow-up successfully scheduled and logged to database!');
      // Reload followups & lead
      const [updatedFollowups, updatedLead] = await Promise.all([
        leadService.getFollowups(id),
        leadService.getLeadById(id),
      ]);
      setFollowups(Array.isArray(updatedFollowups) ? updatedFollowups : []);
      if (updatedLead) setLead(updatedLead);
    } catch (err) {
      showFeedback(err.message || 'Failed to schedule follow-up', 'error');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  // Add note handler
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      await leadService.addNote(id, newNoteText.trim());
      setNewNoteText('');
      showFeedback('Note logged to customer timeline.');
      const updatedNotes = await leadService.getNotes(id);
      setNotes(Array.isArray(updatedNotes) ? updatedNotes : []);
    } catch (err) {
      showFeedback(err.message || 'Failed to add note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Complete follow-up handler
  const handleCompleteFollowup = async (followupId) => {
    if (!followupId) return;
    setIsCompletingFollowup(true);
    try {
      await leadService.updateFollowupStatus(id, followupId, { status: 'COMPLETED' });
      showFeedback('Follow-up marked as completed!');
      const [updatedFollowups, updatedLead] = await Promise.all([
        leadService.getFollowups(id),
        leadService.getLeadById(id),
      ]);
      setFollowups(Array.isArray(updatedFollowups) ? updatedFollowups : []);
      if (updatedLead) setLead(updatedLead);
    } catch (err) {
      showFeedback(err.message || 'Failed to update follow-up', 'error');
    } finally {
      setIsCompletingFollowup(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading customer profile from database...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lead Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'The requested lead ID does not exist or you do not have permission to view it.'}
          </p>
        </div>
        <div>
          <Link to="/leads">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Back to Leads List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Active / next scheduled pending follow-up
  const pendingFollowups = followups.filter((f) => f.status === 'PENDING');
  const activeFollowup = pendingFollowups[0] || null;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Back Navigation & Breadcrumb */}
      <div>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to All Leads</span>
        </Link>
      </div>

      {/* Lead Profile Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {lead.avatar ? (
            <img
              src={lead.avatar}
              alt={lead.name}
              className="w-12 h-12 rounded-2xl object-cover shadow-subtle border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-subtle">
              {lead.name ? lead.name[0].toUpperCase() : 'L'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {lead.name}
              </h1>
              <span className={STAGE_CONFIG[lead.stage]?.badgeClass || 'badge-new'}>
                {STAGE_CONFIG[lead.stage]?.label || lead.stage}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{lead.phone || '—'}</span>
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.email}</span>
                </a>
              )}
              <span className="text-slate-300">•</span>
              <span>
                Owner:{' '}
                <strong className="text-slate-800">
                  {lead.assignedSalesEmployee?.name || lead.assignedToName || 'Unassigned'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStageModalOpen(true)}
          >
            Change Stage
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFollowupModalOpen(true)}
            leftIcon={Calendar}
          >
            Schedule Touchpoint
          </Button>
          <Link to={`/leads/${lead.id}/edit`}>
            <Button variant="secondary" size="sm" leftIcon={Edit2}>
              Edit Details
            </Button>
          </Link>
          <Link to={`/bookings/create?leadId=${lead.id}`}>
            <Button variant="primary" size="sm" leftIcon={BookmarkCheck} className="shadow-xs">
              Book Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details & Notes Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Details */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Lead Source
                  </span>
                  <div className="font-medium text-slate-900 mt-1">{lead.source || 'Direct Walk-in'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Pipeline Stage
                  </span>
                  <div className="font-medium text-slate-900 mt-1">
                    {STAGE_CONFIG[lead.stage]?.label || lead.stage}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Next Follow-up
                  </span>
                  <div className="font-medium text-slate-900 mt-1">
                    {formatCRMDate(lead.follow_up_date || lead.followupDate)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Created At
                  </span>
                  <div className="font-medium text-slate-900 mt-1">
                    {formatCRMDate(lead.created_at || lead.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <CardTitle>Interaction Notes & Discussion Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5">
                <Textarea
                  placeholder="Record customer discussion, site visit feedback, or requirement updates..."
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    leftIcon={Send}
                    disabled={!newNoteText.trim() || isSubmittingNote}
                    isLoading={isSubmittingNote}
                  >
                    Add Note
                  </Button>
                </div>
              </form>

              {/* Existing Notes List */}
              <div className="space-y-3 pt-2 divide-y divide-slate-100">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="pt-3 first:pt-0">
                      <p className="text-xs text-slate-800 leading-relaxed">{note.note || note.text}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600">
                          {note.author?.name || note.user?.name || note.author || 'Sales Representative'}
                        </span>
                        <span>•</span>
                        <span>{formatCRMDate(note.created_at || note.createdAt || note.date)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-5">
                    No notes recorded yet. Add the first interaction note above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Follow-up Touchpoint, Agent, Schedule */}
        <div className="space-y-6">
          {/* Active Follow-up Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Next Scheduled Touchpoint</CardTitle>
            </CardHeader>
            <CardContent>
              {activeFollowup ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCRMDate(activeFollowup.follow_up_date)}
                    </span>
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {activeFollowup.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeFollowup.remarks || 'Scheduled customer check-in call.'}
                  </p>

                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleCompleteFollowup(activeFollowup.id)}
                      leftIcon={CheckCircle2}
                      isLoading={isCompletingFollowup}
                    >
                      Mark Completed
                    </Button>
                  </div>
                </div>
              ) : lead.follow_up_date ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCRMDate(lead.follow_up_date)}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Next follow-up touchpoint date from customer intake.
                  </p>
                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setFollowupModalOpen(true)}
                      leftIcon={Calendar}
                    >
                      Reschedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-500">No upcoming follow-up scheduled.</p>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setFollowupModalOpen(true)}
                    leftIcon={Calendar}
                  >
                    Schedule Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Agent Card */}
          <Card>
            <CardHeader>
              <CardTitle>Relationship Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                  {lead.assignedSalesEmployee?.name?.[0] || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {lead.assignedSalesEmployee?.name || lead.assignedToName || 'Unassigned'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lead.assignedSalesEmployee?.email || 'Dedicated Property Consultant'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stage Change Modal */}
      <Modal
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        title="Update Lead Stage"
        description="Advance or change the customer status in the sales funnel."
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <Select
            label="Stage"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            options={Object.values(LEAD_STAGES).map((st) => ({
              value: st,
              label: STAGE_CONFIG[st]?.label || st,
            }))}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStageModalOpen(false)}
              disabled={isUpdatingStage}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStageChangeSubmit}
              isLoading={isUpdatingStage}
            >
              Save Stage
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={followupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        title="Schedule Customer Touchpoint"
        description="Set a reminder for the next customer interaction in the database."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFollowupSubmit} className="space-y-3.5">
          <Input
            label="Follow-up Date"
            type="date"
            required
            value={followupData.date}
            onChange={(e) => setFollowupData({ ...followupData, date: e.target.value })}
          />

          <Textarea
            label="Agenda / Remarks"
            placeholder="e.g. Discuss unit availability, pricing discount, or contract signing..."
            rows={2}
            value={followupData.note}
            onChange={(e) => setFollowupData({ ...followupData, note: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFollowupModalOpen(false)}
              disabled={isSubmittingFollowup}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingFollowup}
            >
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LeadDetailPage;
