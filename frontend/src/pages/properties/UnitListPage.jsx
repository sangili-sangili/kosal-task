import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
  Download,
  Building2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINR, formatINRCompact } from '../../utils/crmFormatters';
import { exportUnitsToExcel } from '../../utils/excelExport';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import AddUnitModal from '../../components/properties/AddUnitModal';
import EditUnitModal from '../../components/properties/EditUnitModal';

export function UnitListPage() {
  const navigate = useNavigate();

  // Live Inventory & Project State
  const [units, setUnits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState('unit_number');
  const [sortOrder, setSortOrder] = useState('ASC');

  // CRUD Modals State
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inspectedUnit, setInspectedUnit] = useState(null);

  // Toast feedback state
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load projects list for filtering and KPI stats
  const loadProjects = useCallback(async () => {
    try {
      const data = await propertyService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects list for filter:', err);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Global KPI calculation across all catalog projects
  const allCatalogUnits = useMemo(() => {
    return projects.flatMap((p) => p.buildings?.flatMap((b) => b.units || []) || []);
  }, [projects]);

  const kpiTotal = allCatalogUnits.length || totalItems;
  const kpiAvailable = allCatalogUnits.filter((u) => u.status === 'AVAILABLE').length;
  const kpiBooked = allCatalogUnits.filter((u) => u.status === 'BOOKED').length;
  const kpiBlocked = allCatalogUnits.filter((u) => u.status === 'BLOCKED').length;
  const kpiOccupancy = kpiTotal > 0 ? Math.round(((kpiBooked + kpiBlocked) / kpiTotal) * 100) : 0;

  // Fetch paginated units from live MySQL API
  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        project_id: projectFilter || undefined,
        unit_type: typeFilter || undefined,
        status: statusFilter || undefined,
        sort: sortBy,
        order: sortOrder,
      };
      const res = await propertyService.getUnits(params);
      setUnits(res.units || []);
      setTotalItems(res.pagination?.total || (res.units ? res.units.length : 0));
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      setFetchError(err.message || 'Failed to load inventory units');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, projectFilter, typeFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setProjectFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleSort = (key, order) => {
    const mappedKey = key === 'unitNumber' ? 'unit_number' : key;
    setSortBy(mappedKey);
    setSortOrder(order);
  };

  // Delete Unit Handler (Delete)
  const handleDeleteUnitConfirm = async () => {
    if (!deletingUnit) return;
    setIsDeleting(true);
    try {
      await propertyService.deleteUnit(deletingUnit.id);
      showFeedback(`Unit ${deletingUnit.unit_number || deletingUnit.unitNumber} deleted successfully.`);
      setDeletingUnit(null);
      fetchUnits();
      loadProjects();
    } catch (err) {
      console.error('Failed to delete unit:', err);
      showFeedback(err.message || 'Failed to delete unit', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel Handler
  const handleExportToExcel = async () => {
    try {
      const res = await propertyService.getUnits({
        limit: 1000,
        search: debouncedSearch.trim() || undefined,
        project_id: projectFilter || undefined,
        unit_type: typeFilter || undefined,
        status: statusFilter || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      const exportData = res.units?.length > 0 ? res.units : units;
      if (!exportData || exportData.length === 0) {
        showFeedback('No units found to export.', 'error');
        return;
      }
      exportUnitsToExcel(exportData);
      showFeedback(`Successfully exported ${exportData.length} unit${exportData.length === 1 ? '' : 's'} to Excel (.csv)!`);
    } catch (err) {
      console.error('Failed to export units:', err);
      showFeedback('Failed to export units to Excel.', 'error');
    }
  };

  const columns = [
    {
      key: 'unit_number',
      title: 'Unit No.',
      sortable: true,
      render: (_, row) => {
        const num = row.unit_number || row.unitNumber;
        return (
          <button
            type="button"
            onClick={() => setInspectedUnit(row)}
            className="font-mono text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50/80 hover:bg-brand-100/80 px-2.5 py-1 rounded-lg border border-brand-200/80 inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Click to inspect unit details"
          >
            {num}
          </button>
        );
      },
    },
    {
      key: 'project_name',
      title: 'Project & Tower',
      sortable: false,
      render: (_, row) => {
        const projId = row.building?.project?.id || row.building?.project_id || row.projectId;
        const projName = row.building?.project?.name || row.projectName || 'Residential';
        const bldName = row.building?.name || row.buildingName || 'Tower Block';
        return (
          <div>
            {projId ? (
              <Link
                to={`/properties/${projId}`}
                className="font-semibold text-slate-900 hover:text-brand-600 transition-colors text-xs flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[200px]">{projName}</span>
              </Link>
            ) : (
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[200px]">{projName}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 ml-4.5">{bldName}</div>
          </div>
        );
      },
    },
    {
      key: 'unit_type',
      title: 'Config',
      render: (_, row) => (
        <span className="font-semibold text-slate-800 text-xs px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200/70">
          {row.unit_type || row.type}
        </span>
      ),
    },
    {
      key: 'floor',
      title: 'Floor',
      sortable: true,
      render: (fl) => <span className="text-xs font-mono text-slate-600">{fl}th</span>,
    },
    {
      key: 'area',
      title: 'Super Area',
      sortable: true,
      render: (area) => {
        const areaNum = Number(area) || 0;
        return (
          <div>
            <span className="text-xs font-medium text-slate-700">{areaNum} sq ft</span>
            <p className="text-[10px] text-slate-400">Carpet: ~{Math.round(areaNum * 0.76)} sq ft</p>
          </div>
        );
      },
    },
    {
      key: 'facing',
      title: 'Facing',
      render: (facing) => <span className="text-xs text-slate-500">{facing || 'East'}</span>,
    },
    {
      key: 'price',
      title: 'Total Price',
      sortable: true,
      render: (price) => (
        <div>
          <span className="text-xs font-bold text-slate-900 font-mono">{formatINRCompact(price)}</span>
          <p className="text-[10px] text-slate-400 font-mono">{formatINR(price)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => {
        const variant =
          status === UNIT_STATUS.AVAILABLE
            ? 'success'
            : status === UNIT_STATUS.BOOKED
            ? 'danger'
            : 'warning';
        return (
          <Badge variant={variant} size="xs" dot>
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      title: 'Action',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick Book Action (Only if AVAILABLE) */}
          {row.status === UNIT_STATUS.AVAILABLE && (
            <Link to={`/bookings/create?unitId=${row.id}`}>
              <Button variant="primary" size="xs" leftIcon={BookmarkCheck} className="shadow-2xs">
                Book
              </Button>
            </Link>
          )}

          {/* Inspect Details Action */}
          <button
            type="button"
            title="Inspect Unit Specifications"
            onClick={() => setInspectedUnit(row)}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Unit Action (Update) */}
          <button
            type="button"
            title="Edit Unit Details"
            onClick={() => setEditingUnit(row)}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-brand-300 bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 flex items-center justify-center transition-all shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Delete Unit Action (Delete) */}
          <button
            type="button"
            title="Delete Unit"
            onClick={() => setDeletingUnit(row)}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Page Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Unit Inventory</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80">
              {totalItems} Cataloged
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time residential property availability, pricing, and reservation registry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export to Excel */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportToExcel}
            className="border-emerald-300/80 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 font-semibold shadow-2xs transition-all"
            title="Download formatted Excel spreadsheet of unit inventory"
          >
            Export Excel
          </Button>

          {/* Add New Unit (Create) */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddUnitModalOpen(true)}
            className="shadow-xs font-semibold"
          >
            Add New Unit
          </Button>

          {/* Create Booking */}
          <Link to="/bookings/create">
            <Button variant="primary" size="md" leftIcon={<BookmarkCheck className="w-4 h-4" />}>
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Catalog</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{kpiTotal} Units</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all developments</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Available</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{kpiAvailable} Units</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${kpiTotal > 0 ? (kpiAvailable / kpiTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Allotted / Booked</span>
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{kpiBooked} Booked</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all"
              style={{ width: `${kpiTotal > 0 ? (kpiBooked / kpiTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Blocked / Hold</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{kpiBlocked} On Hold</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Management reservation</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search unit (e.g. A-102, Tower B)..."
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

          <Select
            placeholder="All Projects"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />

          <Select
            placeholder="All Configurations"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '1BHK', label: '1 BHK' },
              { value: '2BHK', label: '2 BHK' },
              { value: '3BHK', label: '3 BHK' },
              { value: '3 BHK Grand', label: '3 BHK Grand' },
              { value: '4BHK', label: '4 BHK Ultra' },
              { value: 'Penthouse', label: 'Penthouse' },
              { value: 'Duplex Villa', label: 'Duplex Villa' },
            ]}
          />

          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'AVAILABLE', label: 'Available Only' },
              { value: 'BOOKED', label: 'Booked Only' },
              { value: 'BLOCKED', label: 'Blocked / Hold Only' },
            ]}
          />
        </div>

        {(searchTerm || projectFilter || typeFilter || statusFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{totalItems}</strong> matching units
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button variant="outline" size="xs" onClick={fetchUnits}>
            Retry
          </Button>
        </div>
      )}

      {/* Inventory Table (Read) */}
      <div className="space-y-3">
        <Table
          columns={columns}
          data={units}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyTitle="No property units found"
          emptyDescription="Try adjusting your project, configuration, or availability filters."
          emptyActionLabel="Clear Filters"
          onEmptyAction={handleResetFilters}
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

      {/* Unit Detail Inspection Modal (Read) */}
      <Modal
        isOpen={Boolean(inspectedUnit)}
        onClose={() => setInspectedUnit(null)}
        title={`Unit ${inspectedUnit?.unit_number || inspectedUnit?.unitNumber} Details`}
        description={`${inspectedUnit?.building?.project?.name || inspectedUnit?.projectName || 'Project'} • ${inspectedUnit?.building?.name || inspectedUnit?.buildingName || 'Tower'}`}
        size="md"
      >
        {inspectedUnit && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Configuration
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {inspectedUnit.unit_type || inspectedUnit.type}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Floor</span>
                <div className="font-bold text-slate-900 mt-0.5">{inspectedUnit.floor}th Floor</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Super Area
                </span>
                <div className="font-bold text-slate-900 mt-0.5">{inspectedUnit.area} sq ft</div>
                <div className="text-[10px] text-slate-400">
                  Carpet: ~{Math.round((Number(inspectedUnit.area) || 0) * 0.76)} sq ft
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Facing</span>
                <div className="font-bold text-slate-900 mt-0.5">{inspectedUnit.facing || 'East'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Price</span>
                <div className="font-bold text-slate-900 mt-0.5">{formatINRCompact(inspectedUnit.price)}</div>
                <div className="text-[10px] text-slate-400 font-mono">{formatINR(inspectedUnit.price)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Status</span>
                <div className="mt-0.5">
                  <Badge
                    variant={
                      inspectedUnit.status === 'AVAILABLE'
                        ? 'success'
                        : inspectedUnit.status === 'BOOKED'
                        ? 'danger'
                        : 'warning'
                    }
                    size="xs"
                    dot
                  >
                    {inspectedUnit.status}
                  </Badge>
                </div>
              </div>
            </div>

            {inspectedUnit.status === 'BOOKED' && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-semibold">Allotted Status:</span> Unit is booked and registered in customer allotment registry.
              </div>
            )}

            {inspectedUnit.status === 'BLOCKED' && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold">Management Hold:</span> Temporarily blocked from public reservations.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => {
                  const target = inspectedUnit;
                  setInspectedUnit(null);
                  setEditingUnit(target);
                }}
              >
                Edit Unit
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInspectedUnit(null)}>
                  Close
                </Button>
                {inspectedUnit.status === 'AVAILABLE' && (
                  <Link to={`/bookings/create?unitId=${inspectedUnit.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<BookmarkCheck className="w-3.5 h-3.5" />}>
                      Book This Unit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Unit Modal (Create) */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        onSuccess={() => {
          showFeedback('New inventory unit created successfully!');
          fetchUnits();
          loadProjects();
        }}
      />

      {/* Edit Unit Modal (Update) */}
      <EditUnitModal
        isOpen={Boolean(editingUnit)}
        onClose={() => setEditingUnit(null)}
        unit={editingUnit}
        onSuccess={() => {
          showFeedback('Unit updated successfully!');
          fetchUnits();
          loadProjects();
        }}
      />

      {/* Delete Unit Confirmation Modal (Delete) */}
      <Modal
        isOpen={Boolean(deletingUnit)}
        onClose={() => !isDeleting && setDeletingUnit(null)}
        title={`Delete Unit ${deletingUnit?.unit_number || deletingUnit?.unitNumber}?`}
        description="This will remove the unit from the active inventory catalog."
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Are you sure you want to delete this unit?</p>
              <p className="text-[11px] text-rose-700/90 mt-0.5">
                Unit <strong>{deletingUnit?.unit_number || deletingUnit?.unitNumber}</strong> in {deletingUnit?.building?.name || 'Building'} ({deletingUnit?.building?.project?.name || 'Project'}) will be removed from inventory.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeletingUnit(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteUnitConfirm}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UnitListPage;
