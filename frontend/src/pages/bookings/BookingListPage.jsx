import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  BookmarkCheck,
  Building2,
  Calendar,
  User,
  Layers,
  FileCheck,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Printer,
  Receipt,
  Download,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatINR, formatINRCompact, formatCRMDate } from '../../utils/crmFormatters';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_VARIANTS = {
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  AGREEMENT_DONE: { variant: 'brand', label: 'Agreement Done' },
  PENDING_DOCS: { variant: 'warning', label: 'Pending Docs' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const PAYMENT_VARIANTS = {
  TOKEN_RECEIVED: { variant: 'success', label: 'Token Received' },
  AGREEMENT_DONE: { variant: 'brand', label: 'Agreement Paid' },
  PARTIAL_TOKEN: { variant: 'warning', label: 'Partial Token' },
  PENDING: { variant: 'neutral', label: 'Payment Pending' },
};

export function BookingListPage() {
  const navigate = useNavigate();
  const { bookings = [], projects = [], employees = [], updateBookingStatus, cancelBooking } = useCrm();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Booking for Receipt / Detail Modal
  const [inspectBooking, setInspectBooking] = useState(null);

  // Status Change Modal
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');

  // Cancel Booking Modal
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  // Derived KPI Metrics
  const activeBookings = safeBookings.filter((b) => b && b.status !== 'CANCELLED');
  const totalValue = activeBookings.reduce((sum, b) => sum + (Number(b?.totalPrice) || 0), 0);
  const totalTokens = activeBookings.reduce((sum, b) => sum + (Number(b?.bookingAmount) || 0), 0);
  const avgTicket = activeBookings.length ? Math.round(totalValue / activeBookings.length) : 0;

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return safeBookings
      .filter((booking) => {
        if (!booking) return false;
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = (booking.id || '').toLowerCase().includes(q);
          const matchesCustomer = (booking.customerName || '').toLowerCase().includes(q);
          const matchesUnit = (booking.unitNumber || '').toLowerCase().includes(q);
          const matchesProject = (booking.projectName || '').toLowerCase().includes(q);
          if (!matchesId && !matchesCustomer && !matchesUnit && !matchesProject) return false;
        }

        // Project Filter
        if (projectFilter && booking.projectId !== projectFilter) return false;

        // Status Filter
        if (statusFilter && booking.status !== statusFilter) return false;

        // Agent Filter
        if (agentFilter && booking.bookedBy !== agentFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a?.bookedDate ? new Date(a.bookedDate) : new Date(0);
        const dateB = b?.bookedDate ? new Date(b.bookedDate) : new Date(0);
        if (sortBy === 'date-desc') return dateB - dateA;
        if (sortBy === 'date-asc') return dateA - dateB;
        if (sortBy === 'price-desc') return (b?.totalPrice || 0) - (a?.totalPrice || 0);
        if (sortBy === 'price-asc') return (a?.totalPrice || 0) - (b?.totalPrice || 0);
        return 0;
      });
  }, [safeBookings, searchQuery, projectFilter, statusFilter, agentFilter, sortBy]);

  // Paginated Rows
  const totalRecords = filteredBookings.length;
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBookings.slice(startIndex, startIndex + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  const hasActiveFilters = Boolean(searchQuery || projectFilter || statusFilter || agentFilter);

  const resetFilters = () => {
    setSearchQuery('');
    setProjectFilter('');
    setStatusFilter('');
    setAgentFilter('');
    setCurrentPage(1);
  };

  // Handlers
  const openStatusModal = (booking) => {
    setStatusModalBooking(booking);
    setNewStatus(booking.status);
    setNewPaymentStatus(booking.paymentStatus || 'TOKEN_RECEIVED');
  };

  const handleSaveStatus = () => {
    if (!statusModalBooking) return;
    updateBookingStatus(statusModalBooking.id, newStatus, newPaymentStatus);
    setStatusModalBooking(null);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    cancelBooking(cancelModalBooking.id, cancelReason);
    setCancelModalBooking(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Bookings Management
            </h1>
            <Badge variant="neutral" size="sm">
              {bookings.length} Registered
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Track committed inventory, token deposit milestones, and customer sale agreements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/bookings/new')}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Bookings</span>
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <BookmarkCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{bookings.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{activeBookings.length} Active</span> (
            {bookings.length - activeBookings.length} Cancelled)
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Sales Value</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatINRCompact(totalValue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Committed real estate inventory</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tokens Collected</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatINRCompact(totalTokens)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Immediate booking deposits</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Ticket Size</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatINRCompact(avgTicket)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across all active properties</div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border border-slate-200 shadow-none bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-4">
              <Input
                placeholder="Search booking ID, buyer, unit #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                isClearable
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* Project Filter */}
            <div className="lg:col-span-2">
              <Select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="AGREEMENT_DONE">Agreement Done</option>
                <option value="PENDING_DOCS">Pending Docs</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            {/* Sales Agent Filter */}
            <div className="lg:col-span-2">
              <Select
                value={agentFilter}
                onChange={(e) => {
                  setAgentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Agents</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Sort Order */}
            <div className="lg:col-span-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
              </Select>
            </div>
          </div>

          {/* Active Filter Chips bar */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Active Filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Query: "{searchQuery}"
                  </span>
                )}
                {projectFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Project: {projects.find((p) => p.id === projectFilter)?.name}
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Status: {statusFilter}
                  </span>
                )}
                {agentFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                    Agent: {agentFilter}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-brand-600 hover:text-brand-700 font-medium underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Data Table */}
      {paginatedBookings.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title={hasActiveFilters ? 'No matching bookings found' : 'No bookings recorded yet'}
          description={
            hasActiveFilters
              ? 'Try clearing or changing your search criteria to find matching booking records.'
              : 'Commit your first customer unit reservation through the 4-step booking workflow.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create New Booking'}
          onAction={hasActiveFilters ? resetFilters : () => navigate('/bookings/new')}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Property & Unit</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Token Deposit</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date & Agent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedBookings.map((booking) => {
                  const statusMeta = STATUS_VARIANTS[booking.status] || {
                    variant: 'neutral',
                    label: booking.status,
                  };
                  const paymentMeta = PAYMENT_VARIANTS[booking.paymentStatus] || {
                    variant: 'neutral',
                    label: booking.paymentStatus || 'Pending',
                  };

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Booking Ref */}
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">
                        <button
                          type="button"
                          onClick={() => setInspectBooking(booking)}
                          className="hover:underline flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600" />
                          {booking.id}
                        </button>
                      </td>

                      {/* Customer / Lead */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{booking.customerName}</div>
                        {booking.leadId && (
                          <Link
                            to={`/leads/${booking.leadId}`}
                            className="text-[11px] text-brand-600 hover:underline flex items-center gap-0.5"
                          >
                            <User className="w-3 h-3" />
                            View Profile
                          </Link>
                        )}
                      </td>

                      {/* Property & Unit */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{booking.projectName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{booking.unitNumber}</span>
                          <span>•</span>
                          <span>{booking.buildingName}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {booking.unitType}
                          </span>
                        </div>
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatINR(booking.totalPrice)}
                      </td>

                      {/* Token Deposit */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-700">
                          {formatINR(booking.bookingAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(((booking.bookingAmount || 0) / (booking.totalPrice || 1)) * 100)}% of total
                        </div>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3 px-4">
                        <Badge variant={statusMeta.variant} size="sm" withDot>
                          {statusMeta.label}
                        </Badge>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <Badge variant={paymentMeta.variant} size="sm">
                          {paymentMeta.label}
                        </Badge>
                      </td>

                      {/* Date & Agent */}
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div>{formatCRMDate(booking.bookedDate)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          by {booking.bookedBy}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setInspectBooking(booking)}
                            title="Inspect Receipt & Breakdown"
                          >
                            Receipt
                          </Button>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openStatusModal(booking)}
                            title="Update Booking Status"
                          >
                            Status
                          </Button>

                          {booking.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => setCancelModalBooking(booking)}
                              title="Cancel Booking & Release Unit"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: Full Booking Receipt Dossier Modal */}
      {inspectBooking && (
        <Modal
          isOpen={Boolean(inspectBooking)}
          onClose={() => setInspectBooking(null)}
          title={`Booking Receipt #${inspectBooking.id}`}
          size="lg"
        >
          <div className="space-y-6 text-slate-800">
            {/* Printable Receipt Card */}
            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50 space-y-6 print:border-none print:p-0">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-brand-600 text-white font-bold">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        REAL ESTATE CRM
                      </h2>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                        Official Booking Acknowledgement
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    Ref: {inspectBooking.id}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {formatCRMDate(inspectBooking.bookedDate)}
                  </div>
                  <div className="mt-1">
                    <Badge variant={STATUS_VARIANTS[inspectBooking.status]?.variant || 'neutral'} size="sm">
                      {inspectBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 2-Column Info: Customer & Property */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Information
                  </span>
                  <div className="font-bold text-sm text-slate-900">{inspectBooking.customerName}</div>
                  <div className="text-slate-500">Lead Record: {inspectBooking.leadId || 'Direct Buyer'}</div>
                  <div className="text-slate-500">Booked By Agent: {inspectBooking.bookedBy}</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Property Allotted
                  </span>
                  <div className="font-bold text-sm text-slate-900">{inspectBooking.projectName}</div>
                  <div className="text-slate-500">
                    Unit {inspectBooking.unitNumber} • {inspectBooking.buildingName}
                  </div>
                  <div className="text-slate-500">
                    Typology: {inspectBooking.unitType} ({inspectBooking.area})
                  </div>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                <div className="bg-slate-100/75 px-4 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Financial Milestone Breakdown
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Base Unit Agreement Price</span>
                    <span className="font-medium text-slate-900">
                      {formatINR(Math.round(inspectBooking.totalPrice * 0.9))}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Car Parking & Clubhouse Amenities</span>
                    <span className="font-medium text-slate-900">₹4,50,000</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Statutory GST (5%) & Legal Charges</span>
                    <span className="font-medium text-slate-900">
                      {formatINR(Math.round(inspectBooking.totalPrice * 0.05))}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-slate-50 font-bold text-slate-900 text-sm">
                    <span>Total Agreed Allotment Value</span>
                    <span>{formatINR(inspectBooking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">
                    <span>Initial Booking Token Received</span>
                    <span className="text-base">{formatINR(inspectBooking.bookingAmount)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 bg-slate-50/50 text-slate-700">
                    <span>Balance Due Upon Sale Agreement Execution</span>
                    <span className="font-semibold">
                      {formatINR((inspectBooking.totalPrice || 0) - (inspectBooking.bookingAmount || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Verification Notice */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Allotment Confirmation Note:</strong> This acknowledgement confirms unit reservation
                  subject to document verification and execution of the formal agreement of sale within 15 days.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInspectBooking(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setInspectBooking(null);
                    openStatusModal(inspectBooking);
                  }}
                >
                  Change Status
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Quick Status Update Modal */}
      {statusModalBooking && (
        <Modal
          isOpen={Boolean(statusModalBooking)}
          onClose={() => setStatusModalBooking(null)}
          title={`Update Booking #${statusModalBooking.id}`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="AGREEMENT_DONE">Agreement Done</option>
                <option value="PENDING_DOCS">Pending Documents</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Milestone Status
              </label>
              <Select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
              >
                <option value="TOKEN_RECEIVED">Token Received</option>
                <option value="PARTIAL_TOKEN">Partial Token</option>
                <option value="AGREEMENT_DONE">Agreement Stage Paid</option>
                <option value="PENDING">Payment Pending</option>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setStatusModalBooking(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveStatus}>
                Update Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Cancel Booking Confirmation */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => setCancelModalBooking(null)}
          title="Cancel Booking & Release Unit"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                Are you sure you want to cancel booking <strong>{cancelModalBooking.id}</strong> for{' '}
                <strong>{cancelModalBooking.customerName}</strong>? This will release unit{' '}
                <strong>{cancelModalBooking.unitNumber}</strong> back to <strong>AVAILABLE</strong> status.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason
              </label>
              <Input
                placeholder="e.g. Loan rejection, customer opted out..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setCancelModalBooking(null)}>
                Keep Booking
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default BookingListPage;
