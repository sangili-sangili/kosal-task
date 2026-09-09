import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  User,
  Building2,
  Layers,
  BookmarkCheck,
  KeyRound,
  FileText,
  Calendar,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Laptop,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { auditService } from '../../services/auditService';
import { usePermissions } from '../../hooks/usePermissions';

const PAGE_SIZE = 20;

const ACTION_CONFIG = {
  CREATE: { label: 'CREATE', color: 'emerald', badgeVariant: 'success' },
  UPDATE: { label: 'UPDATE', color: 'blue', badgeVariant: 'primary' },
  DELETE: { label: 'DELETE', color: 'rose', badgeVariant: 'danger' },
  STAGE_CHANGE: { label: 'STAGE CHANGE', color: 'purple', badgeVariant: 'brand' },
  APPROVE: { label: 'APPROVE', color: 'emerald', badgeVariant: 'success' },
  BLOCK: { label: 'HOLD / BLOCK', color: 'amber', badgeVariant: 'warning' },
  EXPORT: { label: 'DATA EXPORT', color: 'sky', badgeVariant: 'info' },
  SECURITY: { label: 'SECURITY', color: 'indigo', badgeVariant: 'secondary' },
};

const ENTITY_ICONS = {
  LEAD: User,
  PROPERTY: Building2,
  UNIT: Layers,
  BOOKING: BookmarkCheck,
  USER: User,
  ROLE: Shield,
  SECURITY: ShieldAlert,
  SYSTEM: FileText,
};

