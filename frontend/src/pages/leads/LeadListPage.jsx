import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Clock,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { leadService } from '../../services/leadService';
import { LEAD_STAGES, STAGE_CONFIG } from '../../constants/crmConstants';
import { formatCRMDate } from '../../utils/crmFormatters';
import { exportLeadsToExcel } from '../../utils/excelExport';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export function LeadListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const initialStage = searchParams.get('stage') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState(initialStage);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Dynamic Data State
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dropdown Options from DB
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  // Modal States
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stageModalLead, setStageModalLead] = useState(null);
  const [newSelectedStage, setNewSelectedStage] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Fixed Floating Action Menu State
  const [activeActionMenu, setActiveActionMenu] = useState(null); // { id, lead, top, left, openUpward }

  // Feedback Toast
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Close floating action menu on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (activeActionMenu) setActiveActionMenu(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeActionMenu]);

  // Load active sales reps & projects on mount
  useEffect(() => {
    let isMounted = true;
    const loadFilterOptions = async () => {
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
        console.error('Failed to load filter options:', err);
      }
    };
    loadFilterOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Leads dynamically from live backend
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        stage: stageFilter || undefined,
        assigned_to: employeeFilter || undefined,
        sort: sortBy || 'created_at',
        order: sortOrder || 'DESC',
      };
      const res = await leadService.getLeads(params);
      const fetchedLeads = res.leads || [];
      setLeads(fetchedLeads);
      if (res.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page,
          limit: pageSize,
          total: fetchedLeads.length,
          totalPages: Math.max(1, Math.ceil(fetchedLeads.length / pageSize)),
        });
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError(err.message || 'Failed to load leads from server');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, stageFilter, employeeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStageFilter('');
    setEmployeeFilter('');
    setProjectFilter('');
    setSearchParams({});
    setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  // Export to Excel handler
  const handleExportToExcel = () => {
    if (!leads || leads.length === 0) {
      showFeedback('No leads available to export.', 'error');
      return;
    }
    try {
      exportLeadsToExcel(leads);
      showFeedback(`Successfully exported ${leads.length} leads to Excel (.csv)!`);
    } catch (err) {
      console.error('Export failed:', err);
      showFeedback('Failed to export leads to Excel.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await leadService.deleteLead(leadToDelete.id);
      showFeedback(`Lead "${leadToDelete.name}" deleted successfully.`);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete lead', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStageChangeSubmit = async () => {
    if (!stageModalLead || !newSelectedStage) return;
    setIsUpdatingStage(true);
    try {
      await leadService.updateLeadStage(stageModalLead.id, newSelectedStage);
      showFeedback(
        `Lead stage updated to ${STAGE_CONFIG[newSelectedStage]?.label || newSelectedStage}.`
      );
      setStageModalLead(null);
      fetchLeads();
    } catch (err) {
      showFeedback(err.message || 'Failed to update stage', 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const hasActiveFilters = Boolean(searchTerm || stageFilter || employeeFilter || projectFilter);

  // Avatar gradient generator
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'from-indigo-600 to-blue-500',
      'from-emerald-600 to-teal-500',
      'from-purple-600 to-indigo-500',
      'from-rose-600 to-pink-500',
      'from-amber-600 to-orange-500',
      'from-cyan-600 to-blue-500',
    ];
    const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
    return gradients[charCode % gradients.length];
  };

  // Source pill style generator
  const getSourceStyle = (src = '') => {
    const s = src.toLowerCase();
    if (s.includes('website')) return 'bg-sky-50 text-sky-700 border-sky-200/80';
    if (s.includes('walk-in')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (s.includes('referral')) return 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (s.includes('magic') || s.includes('99acres') || s.includes('housing'))
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (s.includes('channel')) return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    if (s.includes('social')) return 'bg-pink-50 text-pink-700 border-pink-200/80';
    return 'bg-slate-100 text-slate-700 border-slate-200/80';
  };

  // Stage indicator dot colors
  const stageDotColors = {
    NEW: 'bg-sky-500',
    CONTACTED: 'bg-blue-500',
    SITE_VISIT: 'bg-amber-500',
    INTERESTED: 'bg-purple-500',
    NEGOTIATION: 'bg-orange-500',
    BOOKED: 'bg-emerald-500',
    LOST: 'bg-rose-500',
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'name',
      title: 'Customer Details',
      sortable: true,
      render: (_, row) => (
        <div
          onClick={() => navigate(`/leads/${row.id}`)}
          className="cursor-pointer group flex items-center gap-3 text-left py-0.5"
        >
          {row.avatar ? (
            <img
              src={row.avatar}
              alt={row.name}
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                row.name
              )} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
            >
              {row.name ? row.name[0].toUpperCase() : 'L'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-xs sm:text-sm truncate">
              {row.name}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[210px]">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{row.email || 'No email registered'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (phone) => (
        <div className="flex items-center">
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80 px-2 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
            <Phone className="w-3 h-3 text-slate-400" />
            {phone || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'stage',
      title: 'Stage',
      render: (stage, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setStageModalLead(row);
            setNewSelectedStage(stage);
          }}
          className={`${
            STAGE_CONFIG[stage]?.badgeClass || 'badge-new'
          } hover:opacity-85 transition-all cursor-pointer text-left shadow-2xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold`}
          title="Click to advance or change stage"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              stageDotColors[stage] || 'bg-slate-400'
            } animate-pulse`}
          />
          <span>{STAGE_CONFIG[stage]?.label || stage}</span>
        </button>
      ),
    },
    {
      key: 'assignedSalesEmployee',
      title: 'Assigned Representative',
      sortable: false,
      render: (_, row) => {
        const repName = row.assignedSalesEmployee?.name || row.assignedToName || 'Unassigned';
        const repRole = row.assignedSalesEmployee?.role || 'Sales Rep';
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200/80 shrink-0">
              {repName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{repName}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{repRole}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'follow_up_date',
      title: 'Next Follow-up',
      render: (_, row) => {
        const date = row.follow_up_date || row.followupDate;
        if (!date) return <span className="text-slate-400 text-xs font-medium">—</span>;
        const isOverdue = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
        return (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isOverdue
                ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200'
                : 'text-slate-700'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>{formatCRMDate(date)}</span>
          </div>
        );
      },
    },
    {
      key: 'source',
      title: 'Source',
      render: (source) => (
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border shadow-2xs inline-block ${getSourceStyle(
            source
          )}`}
        >
          {source || 'Walk-in'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (_, row) => (
        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeActionMenu?.id === row.id) {
                setActiveActionMenu(null);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              const menuHeight = 185;
              const spaceBelow = window.innerHeight - rect.bottom;
              const openUpward = spaceBelow < menuHeight;

              setActiveActionMenu({
                id: row.id,
                lead: row,
                top: openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
                left: Math.max(12, rect.right - 180),
                openUpward,
              });
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

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

      {/* Page Header with Export Excel & Add Lead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Leads Directory</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80">
              {pagination.total || leads.length} Records
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time management of prospective home buyers, sales pipeline stages, and follow-ups
          </p>
        </div>

        {/* Action Buttons: Export Excel + Add Lead */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={Download}
            onClick={handleExportToExcel}
            className="border-emerald-300/80 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 font-semibold shadow-2xs transition-all"
            title="Download formatted Excel spreadsheet of leads"
          >
            Export Excel
          </Button>

          <Link to="/leads/create">
            <Button variant="primary" size="md" leftIcon={UserPlus} className="shadow-xs font-semibold">
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <Input
            placeholder="Search by name, phone, email..."
            isSearch
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setPage(1);
            }}
          />

          {/* Stage Filter */}
          <Select
            placeholder="All Lead Stages"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            options={Object.values(LEAD_STAGES).map((st) => ({
              value: st,
              label: `${STAGE_CONFIG[st]?.label || st} (${st})`,
            }))}
          />

          {/* Assigned Agent Filter */}
          <Select
            placeholder="All Sales Representatives"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.name} (${emp.role})`,
            }))}
          />

          {/* Property Filter */}
          <Select
            placeholder="All Properties"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            options={projects.map((p) => ({
              value: p.name,
              label: p.name,
            }))}
          />
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{pagination.total || leads.length}</strong> matching prospects
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Leads Table */}
      <div className="space-y-4">
        {error ? (
          <div className="p-8 text-center bg-rose-50/80 rounded-2xl border border-rose-200 text-rose-700 space-y-3">
            <p className="text-sm font-semibold">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchLeads}
              className="mx-auto"
            >
              Retry Loading
            </Button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={leads}
              isLoading={loading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              emptyTitle="No leads found"
              emptyDescription={
                hasActiveFilters
                  ? 'No leads match your current filter parameters. Try clearing some filters.'
                  : 'Start by adding your first lead to build your sales opportunity pipeline.'
              }
              emptyActionLabel={hasActiveFilters ? 'Clear Filters' : 'Add First Lead'}
              onEmptyAction={hasActiveFilters ? handleResetFilters : () => navigate('/leads/create')}
            />

            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages || 1}
              totalItems={pagination.total || leads.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Fixed Floating Action Menu Portal (Prevents clipping by table container) */}
      {activeActionMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setActiveActionMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: `${activeActionMenu.top}px`,
              left: `${activeActionMenu.left}px`,
              width: '180px',
            }}
            className="z-50 rounded-xl bg-white p-1.5 shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const leadId = activeActionMenu.id;
                setActiveActionMenu(null);
                navigate(`/leads/${leadId}`);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              View Profile
            </button>

            <button
              type="button"
              onClick={() => {
                const leadId = activeActionMenu.id;
                setActiveActionMenu(null);
                navigate(`/leads/${leadId}/edit`);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Edit Details
            </button>

            <button
              type="button"
              onClick={() => {
                const leadObj = activeActionMenu.lead;
                setActiveActionMenu(null);
                setStageModalLead(leadObj);
                setNewSelectedStage(leadObj.stage);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Change Stage
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={() => {
                const leadObj = activeActionMenu.lead;
                setActiveActionMenu(null);
                setLeadToDelete(leadObj);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Delete Lead
            </button>
          </div>
        </>
      )}

      {/* Delete Lead Confirmation Modal */}
      <Modal
        isOpen={Boolean(leadToDelete)}
        onClose={() => setLeadToDelete(null)}
        title="Delete Opportunity"
        description="Are you sure you want to remove this lead from the CRM?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will remove <strong className="text-slate-900">{leadToDelete?.name}</strong> and all
            associated activity logs from the database.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLeadToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete Lead
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Stage Change Modal */}
      <Modal
        isOpen={Boolean(stageModalLead)}
        onClose={() => setStageModalLead(null)}
        title={`Change Stage: ${stageModalLead?.name}`}
        description="Advance or update the customer journey stage in the sales pipeline"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Stage"
            value={newSelectedStage}
            onChange={(e) => setNewSelectedStage(e.target.value)}
            options={Object.values(LEAD_STAGES).map((st) => ({
              value: st,
              label: STAGE_CONFIG[st]?.label || st,
            }))}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStageModalLead(null)}
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
              Update Stage
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LeadListPage;
