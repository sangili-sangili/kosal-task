import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
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
  const { units, projects } = useCrm();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sortBy, setSortBy] = useState('unitNumber');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Selected Unit Inspection Modal
  const [inspectedUnit, setInspectedUnit] = useState(null);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);

  // Filter Units
  const filteredUnits = useMemo(() => {
    return units
      .filter((u) => {
        if (projectFilter && u.projectName !== projectFilter) return false;
        if (typeFilter && u.type !== typeFilter) return false;
        if (statusFilter && u.status !== statusFilter) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchNum = u.unitNumber.toLowerCase().includes(q);
          const matchBld = u.buildingName.toLowerCase().includes(q);
          const matchProj = u.projectName.toLowerCase().includes(q);
          if (!matchNum && !matchBld && !matchProj) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (sortOrder === 'ASC') {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [units, projectFilter, typeFilter, statusFilter, searchTerm, sortBy, sortOrder]);

  const totalItems = filteredUnits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedUnits = filteredUnits.slice((page - 1) * pageSize, page * pageSize);

  const handleResetFilters = () => {
    setSearchTerm('');
    setProjectFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'unitNumber',
      title: 'Unit No.',
      sortable: true,
      render: (num, row) => (
        <button
          type="button"
          onClick={() => setInspectedUnit(row)}
          className="font-mono text-xs font-bold text-brand-700 hover:underline cursor-pointer"
        >
          {num}
        </button>
      ),
    },
    {
      key: 'projectName',
      title: 'Project & Tower',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{row.projectName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{row.buildingName}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Config',
      render: (type) => <span className="font-semibold text-slate-800 text-xs">{type}</span>,
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
      render: (facing) => <span className="text-xs text-slate-500">{facing || '—'}</span>,
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
            options={projects.map((p) => ({ value: p.name, label: p.name }))}
          />

          <Select
            placeholder="All Configurations"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '1 BHK', label: '1 BHK' },
              { value: '2 BHK', label: '2 BHK' },
              { value: '3 BHK', label: '3 BHK' },
              { value: '4 BHK Luxury', label: '4 BHK Luxury' },
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
              { value: UNIT_STATUS.AVAILABLE, label: 'Available Only' },
              { value: UNIT_STATUS.BOOKED, label: 'Booked Only' },
              { value: UNIT_STATUS.BLOCKED, label: 'Blocked Only' },
            ]}
          />
        </div>

        {(searchTerm || projectFilter || typeFilter || statusFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{filteredUnits.length}</strong> matching units
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

      {/* Inventory Table */}
      <div className="space-y-3">
        <Table
          columns={columns}
          data={paginatedUnits}
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
        title={`Unit ${inspectedUnit?.unitNumber} Details`}
        description={`${inspectedUnit?.projectName} • ${inspectedUnit?.buildingName}`}
        maxWidth="max-w-md"
      >
        {inspectedUnit && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Configuration
                </span>
                <div className="font-bold text-slate-900 mt-0.5">{inspectedUnit.type}</div>
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
                      inspectedUnit.status === UNIT_STATUS.AVAILABLE
                        ? 'badge-available'
                        : inspectedUnit.status === UNIT_STATUS.BOOKED
                        ? 'badge-booked'
                        : 'badge-blocked'
                    }
                  >
                    {inspectedUnit.status}
                  </span>
                </div>
              </div>
            </div>

            {inspectedUnit.status === UNIT_STATUS.BOOKED && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900">
                <span className="font-semibold">Booking Record:</span> Allocated to{' '}
                <strong>{inspectedUnit.bookedBy || 'Client'}</strong> with token deposit of{' '}
                <strong>{formatINR(inspectedUnit.bookedAmount || 1000000)}</strong>.
              </div>
            )}

            {inspectedUnit.status === UNIT_STATUS.BLOCKED && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold">Reason:</span> {inspectedUnit.blockedReason || 'Reserved by Management'}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setInspectedUnit(null)}>
                Close
              </Button>
              {inspectedUnit.status === UNIT_STATUS.AVAILABLE && (
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
      />
    </div>
  );
}

export default UnitListPage;
