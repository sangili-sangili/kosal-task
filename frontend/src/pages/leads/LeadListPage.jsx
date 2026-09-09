import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { LEAD_STAGES, STAGE_CONFIG } from '../../mock/mockData';
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
  const { leads, employees, projects, deleteLead, updateLeadStage } = useCrm();

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
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Deletion Modal State
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Stage Change Quick Modal
  const [stageModalLead, setStageModalLead] = useState(null);
  const [newSelectedStage, setNewSelectedStage] = useState('');

  // Action Menu open tracking
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Filter Leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (stageFilter && lead.stage !== stageFilter) return false;
        if (employeeFilter && lead.assignedToId !== employeeFilter) return false;
        if (projectFilter && lead.preferredProject !== projectFilter) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchPhone = lead.phone.includes(q);
          const matchEmail = lead.email.toLowerCase().includes(q);
          const matchProject = lead.preferredProject?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchEmail && !matchProject) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (sortOrder === 'ASC') {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [leads, stageFilter, employeeFilter, projectFilter, searchTerm, sortBy, sortOrder]);

  // Paginate filtered results
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

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

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      deleteLead(leadToDelete.id);
      setLeadToDelete(null);
    }
  };

  const handleStageChangeSubmit = () => {
    if (stageModalLead && newSelectedStage) {
      updateLeadStage(stageModalLead.id, newSelectedStage);
      setStageModalLead(null);
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
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (phone) => <span className="font-mono text-xs text-slate-600">{phone}</span>,
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
          className={`${STAGE_CONFIG[stage]?.badgeClass || 'badge-new'} hover:opacity-80 transition-opacity cursor-pointer text-left`}
          title="Click to update stage"
        >
          {STAGE_CONFIG[stage]?.label || stage}
        </button>
      ),
    },
    {
      key: 'assignedToName',
      title: 'Assigned To',
      sortable: true,
      render: (agent) => (
        <span className="text-xs font-medium text-slate-700">{agent}</span>
      ),
    },
    {
      key: 'preferredProject',
      title: 'Project & Budget',
      render: (_, row) => (
        <div>
          <div className="text-xs text-slate-800 font-medium">{row.preferredProject}</div>
          <div className="text-[11px] text-slate-500">{row.budget}</div>
        </div>
      ),
    },
    {
      key: 'followupDate',
      title: 'Next Follow-up',
      render: (date, row) => {
        if (!date) return <span className="text-slate-400 text-xs">—</span>;
        const isOverdue = date < '2026-09-09';
        return (
          <div className={isOverdue ? 'text-rose-600 font-medium' : 'text-slate-700'}>
            <div className="text-xs">{formatCRMDate(date)}</div>
            <div className="text-[10px] text-slate-400 font-mono">{row.followupTime || '10:00 AM'}</div>
          </div>
        );
      },
    },
    {
      key: 'source',
      title: 'Source',
      render: (source) => (
        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {source}
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
              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white p-1.5 shadow-dropdown border border-slate-200 z-30 animate-in fade-in zoom-in-95">
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage and track prospective home buyers, stage progressions, and follow-ups
          </p>
        </div>

        <Link to="/leads/create">
          <Button variant="primary" size="md" leftIcon={UserPlus}>
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
              label: STAGE_CONFIG[st].label,
            }))}
          />

          {/* Assigned Agent Filter */}
          <Select
            placeholder="All Sales Agents"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.name} (${emp.title})`,
            }))}
          />

          {/* Project Filter */}
          <Select
            placeholder="All Preferred Projects"
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
              Found <strong className="text-slate-900">{filteredLeads.length}</strong> matching prospects
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
        <Table
          columns={columns}
          data={paginatedLeads}
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
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
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
            associated activity logs.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setLeadToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
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
        description="Advance or update the customer journey stage in the pipeline"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Stage"
            value={newSelectedStage}
            onChange={(e) => setNewSelectedStage(e.target.value)}
            options={Object.values(LEAD_STAGES).map((st) => ({
              value: st,
              label: STAGE_CONFIG[st].label,
            }))}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setStageModalLead(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleStageChangeSubmit}>
              Update Stage
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LeadListPage;
