import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINR, formatINRCompact } from '../../utils/crmFormatters';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import AddUnitModal from '../../components/properties/AddUnitModal';

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

  // Selected Unit Inspection Modal
  const [inspectedUnit, setInspectedUnit] = useState(null);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load projects list for filtering
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await propertyService.getProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load projects list for filter:', err);
      }
    };
    loadProjects();
  }, []);

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
            className="font-mono text-xs font-bold text-brand-700 hover:underline cursor-pointer"
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
        const projName = row.building?.project?.name || row.projectName || 'Residential';
        const bldName = row.building?.name || row.buildingName || 'Tower Block';
        return (
          <div>
            <div className="font-semibold text-slate-900 text-xs">{projName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{bldName}</div>
          </div>
        );
      },
    },
    {
      key: 'unit_type',
      title: 'Config',
      render: (_, row) => (
        <span className="font-semibold text-slate-800 text-xs">{row.unit_type || row.type}</span>
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
      render: (area) => <span className="text-xs text-slate-600">{area} sq ft</span>,
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
        <span className="text-xs font-bold text-slate-900 font-mono">{formatINRCompact(price)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => {
        const badgeClass =
          status === UNIT_STATUS.AVAILABLE
            ? 'badge-available'
            : status === UNIT_STATUS.BOOKED
            ? 'badge-booked'
            : 'badge-blocked';
        return <span className={badgeClass}>{status}</span>;
      },
    },
    {
      key: 'actions',
      title: '',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === UNIT_STATUS.AVAILABLE ? (
            <Link to={`/bookings/create?unitId=${row.id}`}>
              <Button variant="primary" size="xs" leftIcon={BookmarkCheck}>
                Book
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setInspectedUnit(row)}
            >
              Info
            </Button>
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Unit Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time residential property availability, pricing, and reservation registry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsAddUnitModalOpen(true)}
            className="shadow-xs font-semibold"
          >
            Add New Unit
          </Button>

          <Link to="/bookings/create">
            <Button variant="primary" size="md" leftIcon={BookmarkCheck}>
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
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
              { value: '4BHK', label: '4 BHK' },
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
              { value: 'BLOCKED', label: 'Blocked Only' },
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
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
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

      {/* Inventory Table */}
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

      {/* Unit Detail Inspection Modal */}
      <Modal
        isOpen={Boolean(inspectedUnit)}
        onClose={() => setInspectedUnit(null)}
        title={`Unit ${inspectedUnit?.unit_number || inspectedUnit?.unitNumber} Details`}
        description={`${inspectedUnit?.building?.project?.name || inspectedUnit?.projectName || 'Project'} • ${inspectedUnit?.building?.name || inspectedUnit?.buildingName || 'Tower'}`}
        maxWidth="max-w-md"
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
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Facing</span>
                <div className="font-bold text-slate-900 mt-0.5">{inspectedUnit.facing || 'East'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Price</span>
                <div className="font-bold text-slate-900 mt-0.5">{formatINR(inspectedUnit.price)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Status</span>
                <div className="mt-0.5">
                  <span
                    className={
                      inspectedUnit.status === 'AVAILABLE'
                        ? 'badge-available'
                        : inspectedUnit.status === 'BOOKED'
                        ? 'badge-booked'
                        : 'badge-blocked'
                    }
                  >
                    {inspectedUnit.status}
                  </span>
                </div>
              </div>
            </div>

            {inspectedUnit.status === 'BOOKED' && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900">
                <span className="font-semibold">Booking Record:</span> Allocated to registered client.
              </div>
            )}

            {inspectedUnit.status === 'BLOCKED' && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold">Reason:</span> Reserved by Management.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setInspectedUnit(null)}>
                Close
              </Button>
              {inspectedUnit.status === 'AVAILABLE' && (
                <Link to={`/bookings/create?unitId=${inspectedUnit.id}`}>
                  <Button variant="primary" size="sm" leftIcon={BookmarkCheck}>
                    Book This Unit
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Unit Modal */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        onSuccess={fetchUnits}
      />
    </div>
  );
}

export default UnitListPage;
