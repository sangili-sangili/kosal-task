import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Layers,
  FileCheck,
  ShieldCheck,
  Printer,
  Receipt,
  Download,
  AlertCircle,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { formatINR, formatINRCompact, formatCRMDate } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';

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

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState('TOKEN_RECEIVED');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Toast feedback state
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data);
      setNewStatus(data.status || 'CONFIRMED');
      setNewPaymentStatus(data.payment_status || 'TOKEN_RECEIVED');
    } catch (err) {
      console.error('Failed to load booking details:', err);
      setFetchError(err.message || 'Failed to locate booking record');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleSaveStatus = async () => {
    if (!booking) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await bookingService.updateBookingStatus(booking.id, {
        status: newStatus,
        payment_status: newPaymentStatus,
      });
      setBooking(updated);
      showFeedback('Booking status updated successfully!');
      setStatusModalOpen(false);
    } catch (err) {
      console.error('Failed to update status:', err);
      showFeedback(err.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id, cancelReason);
      setBooking(updated);
      showFeedback('Booking cancelled and unit released back to Available inventory!');
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      showFeedback(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading allotment dossier from live MySQL database...</p>
      </div>
    );
  }

  if (fetchError || !booking) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-500 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          {fetchError || `The booking reference "${id}" could not be located.`}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchBooking}>
            Retry
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const lead = booking.lead || {};
  const unit = booking.unit || {};
  const building = unit.building || {};
  const project = building.project || {};
  const agent = booking.bookedBy || {};

  const refCode = booking.booking_reference || `BK-${booking.id}`;
  const statusMeta = STATUS_VARIANTS[booking.status] || { variant: 'neutral', label: booking.status };
  const paymentMeta = PAYMENT_VARIANTS[booking.payment_status] || {
    variant: 'neutral',
    label: booking.payment_status || 'Token Received',
  };

  const totalPrice = Number(unit.price) || Number(booking.amount) || 0;
  const tokenAmount = Number(booking.amount) || 0;
  const balanceDue = Math.max(0, totalPrice - tokenAmount);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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

      {/* Top Back Navigation Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/bookings')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {refCode}
              </h1>
              <Badge variant={statusMeta.variant} size="xs" dot>
                {statusMeta.label}
              </Badge>
              <Badge variant={paymentMeta.variant} size="xs">
                {paymentMeta.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Booked on {formatCRMDate(booking.booking_date || booking.createdAt)} by{' '}
              <strong className="text-slate-700">{agent.name || 'Sales Staff'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(booking.status || 'CONFIRMED');
              setNewPaymentStatus(booking.payment_status || 'TOKEN_RECEIVED');
              setStatusModalOpen(true);
            }}
          >
            Update Status
          </Button>
          {booking.status !== 'CANCELLED' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Specs & Financial Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unit & Property Details Card */}
          <Card className="border border-slate-200/90 shadow-subtle bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                Property & Allotted Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  {project.id ? (
                    <Link
                      to={`/properties/${project.id}`}
                      className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      {project.name || 'Residential Development'}
                    </Link>
                  ) : (
                    <h2 className="text-base font-bold text-slate-900">
                      {project.name || 'Residential Development'}
                    </h2>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{project.location || 'Premium Residential'}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/80">
                    Unit {unit.unit_number || 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{building.name || 'Tower Block'}</div>
                </div>
              </div>

              {/* Unit Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Typology</span>
                  <div className="font-bold text-slate-900 mt-0.5">{unit.unit_type || 'Luxury Unit'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Floor Level</span>
                  <div className="font-bold text-slate-900 mt-0.5">{unit.floor || '1'}th Floor</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Super Area</span>
                  <div className="font-bold text-slate-900 mt-0.5">{unit.area || '1650'} sq ft</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balcony Facing</span>
                  <div className="font-bold text-slate-900 mt-0.5">{unit.facing || 'East'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Calculation Table */}
          <Card className="border border-slate-200/90 shadow-subtle bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Financial Milestone & Allotment Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">Base Unit Agreement Price</span>
                  <span className="font-medium text-slate-900 font-mono">
                    {formatINR(Math.round(totalPrice * 0.9))}
                  </span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">Car Parking & Clubhouse Infrastructure</span>
                  <span className="font-medium text-slate-900 font-mono">₹4,50,000</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">Statutory GST & Legal Charges</span>
                  <span className="font-medium text-slate-900 font-mono">
                    {formatINR(Math.round(totalPrice * 0.05))}
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50/80 font-bold text-slate-900 text-sm">
                  <span>Total Agreed Allotment Value</span>
                  <span className="font-mono">{formatINR(totalPrice)}</span>
                </div>
                <div className="flex justify-between p-4 bg-emerald-50 text-emerald-800 font-bold">
                  <span>Initial Booking Token Received</span>
                  <span className="text-sm font-mono">{formatINR(tokenAmount)}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50/50 text-slate-700">
                  <span>Balance Due Upon Sale Agreement Execution</span>
                  <span className="font-semibold font-mono text-slate-900">
                    {formatINR(balanceDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Customer & Sales Staff Dossier */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="border border-slate-200/90 shadow-subtle bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                Customer Allotment Record
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div>
                <div className="text-sm font-bold text-slate-900">{lead.name || 'Allotted Customer'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Pipeline Stage: <span className="font-semibold text-brand-700">{lead.stage || 'BOOKED'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{lead.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{lead.email || 'N/A'}</span>
                </div>
              </div>

              {lead.id && (
                <div className="pt-2">
                  <Link to={`/leads/${lead.id}`}>
                    <Button variant="secondary" size="xs" className="w-full">
                      View Full Customer CRM Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Lifecycle Summary */}
          <Card className="border border-slate-200/90 shadow-subtle bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                Booking Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Booked By:</span>
                <span className="font-semibold text-slate-900">{agent.name || 'Direct Sales'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agent Role:</span>
                <span className="font-mono text-slate-700">{agent.role || 'SALES'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Date:</span>
                <span className="font-medium text-slate-900">
                  {formatCRMDate(booking.booking_date || booking.createdAt)}
                </span>
              </div>
              {booking.cancellation_reason && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] mt-2">
                  <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Status Update Modal */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => !isUpdatingStatus && setStatusModalOpen(false)}
          title={`Update Booking #${refCode}`}
          description="Update lifecycle allotment milestone and payment state"
          size="sm"
        >
          <div className="space-y-4">
            <Select
              label="Booking Lifecycle Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'AGREEMENT_DONE', label: 'Agreement Done' },
                { value: 'PENDING_DOCS', label: 'Pending Documents' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
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
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={handleSaveStatus}
              >
                {isUpdatingStatus ? 'Saving...' : 'Update Booking'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Booking Confirmation with Instant Unit Release */}
      {cancelModalOpen && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => !isCancelling && setCancelModalOpen(false)}
          title="Cancel Booking & Release Unit"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Confirm Booking Cancellation</p>
                <p className="text-[11px] text-rose-700/90 mt-0.5">
                  Are you sure you want to cancel booking <strong>{refCode}</strong>? Unit{' '}
                  <strong>{unit.unit_number || 'Unit'}</strong> will be automatically released back to{' '}
                  <strong>AVAILABLE</strong> in property inventory.
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
                onClick={() => setCancelModalOpen(false)}
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

export default BookingDetailPage;
