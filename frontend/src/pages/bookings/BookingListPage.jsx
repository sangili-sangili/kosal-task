import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { downloadElementAsPdf } from '../../utils/pdfExport';
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
  RotateCcw,
  Phone,
  Mail,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { propertyService } from '../../services/propertyService';
import { userService } from '../../services/userService';
import { formatINR, formatINRCompact, formatCRMDate } from '../../utils/crmFormatters';
import { exportBookingsToExcel } from '../../utils/excelExport';
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
  AGREEMENT_PAID: { variant: 'brand', label: 'Agreement Paid' },
  PARTIAL_TOKEN: { variant: 'warning', label: 'Partial Token' },
  PENDING: { variant: 'neutral', label: 'Payment Pending' },
};

export function BookingListPage() {
  const navigate = useNavigate();

  // Live Bookings State
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [inspectBooking, setInspectBooking] = useState(null);
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Three-dot dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openDropdownId]);

  // Toast feedback state
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // PDF Download Handler
  const handleDownloadReceiptPdf = async (booking) => {
    // Open the receipt modal first so the DOM element exists
    setInspectBooking(booking);
    // Small delay to allow modal to render
    setTimeout(async () => {
      setIsPdfDownloading(true);
      const ref = booking.booking_reference || `BK-${booking.id}`;
      await downloadElementAsPdf('booking-receipt-print-area', `Receipt_${ref}`);
      setIsPdfDownloading(false);
      showFeedback(`PDF receipt downloaded for ${ref}!`);
    }, 400);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load auxiliary lists for filters (Projects and Agents)
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [projsRes, usersRes] = await Promise.allSettled([
          propertyService.getProjects(),
          userService.getUsers ? userService.getUsers() : Promise.resolve([]),
        ]);
        if (projsRes.status === 'fulfilled') {
          setProjects(Array.isArray(projsRes.value) ? projsRes.value : []);
        }
        if (usersRes.status === 'fulfilled') {
          const uList = usersRes.value?.users || (Array.isArray(usersRes.value) ? usersRes.value : []);
          setUsers(uList);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Fetch paginated bookings from live MySQL backend API
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let sortField = 'created_at';
      let sortOrder = 'DESC';

      if (sortBy === 'date-asc') {
        sortField = 'booking_date';
        sortOrder = 'ASC';
      } else if (sortBy === 'date-desc') {
        sortField = 'booking_date';
        sortOrder = 'DESC';
      } else if (sortBy === 'price-desc') {
        sortField = 'amount';
        sortOrder = 'DESC';
      } else if (sortBy === 'price-asc') {
        sortField = 'amount';
        sortOrder = 'ASC';
      }

      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        project_id: projectFilter || undefined,
        status: statusFilter || undefined,
        agent_id: agentFilter || undefined,
        sort: sortField,
        order: sortOrder,
      };

      const res = await bookingService.getBookings(params);
      const rows = res.bookings || [];
      setBookings(rows);
      setTotalRecords(res.pagination?.total !== undefined ? res.pagination.total : rows.length);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setFetchError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, projectFilter, statusFilter, agentFilter, sortBy]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Derived KPI Metrics from live loaded dataset
  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b && b.status !== 'CANCELLED');
  }, [bookings]);

  const totalValue = useMemo(() => {
    return activeBookings.reduce((sum, b) => {
      const price = Number(b.unit?.price) || Number(b.amount) || 0;
      return sum + price;
    }, 0);
  }, [activeBookings]);

  const totalTokens = useMemo(() => {
    return activeBookings.reduce((sum, b) => {
      const token = Number(b.amount) || 0;
      return sum + token;
    }, 0);
  }, [activeBookings]);

  const avgTicket = activeBookings.length ? Math.round(totalValue / activeBookings.length) : 0;

  const hasActiveFilters = Boolean(searchQuery || projectFilter || statusFilter || agentFilter);

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setProjectFilter('');
    setStatusFilter('');
    setAgentFilter('');
    setCurrentPage(1);
  };

  // Status Modal Handlers
  const openStatusModal = (booking) => {
    setStatusModalBooking(booking);
    setNewStatus(booking.status || 'CONFIRMED');
    setNewPaymentStatus(booking.payment_status || 'TOKEN_RECEIVED');
  };

  const handleSaveStatus = async () => {
    if (!statusModalBooking) return;
    setIsUpdatingStatus(true);
    try {
      await bookingService.updateBookingStatus(statusModalBooking.id, {
        status: newStatus,
        payment_status: newPaymentStatus,
      });
      showFeedback(`Booking ${statusModalBooking.booking_reference || statusModalBooking.id} updated successfully!`);
      setStatusModalBooking(null);
      fetchBookings();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showFeedback(err.message || 'Failed to update booking status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Cancel Booking Handlers
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(cancelModalBooking.id, cancelReason);
      showFeedback(
        `Booking ${cancelModalBooking.booking_reference || cancelModalBooking.id} cancelled. Unit released back to Available inventory!`
      );
      setCancelModalBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      showFeedback(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Export to Excel Handler
  const handleExportToExcel = async () => {
    try {
      const res = await bookingService.getBookings({
        limit: 1000,
        search: debouncedSearch.trim() || undefined,
        project_id: projectFilter || undefined,
        status: statusFilter || undefined,
        agent_id: agentFilter || undefined,
      });
      const exportList = res.bookings?.length > 0 ? res.bookings : bookings;
      if (!exportList || exportList.length === 0) {
        showFeedback('No bookings available to export.', 'error');
        return;
      }
      exportBookingsToExcel(exportList);
      showFeedback(`Successfully exported ${exportList.length} booking${exportList.length === 1 ? '' : 's'} to Excel!`);
    } catch (err) {
      console.error('Failed to export bookings:', err);
      showFeedback('Failed to export bookings to Excel.', 'error');
    }
  };

  // Project dropdown options
  const projectOptions = useMemo(() => {
    return [
      { value: '', label: 'All Projects' },
      ...projects.map((p) => ({ value: String(p.id), label: p.name })),
    ];
  }, [projects]);

  // Status dropdown options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'AGREEMENT_DONE', label: 'Agreement Done' },
    { value: 'PENDING_DOCS', label: 'Pending Documents' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  // Agent dropdown options
  const agentOptions = useMemo(() => {
    const list = [{ value: '', label: 'All Agents' }];
    users.forEach((u) => {
      list.push({ value: String(u.id), label: `${u.name} (${u.role || 'Sales'})` });
    });
    return list;
  }, [users]);

  // Sort dropdown options
  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'price-desc', label: 'Token: High to Low' },
    { value: 'price-asc', label: 'Token: Low to High' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${feedback.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Bookings Management
            </h1>
            <Badge variant="brand" size="xs">
              {totalRecords} Registered
            </Badge>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Track committed inventory, token deposit milestones, and customer sale agreements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Excel Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportToExcel}
            className="border-emerald-300/80 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 font-semibold shadow-2xs transition-all"
            title="Download formatted Excel spreadsheet of bookings"
          >
            Export Excel
          </Button>

          {/* New Booking Button */}
          <Link to="/bookings/create">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <BookmarkCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">{totalRecords}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{activeBookings.length} Active</span> (
            {bookings.length - activeBookings.length} Cancelled)
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gross Sales Value
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">
            {formatINRCompact(totalValue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Committed real estate inventory</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tokens Collected
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">
            {formatINRCompact(totalTokens)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Immediate booking deposits</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Avg Ticket Size
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">
            {formatINRCompact(avgTicket)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across all active properties</div>
        </Card>
      </div>

      {/* Filter & Search Toolbar (Using standard options prop for Select) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4">
            <Input
              placeholder="Search ref (e.g. BK-2026), buyer, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              isSearch
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
              options={projectOptions}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={statusOptions}
            />
          </div>

          {/* Sales Agent Filter */}
          <div className="lg:col-span-2">
            <Select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={agentOptions}
            />
          </div>

          {/* Sort Order */}
          <div className="lg:col-span-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Active Filter Chips bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 border border-slate-200">
                  Search: "{searchQuery}"
                </span>
              )}
              {projectFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 border border-slate-200">
                  Project: {projects.find((p) => String(p.id) === String(projectFilter))?.name}
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 border border-slate-200">
                  Status: {statusFilter}
                </span>
              )}
              {agentFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 border border-slate-200">
                  Agent: {users.find((u) => String(u.id) === String(agentFilter))?.name || agentFilter}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Bookings Data Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading live real estate bookings...</p>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={fetchBookings}>
            Retry Loading
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title={hasActiveFilters ? 'No matching bookings found' : 'No bookings recorded yet'}
          description={
            hasActiveFilters
              ? 'Try clearing or changing your search criteria to find matching booking records.'
              : 'Commit your first customer unit reservation through the 4-step booking workflow.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create New Booking'}
          onAction={hasActiveFilters ? resetFilters : () => navigate('/bookings/create')}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs">
                  <th className="py-3 px-4 whitespace-nowrap">Booking Ref</th>
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
                {bookings.map((booking) => {
                  const lead = booking.lead || {};
                  const unit = booking.unit || {};
                  const building = unit.building || {};
                  const project = building.project || {};
                  const agent = booking.bookedBy || {};

                  const refCode = booking.booking_reference || `BK-${booking.id}`;
                  const customerName = lead.name || 'Allotted Prospect';
                  const projectName = project.name || 'Residential Development';
                  const buildingName = building.name || 'Tower Block';
                  const unitNumber = unit.unit_number || 'N/A';
                  const unitType = unit.unit_type || 'Unit';

                  const totalPrice = Number(unit.price) || Number(booking.amount) || 0;
                  const tokenAmount = Number(booking.amount) || 0;
                  const tokenPct = totalPrice > 0 ? Math.round((tokenAmount / totalPrice) * 100) : 0;

                  const statusMeta = STATUS_VARIANTS[booking.status] || {
                    variant: 'neutral',
                    label: booking.status,
                  };
                  const paymentMeta = PAYMENT_VARIANTS[booking.payment_status] || {
                    variant: 'neutral',
                    label: booking.payment_status || 'Token Received',
                  };

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Booking Ref */}
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectBooking(booking)}
                          className="text-brand-700 hover:text-brand-900 bg-brand-50/80 hover:bg-brand-100/80 px-2.5 py-1 rounded-lg border border-brand-200/80 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs text-xs"
                          title="Click to view full Booking Receipt Dossier"
                        >
                          <Receipt className="w-3.5 h-3.5 text-brand-600" />
                          <span>{refCode}</span>
                        </button>
                      </td>

                      {/* Customer / Lead */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {customerName}
                        </div>
                        {lead.id ? (
                          <Link
                            to={`/leads/${lead.id}`}
                            className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <User className="w-3 h-3 text-slate-400" />
                            <span>View Lead Profile</span>
                          </Link>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">Direct Registration</div>
                        )}
                        {lead.phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {lead.phone}
                          </div>
                        )}
                      </td>

                      {/* Property & Unit */}
                      <td className="py-3 px-4">
                        {project.id ? (
                          <Link
                            to={`/properties/${project.id}`}
                            className="font-semibold text-slate-900 hover:text-brand-600 transition-colors text-xs flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{projectName}</span>
                          </Link>
                        ) : (
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{projectName}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-brand-700 bg-slate-100 px-1.5 py-0.2 rounded">
                            {unitNumber}
                          </span>
                          <span>•</span>
                          <span>{buildingName}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {unitType}
                          </span>
                        </div>
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                          {formatINRCompact(totalPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatINR(totalPrice)}</div>
                      </td>

                      {/* Token Deposit */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700 font-mono text-xs sm:text-sm">
                          {formatINR(tokenAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tokenPct}% of allotment value
                        </div>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3 px-4">
                        <Badge variant={statusMeta.variant} size="xs" dot>
                          {statusMeta.label}
                        </Badge>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <Badge variant={paymentMeta.variant} size="xs">
                          {paymentMeta.label}
                        </Badge>
                      </td>

                      {/* Date & Agent */}
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div className="font-medium text-slate-700">
                          {formatCRMDate(booking.booking_date || booking.createdAt)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          by {agent.name || 'Sales Agent'}
                        </div>
                      </td>

                      {/* Actions — Three-Dot Dropdown */}
                      <td className="py-3 px-4 text-right">
                        <div className="relative flex items-center justify-end" ref={openDropdownId === booking.id ? dropdownRef : null}>
                          <button
                            type="button"
                            id={`action-menu-${booking.id}`}
                            onClick={() => setOpenDropdownId(openDropdownId === booking.id ? null : booking.id)}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === booking.id && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white border border-slate-200/90 rounded-xl shadow-modal overflow-hidden animate-in fade-in slide-in-from-top-1">
                              {/* View Full Details */}
                              <Link
                                to={`/bookings/${booking.id}`}
                                onClick={() => setOpenDropdownId(null)}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                View Full Details
                              </Link>

                              {/* View Receipt Modal */}
                              <button
                                type="button"
                                onClick={() => { setInspectBooking(booking); setOpenDropdownId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                View Receipt
                              </button>

                              {/* Download PDF */}
                              <button
                                type="button"
                                onClick={() => { setOpenDropdownId(null); handleDownloadReceiptPdf(booking); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                Download PDF Receipt
                              </button>

                              <div className="border-t border-slate-100 my-0.5" />

                              {/* Update Status */}
                              <button
                                type="button"
                                onClick={() => { openStatusModal(booking); setOpenDropdownId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                Update Status
                              </button>

                              {/* Cancel Booking */}
                              {booking.status !== 'CANCELLED' && (
                                <>
                                  <div className="border-t border-slate-100 my-0.5" />
                                  <button
                                    type="button"
                                    onClick={() => { setCancelModalBooking(booking); setOpenDropdownId(null); }}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    Cancel Booking
                                  </button>
                                </>
                              )}
                            </div>
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
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, totalRecords)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalRecords}</span> bookings
            </div>
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

      {/* MODAL 1: Professional Printable Booking Receipt Dossier */}
      {inspectBooking && (
        <Modal
          isOpen={Boolean(inspectBooking)}
          onClose={() => setInspectBooking(null)}
          title={`Booking Acknowledgement Receipt`}
          description={`Ref: ${inspectBooking.booking_reference || `BK-${inspectBooking.id}`}`}
          size="lg"
        >
          <div className="space-y-5 text-slate-800">
            {/* Printable Container */}
            <div
              id="booking-receipt-print-area"
              className="p-6 border border-slate-200/90 rounded-2xl bg-white space-y-6 shadow-xs"
              style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
            >
              {/* Receipt Top Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-4">
                {/* Left: Logo + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-xl bg-brand-600 text-white font-bold shadow-xs shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                      ENTERPRISE REAL ESTATE CRM
                    </h2>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
                      Official Unit Allotment &amp; Booking Receipt
                    </p>
                  </div>
                </div>

                {/* Right: Reference block — fixed width, never overflows */}
                <div className="text-right shrink-0" style={{ minWidth: 0, maxWidth: '45%' }}>
                  <div
                    className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200/80 block w-full truncate"
                  >
                    {inspectBooking.booking_reference || `BK-${inspectBooking.id}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Date: {formatCRMDate(inspectBooking.booking_date || inspectBooking.createdAt)}
                  </div>
                  <div className="mt-1 flex justify-end">
                    <Badge variant={STATUS_VARIANTS[inspectBooking.status]?.variant || 'neutral'} size="xs" dot>
                      {inspectBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 2-Column Info: Customer & Property Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Information
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {inspectBooking.lead?.name || 'Allotted Prospect'}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{inspectBooking.lead?.phone || 'N/A'}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{inspectBooking.lead?.email || 'N/A'}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1">
                    Registered by: <strong>{inspectBooking.bookedBy?.name || 'Sales Representative'}</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Property & Unit Details
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {inspectBooking.unit?.building?.project?.name || 'Development Project'}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {inspectBooking.unit?.building?.name || 'Tower'} • Unit{' '}
                    <strong className="text-brand-700 font-mono">
                      {inspectBooking.unit?.unit_number || 'N/A'}
                    </strong>
                  </div>
                  <div className="text-slate-500">
                    Typology: {inspectBooking.unit?.unit_type || 'Luxury Unit'}
                  </div>
                  <div className="text-slate-500">
                    Super Area: {inspectBooking.unit?.area || '1650'} sq ft (Floor: {inspectBooking.unit?.floor || '1'}th)
                  </div>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                <div className="bg-slate-100/75 px-4 py-2.5 font-semibold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                  <span>Financial Milestone Breakdown</span>
                  <span className="text-[11px] font-mono text-slate-500">Currency: INR (₹)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Base Unit Agreement Value</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatINR(
                        Math.round((Number(inspectBooking.unit?.price) || Number(inspectBooking.amount) || 0) * 0.9)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Car Parking, Infrastructure & Amenities</span>
                    <span className="font-medium text-slate-900 font-mono">₹4,50,000</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600">Statutory GST & Legal Documentation</span>
                    <span className="font-medium text-slate-900 font-mono">
                      {formatINR(
                        Math.round((Number(inspectBooking.unit?.price) || Number(inspectBooking.amount) || 0) * 0.05)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-slate-50/80 font-bold text-slate-900 text-sm">
                    <span>Total Agreed Allotment Value</span>
                    <span className="font-mono">
                      {formatINR(Number(inspectBooking.unit?.price) || Number(inspectBooking.amount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">
                    <span>Initial Booking Token Received</span>
                    <span className="text-sm font-mono">{formatINR(inspectBooking.amount)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 bg-slate-50/50 text-slate-700">
                    <span>Balance Due Upon Sale Agreement Execution</span>
                    <span className="font-semibold font-mono">
                      {formatINR(
                        Math.max(
                          0,
                          (Number(inspectBooking.unit?.price) || Number(inspectBooking.amount) || 0) -
                          (Number(inspectBooking.amount) || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Disclaimer Note */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Allotment Confirmation Note:</strong> This acknowledgement confirms unit reservation
                  subject to KYC document verification and execution of the formal agreement of sale within 15 days.
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4 text-indigo-500" />}
                  className="border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100"
                  disabled={isPdfDownloading}
                  onClick={async () => {
                    setIsPdfDownloading(true);
                    const ref = inspectBooking.booking_reference || `BK-${inspectBooking.id}`;
                    await downloadElementAsPdf('booking-receipt-print-area', `Receipt_${ref}`);
                    setIsPdfDownloading(false);
                    showFeedback(`PDF receipt for ${ref} downloaded!`);
                  }}
                >
                  {isPdfDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInspectBooking(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = inspectBooking;
                    setInspectBooking(null);
                    openStatusModal(target);
                  }}
                >
                  Change Status
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Quick Status & Payment Update Modal */}
      {statusModalBooking && (
        <Modal
          isOpen={Boolean(statusModalBooking)}
          onClose={() => !isUpdatingStatus && setStatusModalBooking(null)}
          title={`Update Booking #${statusModalBooking.booking_reference || statusModalBooking.id}`}
          description="Update lifecycle allotment milestone and payment state"
          size="sm"
        >
          <div className="space-y-4">
            <Select
              label="Booking Lifecycle Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={statusOptions.filter((o) => o.value !== '')}
            />

            <Select
              label="Payment Milestone Status"
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value)}
              options={[
                { value: 'TOKEN_RECEIVED', label: 'Token Received' },
                { value: 'PARTIAL_TOKEN', label: 'Partial Token' },
                { value: 'AGREEMENT_PAID', label: 'Agreement Stage Paid' },
                { value: 'PENDING', label: 'Payment Pending' },
              ]}
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => setStatusModalBooking(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={handleSaveStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Cancel Booking Confirmation with Instant Unit Release */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => !isCancelling && setCancelModalBooking(null)}
          title="Cancel Booking & Release Unit"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Confirm Booking Cancellation</p>
                <p className="text-[11px] text-rose-700/90 mt-0.5">
                  Are you sure you want to cancel booking{' '}
                  <strong>{cancelModalBooking.booking_reference || cancelModalBooking.id}</strong>?
                  Unit <strong>{cancelModalBooking.unit?.unit_number || 'allotted unit'}</strong> will be
                  automatically released back to <strong>AVAILABLE</strong> in the property catalog.
                </p>
              </div>
            </div>

            <div>
              <Input
                label="Cancellation Reason"
                placeholder="e.g. Loan rejection, customer opted out..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                disabled={isCancelling}
                onClick={() => setCancelModalBooking(null)}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default BookingListPage;
