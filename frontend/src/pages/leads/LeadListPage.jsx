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
} from 'lucide-react';
import { leadService } from '../../services/leadService';
import { LEAD_STAGES, STAGE_CONFIG } from '../../constants/crmConstants';
import { formatCRMDate } from '../../utils/crmFormatters';
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

  // Action Menu open tracking
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Feedback Toast
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

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

  // Table Columns
  const columns = [
    {
      key: 'name',
      title: 'Customer Details',
      sortable: true,
      render: (_, row) => (
        <div
          onClick={() => navigate(`/leads/${row.id}`)}
          className="cursor-pointer group text-left"
        >
          <div className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
            {row.name}
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
            {row.email || 'No email provided'}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (phone) => <span className="font-mono text-xs text-slate-600">{phone || '—'}</span>,
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
          className={`${STAGE_CONFIG[stage]?.badgeClass || 'badge-new'} hover:opacity-85 transition-opacity cursor-pointer text-left shadow-2xs`}
          title="Click to update stage"
        >
          {STAGE_CONFIG[stage]?.label || stage}
        </button>
      ),
    },
    {
      key: 'assignedSalesEmployee',
      title: 'Assigned Representative',
      sortable: false,
      render: (_, row) => {
        const repName = row.assignedSalesEmployee?.name || row.assignedToName || 'Unassigned';
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
              {repName[0]}
            </span>
            <span className="text-xs font-medium text-slate-700">{repName}</span>
          </div>
        );
      },
    },
    {
      key: 'follow_up_date',
      title: 'Next Follow-up',
      render: (_, row) => {
        const date = row.follow_up_date || row.followupDate;
        if (!date) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <div className="text-slate-700">
            <div className="text-xs font-medium">{formatCRMDate(date)}</div>
          </div>
        );
      },
    },
    {
      key: 'source',
      title: 'Source',
      render: (source) => (
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
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
            onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Row actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {activeMenuId === row.id && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setActiveMenuId(null)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-dropdown border border-slate-200 z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuId(null);
                    navigate(`/leads/${row.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuId(null);
                    navigate(`/leads/${row.id}/edit`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuId(null);
                    setLeadToDelete(row);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete Lead
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time management of prospective home buyers, sales stages, and follow-ups
          </p>
        </div>

        <Link to="/leads/create">
          <Button variant="primary" size="md" leftIcon={UserPlus} className="shadow-xs">
            Add Lead
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
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
              label: STAGE_CONFIG[st]?.label || st,
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

          {/* Project Filter */}
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
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Found <strong className="text-slate-900">{pagination.total || leads.length}</strong> matching prospects
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Leads Table */}
      <div className="space-y-3">
        {error ? (
          <div className="p-8 text-center bg-rose-50/70 rounded-xl border border-rose-200 text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchLeads}
              className="mt-3"
            >
              Retry
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