export function AuditLogsPage() {
  const { user } = useAuth();
  const { canViewAudit } = usePermissions();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    securityEvents: 0,
    financialEvents: 0,
    distinctActors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters and UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch audit records from backend API
  const fetchAuditData = useCallback(async (isSilent = false) => {
    if (!canViewAudit) return;
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await auditService.getAuditLogs({ limit: 150 });
      const fetchedLogs = response.logs || response.data || [];
      const fetchedStats = response.stats || {
        totalEvents: fetchedLogs.length,
        securityEvents: fetchedLogs.filter((l) => l.action === 'SECURITY' || l.entityType === 'ROLE').length,
        financialEvents: fetchedLogs.filter((l) => l.action === 'APPROVE' || l.entityType === 'BOOKING').length,
        distinctActors: new Set(fetchedLogs.map((l) => l.actor?.name)).size,
      };

      setLogs(fetchedLogs);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Unable to connect to audit logging service');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [canViewAudit]);

  useEffect(() => {
    if (canViewAudit) {
      fetchAuditData(false);
    }
  }, [fetchAuditData, canViewAudit]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesSummary = log.summary?.toLowerCase().includes(query);
        const matchesActorName = log.actor?.name?.toLowerCase().includes(query);
        const matchesActorEmail = log.actor?.email?.toLowerCase().includes(query);
        const matchesEntityTitle = log.entityTitle?.toLowerCase().includes(query);
        const matchesEntityType = log.entityType?.toLowerCase().includes(query);
        const matchesAction = log.action?.toLowerCase().includes(query);
        const matchesIp = log.ipAddress?.includes(query);

        if (
          !matchesSummary &&
          !matchesActorName &&
          !matchesActorEmail &&
          !matchesEntityTitle &&
          !matchesEntityType &&
          !matchesAction &&
          !matchesIp
        ) {
          return false;
        }
      }

      // Entity filter
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }

      // Action filter
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchTerm, entityFilter, actionFilter, severityFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entityFilter, actionFilter, severityFilter]);

  // Paginated slice (20 per page)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  // Export to CSV handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const headers = [
      'Log ID',
      'Timestamp',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Action',
      'Entity Type',
      'Entity Title',
      'Summary',
      'IP Address',
      'Device',
      'Severity',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.actor?.name || 'System'}"`,
      `"${l.actor?.role || 'SYSTEM'}"`,
      `"${l.actor?.email || ''}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${(l.entityTitle || '').replace(/"/g, '""')}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
      `"${(l.device || '').replace(/"/g, '""')}"`,
      `"${l.severity || 'INFO'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredLogs.length} audit logs (CSV) successfully!`);
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'timestamp',
      title: 'Timestamp',
      render: (ts) => {
        const dateObj = new Date(ts);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        return (
          <div className="text-xs">
            <div className="font-semibold text-slate-800">{timeStr}</div>
            <div className="text-[11px] text-slate-400">{dateStr}</div>
          </div>
        );
      },
    },
    {
      key: 'actor',
      title: 'Actor / Operator',
      render: (actor) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0 border border-slate-200">
            {actor?.avatar || 'SY'}
          </div>
          <div className="truncate max-w-[130px]">
            <div className="font-semibold text-slate-900 text-xs truncate">{actor?.name || 'System'}</div>
            <div className="text-[10px] text-slate-500 truncate">{actor?.role || 'SYSTEM'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: (action) => {
        const conf = ACTION_CONFIG[action] || { label: action, badgeVariant: 'default' };
        return (
          <Badge variant={conf.badgeVariant} size="sm" dot>
            {conf.label}
          </Badge>
        );
      },
    },
    {
      key: 'entity',
      title: 'Target Entity',
      render: (_, row) => {
        const IconComponent = ENTITY_ICONS[row.entityType] || FileText;
        return (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-100 text-slate-600 shrink-0">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <div className="truncate max-w-[180px]">
              <span className="font-medium text-slate-900 text-xs block truncate" title={row.entityTitle}>
                {row.entityTitle || '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {row.entityType}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'summary',
      title: 'Activity Summary',
      render: (summary) => (
        <span className="text-xs text-slate-700 line-clamp-2 max-w-md" title={summary}>
          {summary}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      title: 'Origin / IP',
      render: (ip, row) => (
        <div className="text-right">
          <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block truncate max-w-[110px]">
            {ip || '127.0.0.1'}
          </span>
          <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={row.device}>
            {row.device?.split('/')[0]?.trim() || 'Web Client'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setSelectedLog(row)}
          className="text-brand-700 hover:text-brand-900 hover:bg-brand-50"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  System Audit Trail &amp; Activity Logs
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Immutable chronological event trail tracking customer transitions, inventory allotments, and security changes
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchAuditData(true)}
            disabled={isLoading || isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* Table / Timeline Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline Feed
            </button>
          </div>

          {/* Export CSV Button */}
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* 4 Metric Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Logged Events
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalEvents || logs.length}</div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Real-time event capture active</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Security &amp; RBAC Audits
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.securityEvents}</div>
            <div className="mt-1 text-[11px] text-purple-700 font-medium">
              Roles &amp; user account governance
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Financial Allotments
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.financialEvents}</div>
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              Token receipts &amp; verification
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Operators
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.distinctActors}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              Across sales reps &amp; managers
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            {/* Search Input */}
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search audit trail by actor, entity title, summary, action, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                isSearch
                onClear={() => setSearchTerm('')}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-36">
                <Select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Entities' },
                    { value: 'LEAD', label: 'Leads' },
                    { value: 'PROPERTY', label: 'Properties' },
                    { value: 'UNIT', label: 'Units' },
                    { value: 'BOOKING', label: 'Bookings' },
                    { value: 'USER', label: 'Users' },
                    { value: 'ROLE', label: 'Roles' },
                    { value: 'SECURITY', label: 'Security' },
                    { value: 'SYSTEM', label: 'System' },
                  ]}
                />
              </div>

              <div className="w-36">
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Actions' },
                    { value: 'CREATE', label: 'Create' },
                    { value: 'UPDATE', label: 'Update' },
                    { value: 'DELETE', label: 'Delete' },
                    { value: 'STAGE_CHANGE', label: 'Stage Change' },
                    { value: 'APPROVE', label: 'Approve' },
                    { value: 'BLOCK', label: 'Hold / Block' },
                    { value: 'EXPORT', label: 'Export' },
                    { value: 'SECURITY', label: 'Security' },
                  ]}
                />
              </div>

              <div className="w-32">
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Severity' },
                    { value: 'INFO', label: 'Info' },
                    { value: 'SUCCESS', label: 'Success' },
                    { value: 'WARNING', label: 'Warning' },
                  ]}
                />
              </div>

              {(searchTerm || entityFilter !== 'ALL' || actionFilter !== 'ALL' || severityFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setEntityFilter('ALL');
                    setActionFilter('ALL');
                    setSeverityFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="xs" onClick={() => fetchAuditData(false)}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-subtle">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading audit trail records...</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fetching from secure database event ledger</p>
        </div>
      ) : (
        <>
          {/* View Mode 1: Table Matrix */}
          {viewMode === 'table' && (
            <Card>
              <Table
                columns={columns}
                data={pagedLogs}
                emptyTitle="No Audit Events Found"
                emptyDescription="Try clearing your search query or adjusting the filters."
              />
              <div className="px-4 pb-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredLogs.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </Card>
          )}

          {/* View Mode 2: Interactive Timeline Feed */}
          {viewMode === 'timeline' && (
            <div>
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-subtle">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Events Found</p>
                  <p className="text-xs text-slate-400 mt-1">No activities match your current filter selection.</p>
                </div>
              ) : (
                <>
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {pagedLogs.map((log) => {
                    const IconComponent = ENTITY_ICONS[log.entityType] || FileText;
                    const actionConf = ACTION_CONFIG[log.action] || { label: log.action, badgeVariant: 'default' };

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110">
                          <span className="w-2 h-2 rounded-full bg-brand-600" />
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                {log.actor?.name || 'System'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({log.actor?.role || 'SYSTEM'})
                              </span>
                              <Badge variant={actionConf.badgeVariant} size="xs">
                                {log.action}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                                <IconComponent className="w-3.5 h-3.5" />
                                <span>{log.entityTitle || 'Record'}</span>
                                <span className="text-slate-400 font-normal">({log.entityType})</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {log.summary}
                              </p>
                            </div>

                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setSelectedLog(log)}
                              className="shrink-0"
                            >
                              Inspect
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredLogs.length > PAGE_SIZE && (
                  <div className="mt-4 bg-white border border-slate-200 rounded-xl px-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredLogs.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Inspect Event Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event Details #${selectedLog.id}`}
          description="Comprehensive audit record snapshot with forensic metadata"
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Action Type</span>
                <span className="font-semibold text-xs text-slate-800">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Target Entity</span>
                <span className="font-semibold text-xs text-slate-800">{selectedLog.entityType}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Severity</span>
                <span
                  className={`font-semibold text-xs ${
                    selectedLog.severity === 'WARNING'
                      ? 'text-amber-600'
                      : selectedLog.severity === 'SUCCESS'
                      ? 'text-emerald-600'
                      : 'text-blue-600'
                  }`}
                >
                  {selectedLog.severity || 'INFO'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Recorded At</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {new Date(selectedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Operator & Security Metadata */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Operator &amp; Signature Profile
              </h4>
              <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Actor Name:</span>
                  <span className="font-semibold text-slate-900">{selectedLog.actor?.name || 'System'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Corporate Email:</span>
                  <span className="font-mono text-slate-700">{selectedLog.actor?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role Privilege:</span>
                  <span className="font-semibold text-brand-700">{selectedLog.actor?.role || 'SYSTEM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Origin IP Address:</span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {selectedLog.ipAddress || '127.0.0.1'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Client Signature / Device:</span>
                  <span className="text-slate-700 truncate max-w-xs">{selectedLog.device || 'Web Client'}</span>
                </div>
              </div>
            </div>

            {/* Activity Summary Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Operational Statement
              </h4>
              <p className="p-3.5 rounded-xl bg-brand-50/50 border border-brand-100 text-xs text-slate-800 leading-relaxed">
                {selectedLog.summary}
              </p>
            </div>

            {/* Technical Payload / Changes Diffs */}
            {selectedLog.details && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Payload JSON Snapshot
                </h4>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 custom-scrollbar">
                  {typeof selectedLog.details === 'string'
                    ? selectedLog.details
                    : JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AuditLogsPage;
