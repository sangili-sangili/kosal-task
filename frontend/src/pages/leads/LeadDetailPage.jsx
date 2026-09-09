import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { LEAD_STAGES, STAGE_CONFIG, UNIT_STATUS } from '../../mock/mockData';
import { formatCRMDate, formatINRCompact } from '../../utils/crmFormatters';
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
  const {
    leads,
    units,
    updateLeadStage,
    addLeadNote,
    scheduleFollowup,
    completeFollowup,
    currentUser,
  } = useCrm();

  const lead = leads.find((l) => l.id === id);

  // Modal States
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(lead?.stage || LEAD_STAGES.NEW);

  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    date: '2026-09-10',
    time: '11:00 AM',
    note: '',
    priority: 'HIGH',
  });

  // New Note input state
  const [newNoteText, setNewNoteText] = useState('');

  // Toast feedback
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!lead) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Lead not found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested lead ID does not exist.</p>
        <div className="mt-4">
          <Link to="/leads">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Back to Leads List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Recommended units for this lead's preferred project
  const recommendedUnits = units.filter(
    (u) => u.projectName === lead.preferredProject && u.status === UNIT_STATUS.AVAILABLE
  );

  const handleStageChangeSubmit = () => {
    updateLeadStage(lead.id, selectedStage);
    setStageModalOpen(false);
    showFeedback(`Stage updated to ${STAGE_CONFIG[selectedStage]?.label || selectedStage}`);
  };

  const handleFollowupSubmit = (e) => {
    e.preventDefault();
    scheduleFollowup(lead.id, followupData);
    setFollowupModalOpen(false);
    showFeedback('Follow-up successfully scheduled!');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addLeadNote(lead.id, newNoteText.trim());
    setNewNoteText('');
    showFeedback('Note logged to customer timeline.');
  };

  const handleCompleteFollowup = () => {
    completeFollowup(lead.id);
    showFeedback('Follow-up marked as completed!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Back Navigation & Breadcrumb */}
      <div>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Leads</span>
        </Link>
      </div>

      {/* Lead Profile Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-subtle">
            {lead.name[0]}
          </div>

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
                <span className="font-mono">{lead.phone}</span>
              </a>
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{lead.email}</span>
              </a>
              <span className="text-slate-400">•</span>
              <span>
                Owner: <strong className="text-slate-800">{lead.assignedToName}</strong>
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
            Schedule Call
          </Button>
          <Link to={`/leads/${lead.id}/edit`}>
            <Button variant="secondary" size="sm" leftIcon={Edit2}>
              Edit
            </Button>
          </Link>
          <Link to={`/bookings/create?leadId=${lead.id}`}>
            <Button variant="primary" size="sm" leftIcon={BookmarkCheck}>
              Book Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details, Timeline, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Opportunity Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity & Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Preferred Project
                  </span>
                  <div className="font-medium text-slate-900 mt-1">{lead.preferredProject}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Budget Bracket
                  </span>
                  <div className="font-medium text-slate-900 mt-1">{lead.budget}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Lead Source
                  </span>
                  <div className="font-medium text-slate-900 mt-1">{lead.source}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Inquiry Date
                  </span>
                  <div className="font-medium text-slate-900 mt-1">
                    {formatCRMDate(lead.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <CardTitle>Activity Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(lead.activities || []).map((act, idx) => (
                  <div key={act.id || idx} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                    <div className="text-xs font-semibold text-slate-900">{act.text}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{act.time}</span>
                      <span>•</span>
                      <span>By {act.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <CardTitle>Sales Notes & Discussion Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5">
                <Textarea
                  placeholder="Type a new update, call takeaway, or requirement change..."
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
                    disabled={!newNoteText.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </form>

              {/* Existing Notes List */}
              <div className="space-y-3 pt-2 divide-y divide-slate-100">
                {(lead.notes || []).length > 0 ? (
                  lead.notes.map((note) => (
                    <div key={note.id} className="pt-3 first:pt-0">
                      <p className="text-xs text-slate-800 leading-relaxed">{note.text}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600">{note.author}</span>
                        <span>•</span>
                        <span>{formatCRMDate(note.date)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">
                    No notes recorded yet. Add the first interaction note above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Follow-up, Agent Info, Inventory */}
        <div className="space-y-6">
          {/* Active Follow-up Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Next Scheduled Touchpoint</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.followupDate ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCRMDate(lead.followupDate)}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {lead.followupTime || '11:00 AM'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lead.followupNote || 'General check-in call regarding property requirements.'}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span
                      className={
                        lead.priority === 'HIGH'
                          ? 'priority-high'
                          : lead.priority === 'MEDIUM'
                          ? 'priority-medium'
                          : 'priority-low'
                      }
                    >
                      {lead.priority} Priority
                    </span>

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={handleCompleteFollowup}
                      leftIcon={CheckCircle2}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 space-y-2">
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
                  {lead.assignedToName?.[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{lead.assignedToName}</div>
                  <div className="text-[11px] text-slate-500">Dedicated Property Consultant</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Available Inventory in Preferred Project */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Matching Units</CardTitle>
                <CardDescription>Available in {lead.preferredProject}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recommendedUnits.slice(0, 3).map((unit) => (
                <div
                  key={unit.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 font-mono">
                      {unit.buildingName} • {unit.unitNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {unit.type} • {unit.area} sq ft • {formatINRCompact(unit.price)}
                    </div>
                  </div>

                  <Link to={`/bookings/create?leadId=${lead.id}&unitId=${unit.id}`}>
                    <Button variant="secondary" size="xs">
                      Book
                    </Button>
                  </Link>
                </div>
              ))}

              {recommendedUnits.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  No currently available units in {lead.preferredProject}.
                </p>
              )}

              <Link to="/units" className="block pt-1">
                <Button variant="ghost" size="xs" className="w-full text-slate-600">
                  Browse All Units
                </Button>
              </Link>
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
              label: STAGE_CONFIG[st].label,
            }))}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStageModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleStageChangeSubmit}>
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
        description="Set a reminder for the next call or meeting."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFollowupSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={followupData.date}
              onChange={(e) => setFollowupData({ ...followupData, date: e.target.value })}
            />
            <Input
              label="Time"
              type="text"
              placeholder="e.g. 11:30 AM"
              required
              value={followupData.time}
              onChange={(e) => setFollowupData({ ...followupData, time: e.target.value })}
            />
          </div>

          <Select
            label="Priority"
            value={followupData.priority}
            onChange={(e) => setFollowupData({ ...followupData, priority: e.target.value })}
            options={[
              { value: 'HIGH', label: 'High Priority' },
              { value: 'MEDIUM', label: 'Medium Priority' },
              { value: 'LOW', label: 'Low Priority' },
            ]}
          />

          <Textarea
            label="Agenda / Notes"
            placeholder="e.g. Price discussion, floor plan review, loan sanction..."
            rows={2}
            value={followupData.note}
            onChange={(e) => setFollowupData({ ...followupData, note: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setFollowupModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LeadDetailPage;
