import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
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

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, leads, units, updateBookingStatus, cancelBooking } = useCrm();

  const booking = bookings.find((b) => b.id === id);
  const lead = leads.find((l) => l.id === booking?.leadId);
  const unit = units.find((u) => u.unitNumber === booking?.unitNumber && u.projectName === booking?.projectName);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(booking?.status || 'CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState(booking?.paymentStatus || 'TOKEN_RECEIVED');

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!booking) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-500 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The booking reference "{id}" could not be located in the system.
        </p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate('/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_VARIANTS[booking.status] || { variant: 'neutral', label: booking.status };

  const handleSaveStatus = () => {
    updateBookingStatus(booking.id, newStatus, newPaymentStatus);
    setStatusModalOpen(false);
  };

  const handleConfirmCancel = () => {
    cancelBooking(booking.id, cancelReason);
    setCancelModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {booking.id}
              </h1>
              <Badge variant={statusMeta.variant} size="sm" withDot>
                {statusMeta.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Booked on {formatCRMDate(booking.bookedDate)} by {booking.bookedBy}
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
              setNewStatus(booking.status);
              setNewPaymentStatus(booking.paymentStatus || 'TOKEN_RECEIVED');
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
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                Property & Allotted Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{booking.projectName}</h3>
                  <p className="text-xs text-slate-500">{booking.buildingName}</p>
                </div>
                <Badge variant="brand" size="md">
                  Unit {booking.unitNumber}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Typology</span>
                  <span className="font-semibold text-slate-800">{booking.unitType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Carpet Area</span>
                  <span className="font-semibold text-slate-800">{booking.area}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Floor Level</span>
                  <span className="font-semibold text-slate-800">
                    {unit?.floor ? `${unit.floor}th Floor` : 'Floor Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Facing</span>
                  <span className="font-semibold text-slate-800">{unit?.facing || 'East'}</span>
                </div>
              </div>

              {unit?.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{unit.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Financial Milestone Schedule */}
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Payment & Allotment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">Base Property Value</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(Math.round(booking.totalPrice * 0.9))}
                  </span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">Covered Car Parking & Club Membership</span>
                  <span className="font-semibold text-slate-900">₹4,50,000</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-600">GST (5%) & Legal Processing Charges</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(Math.round(booking.totalPrice * 0.05))}
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50/80 font-bold text-slate-900">
                  <span>Total Agreement Price</span>
                  <span className="text-base text-brand-600">{formatINR(booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between p-4 bg-emerald-50 text-emerald-900 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Booking Token Paid</span>
                  </div>
                  <span className="text-base text-emerald-700">
                    {formatINR(booking.bookingAmount)}
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 text-slate-700">
                  <span>Balance Payable at Agreement Execution</span>
                  <span className="font-bold">
                    {formatINR((booking.totalPrice || 0) - (booking.bookingAmount || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Customer & Sales Audit */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                Customer Dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-bold text-sm text-slate-900">{booking.customerName}</div>

              {lead ? (
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="pt-2">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-xs font-semibold text-brand-600 hover:underline block"
                    >
                      View Full CRM Lead Profile →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500">Walk-in direct reservation</div>
              )}
            </CardContent>
          </Card>

          {/* Allotment Terms & Signoff */}
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Booking Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Handled By:</span>
                <span className="font-semibold text-slate-800">{booking.bookedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Allotment Date:</span>
                <span className="font-semibold text-slate-800">
                  {formatCRMDate(booking.bookedDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Payment Status:</span>
                <Badge variant="brand" size="xs">
                  {booking.paymentStatus || 'TOKEN_RECEIVED'}
                </Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 mt-2">
                This booking reservation is logged securely in the Real Estate CRM system.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Modal */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Update Status #${booking.id}`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Status
              </label>
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="AGREEMENT_DONE">Agreement Done</option>
                <option value="PENDING_DOCS">Pending Documents</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Milestone
              </label>
              <Select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)}>
                <option value="TOKEN_RECEIVED">Token Received</option>
                <option value="PARTIAL_TOKEN">Partial Token</option>
                <option value="AGREEMENT_DONE">Agreement Stage Paid</option>
                <option value="PENDING">Pending</option>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveStatus}>
                Update Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Booking"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              Cancelling booking <strong>{booking.id}</strong> will restore unit{' '}
              <strong>{booking.unitNumber}</strong> back to available inventory.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation
              </label>
              <Input
                placeholder="e.g. Buyer opted for another tower..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setCancelModalOpen(false)}>
                Keep
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

export default BookingDetailPage;
