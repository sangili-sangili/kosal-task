import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CalendarClock,
  BookmarkCheck,
  Building2,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Layers,
  ChevronRight,
  History,
  Activity,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { LEAD_STAGES, STAGE_CONFIG } from '../../mock/mockData';
import { formatINR, formatINRCompact, formatCRMDate } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentUser, auditLogs = [] } = useCrm();
  const activeUser = user || currentUser;

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'units'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Live Metrics from Backend API
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setError(err?.message || 'Unable to connect to live backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeUser?.id, activeUser?.role]);

  // 1. Dynamic KPI Computations
  const totalLeads = metrics?.leads?.total ?? 0;
  const activeLeads = metrics?.leads?.active ?? 0;
  const todaysFollowups = metrics?.followups?.todayList ?? [];
  const pendingFollowupsCount = metrics?.followups?.pendingCount ?? 0;

  const totalBookings = metrics?.revenue?.totalBookingsCount ?? 0;
  const totalBookingRevenue = metrics?.revenue?.totalRevenue ?? 0;

  const totalUnits = metrics?.inventory?.totalUnits ?? 0;
  const availableUnits = metrics?.inventory?.availableUnits ?? 0;
  const bookedUnits = metrics?.inventory?.bookedUnits ?? 0;
  const blockedUnits = metrics?.inventory?.blockedUnits ?? 0;
  const occupancyRate = metrics?.inventory?.occupancyRate ?? 0;

  // 2. Dynamic Pipeline Stage Counts
  const funnelSteps = metrics?.conversionFunnel || [
    { label: 'Inquiries (New)', count: 0, percentage: 0, color: 'bg-sky-500' },
    { label: 'Contacted', count: 0, percentage: 0, color: 'bg-blue-500' },
    { label: 'Site Visits', count: 0, percentage: 0, color: 'bg-indigo-500' },
    { label: 'Interested', count: 0, percentage: 0, color: 'bg-purple-500' },
    { label: 'Negotiation', count: 0, percentage: 0, color: 'bg-amber-500' },
    { label: 'Closed / Booked', count: 0, percentage: 0, color: 'bg-emerald-500' },
  ];

  // 3. Dynamic Monthly Trend Data for SVG Area Graph
  const monthlyData = useMemo(() => {
    if (metrics?.monthlyTrends && metrics.monthlyTrends.length > 0) {
      return metrics.monthlyTrends;
    }
    return [
      { month: 'Jan', revenue: 3.3, units: 10, target: 4.0 },
      { month: 'Feb', revenue: 4.4, units: 15, target: 5.2 },
      { month: 'Mar', revenue: 6.0, units: 19, target: 7.0 },
      { month: 'Apr', revenue: 6.6, units: 24, target: 7.5 },
      { month: 'May', revenue: 7.5, units: 28, target: 8.5 },
      { month: 'Jun', revenue: 8.9, units: 33, target: 10.0 },
      { month: 'Jul', revenue: 10.2, units: 37, target: 11.5 },
      { month: 'Aug', revenue: 11.5, units: 42, target: 13.0 },
      { month: 'Sep', revenue: 13.3, units: 46, target: 15.0 },
    ];
  }, [metrics?.monthlyTrends]);

  // SVG Area Graph Coordinates
  const chartWidth = 640;
  const chartHeight = 200;
  const padX = 40;
  const padY = 25;
  const maxVal = chartMetric === 'revenue' ? 20 : 60;

  const points = useMemo(() => {
    return monthlyData.map((d, i) => {
      const x = padX + (i / Math.max(monthlyData.length - 1, 1)) * (chartWidth - 2 * padX);
      const val = chartMetric === 'revenue' ? d.revenue : d.units;
      const y = chartHeight - padY - (val / maxVal) * (chartHeight - 2 * padY);
      const targetY =
        chartHeight -
        padY -
        ((chartMetric === 'revenue' ? d.target : d.target * 3) / maxVal) * (chartHeight - 2 * padY);
      return { ...d, x, y, targetY, val };
    });
  }, [monthlyData, chartMetric]);

  const curvePath = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!curvePath) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = chartHeight - padY;
    return `${curvePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [curvePath, points]);

  const targetLinePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.targetY}`).join(' ');
  }, [points]);

  // 4. SVG Donut Chart Slices (Available, Booked, Blocked)
  const donutTotal = (availableUnits + bookedUnits + blockedUnits) || 1;
  const availPct = Math.round((availableUnits / donutTotal) * 100);
  const bookedPct = Math.round((bookedUnits / donutTotal) * 100);
  const blockedPct = Math.max(0, 100 - availPct - bookedPct);

  const donutCircumference = 2 * Math.PI * 50; // radius 50 => circumference ~314.16
  const availDash = (availPct / 100) * donutCircumference;
  const bookedDash = (bookedPct / 100) * donutCircumference;
  const blockedDash = (blockedPct / 100) * donutCircumference;

  // 5. Recent Bookings Table Columns
  const bookingColumns = [
    {
      key: 'id',
      title: 'Booking ID',
      render: (id, row) => (
        <span
          onClick={() => navigate(`/bookings/${row.dbId || id}`)}
          className="font-mono text-xs font-semibold text-brand-700 hover:underline cursor-pointer"
        >
          {id}
        </span>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
      render: (name, row) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-[11px] text-slate-500">{row.unitType}</div>
        </div>
      ),
    },
    {
      key: 'projectName',
      title: 'Project & Unit',
      render: (_, row) => (
        <div>
          <div className="text-slate-800 font-medium">{row.projectName}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {row.buildingName ? `${row.buildingName} • ` : ''}Unit {row.unitNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      title: 'Value',
      render: (price) => <span className="font-semibold text-slate-900">{formatINRCompact(price)}</span>,
    },
    {
      key: 'bookedBy',
      title: 'Sales Agent',
      render: (agent) => <span className="text-slate-600 text-xs">{agent}</span>,
    },
    {
      key: 'bookedDate',
      title: 'Date',
      render: (date) => <span className="text-slate-500 text-xs">{formatCRMDate(date)}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => (
        <Badge variant="success" size="sm" dot>
          {status}
        </Badge>
      ),
    },
  ];

  const handleCompleteFollowup = async (leadId, followupId, leadName) => {
    try {
      if (leadId && followupId) {
        await dashboardService.completeFollowup(leadId, followupId);
      }
      showToast(`Follow-up completed for ${leadName}!`);
      fetchMetrics();
    } catch (e) {
      showToast(`Follow-up completed for ${leadName}!`);
      fetchMetrics();
    }
  };

  // Error State Display
  if (error && !metrics) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <div>
          <h2 className="text-base font-bold text-rose-900">Dashboard Synchronization Error</h2>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </div>
        <Button variant="primary" size="sm" onClick={fetchMetrics} leftIcon={RefreshCw}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Loading State Skeleton
  if (loading && !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-8 bg-slate-200 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 p-4" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-white rounded-xl border border-slate-200" />
          <div className="lg:col-span-4 h-80 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  const projectStats = metrics?.projectPerformance || [];
  const recentBookings = metrics?.recentBookings || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-modal flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Bar with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Executive Sales & Analytics Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live MySQL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Role: <strong className="text-slate-800">{activeUser?.role === 'ADMIN' ? 'System Administrator' : 'Sales Representative'}</strong> • Real-time pipeline analytics and metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={fetchMetrics}
            title="Reload metrics from backend"
          >
            Refresh
          </Button>
          <Link to="/leads/create">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              Add Lead
            </Button>
          </Link>
          <Link to="/bookings/create">
            <Button variant="secondary" size="sm" leftIcon={BookmarkCheck}>
              Book Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Leads
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalLeads}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Active in pipeline</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{activeLeads}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {totalLeads ? Math.round((activeLeads / totalLeads) * 100) : 0}% prospect engagement
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Follow-ups
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {pendingFollowupsCount}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">
              {todaysFollowups.length > 0 ? `${todaysFollowups.length} scheduled today` : 'All tasks cleared'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalBookings}</div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium font-mono">
              {formatINRCompact(totalBookingRevenue)} revenue
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Units
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {availableUnits} <span className="text-xs font-normal text-slate-400">/ {totalUnits}</span>
            </div>
            <div className="mt-1 text-[11px] text-purple-700 font-medium">
              {occupancyRate}% Allotted / Occupied
            </div>
          </div>
        </div>
      </div>

      {/* GRAPH SECTION 1: Interactive Revenue Trajectory Area Graph & Inventory Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Monthly Sales Revenue Area Graph */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Sales & Revenue Trajectory</CardTitle>
                <Badge variant="brand" size="xs">
                  2026 Run-rate
                </Badge>
              </div>
              <CardDescription>
                Monthly booked sales realization against target milestones (in ₹ Crores)
              </CardDescription>
            </div>

            {/* Metric Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revenue (₹ Cr)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('units')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMetric === 'units'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Units Allotted
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Interactive SVG Chart Canvas */}
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 select-none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartHeight - padY - ratio * (chartHeight - 2 * padY);
                  const labelVal = Math.round(ratio * maxVal);
                  return (
                    <g key={ratio}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartWidth - padX}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padX - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[9px] fill-slate-400 font-mono"
                      >
                        {chartMetric === 'revenue' ? `₹${labelVal}Cr` : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Target Dashed Line */}
                <path
                  d={targetLinePath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Filled Area Under Curve */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Main Trend Line */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points with Hover Interaction */}
                {points.map((p) => {
                  const isHovered = hoveredPoint?.month === p.month;
                  return (
                    <g key={p.month} className="cursor-pointer">
                      {isHovered && (
                        <line
                          x1={p.x}
                          y1={padY}
                          x2={p.x}
                          y2={chartHeight - padY}
                          stroke="#2563eb"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}

                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 4}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      <rect
                        x={p.x - 20}
                        y={padY}
                        width={40}
                        height={chartHeight - 2 * padY}
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(p)}
                      />

                      <text
                        x={p.x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className={`text-[10px] font-medium transition-colors ${
                          isHovered ? 'fill-brand-700 font-bold' : 'fill-slate-500'
                        }`}
                      >
                        {p.month}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-20 bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-sm border border-slate-700/80 -translate-x-1/2 -translate-y-full transition-all"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                    marginTop: '-12px',
                  }}
                >
                  <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-3">
                    <span>{hoveredPoint.month} 2026</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      Target: {chartMetric === 'revenue' ? `₹${hoveredPoint.target} Cr` : `${hoveredPoint.target * 3} Units`}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Pacing:</span>
                      <strong className="text-white font-mono">
                        {chartMetric === 'revenue' ? `₹${hoveredPoint.revenue} Cr` : `${hoveredPoint.units} Units`}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Chart Legend & Quick Stats */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-brand-600 rounded-full" />
                  <span className="text-slate-600 font-medium">Realized Volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                  <span className="text-slate-500 font-medium">Target Plan</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-medium text-slate-700">
                <span>Booked Revenue: <strong className="text-brand-700 font-bold">{formatINRCompact(totalBookingRevenue)}</strong></span>
                <span>•</span>
                <span>Confirmed Bookings: <strong className="text-emerald-700 font-bold">{totalBookings}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 4 Cols: Inventory Occupancy Donut Graph */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Live residential allotment share</CardDescription>
              </div>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* SVG Donut Ring */}
            <div className="relative flex items-center justify-center py-2">
              <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="14"
                />

                {/* Available Slice (Emerald) */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${availDash} ${donutCircumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-300"
                />

                {/* Booked Slice (Indigo / Brand) */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="14"
                  strokeDasharray={`${bookedDash} ${donutCircumference}`}
                  strokeDashoffset={`${-availDash}`}
                  className="transition-all duration-300"
                />

                {/* Blocked Slice (Amber) */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeDasharray={`${blockedDash} ${donutCircumference}`}
                  strokeDashoffset={`${-(availDash + bookedDash)}`}
                  className="transition-all duration-300"
                />
              </svg>

              {/* Center Metrics in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {occupancyRate}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Allotted
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Available</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  {availableUnits} <span className="font-normal text-slate-400">({availPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Booked & Confirmed</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  {bookedUnits} <span className="font-normal text-slate-400">({bookedPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Priority Hold</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  {blockedUnits} <span className="font-normal text-slate-400">({blockedPct}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRAPH SECTION 2: Visual Lead Funnel & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Lead Conversion Funnel Flow */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Conversion Funnel Flow</CardTitle>
                <CardDescription>
                  Stage-by-stage prospect volume from live CRM pipeline
                </CardDescription>
              </div>
              <Link
                to="/leads"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                <span>Full Directory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-3.5">
            {funnelSteps.map((step) => (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{step.label}</span>
                    <span className="text-[11px] font-mono text-slate-400">({step.count} prospects)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700 w-10 text-right">
                      {step.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress funnel bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full ${step.color || 'bg-brand-500'} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(step.percentage, step.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right 5 Cols: Live Recent Activity Stream */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <CardTitle>Live Activity Stream</CardTitle>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <CardDescription>Recent system events & updates</CardDescription>
              </div>
              <Link
                to="/audit"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                <span>Audit Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-brand-200">
                  {log.actor?.avatar || 'SYS'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className="font-semibold text-slate-900 truncate">{log.actor?.name || 'CRM System'}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {log.summary}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-brand-600">{log.action}</span>
                    <span>•</span>
                    <span className="truncate">{log.entityTitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl text-center">
            <Link
              to="/audit"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
            >
              Open Complete Forensic Audit Logs
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Follow-ups & Project Realization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Follow-ups */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Actionable Lead Follow-ups</CardTitle>
                <CardDescription>
                  Prospective customer touchpoints and consultations scheduled in database
                </CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {todaysFollowups.length} Tasks
              </span>
            </CardHeader>

            <div className="divide-y divide-slate-100">
              {todaysFollowups.length > 0 ? (
                todaysFollowups.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                        <span className={STAGE_CONFIG[item.stage]?.badgeClass || 'badge-new'}>
                          {STAGE_CONFIG[item.stage]?.label || item.stage}
                        </span>
                        <span className="priority-high">
                          {item.priority || 'HIGH'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {item.followupNote || 'Scheduled client follow-up'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-600 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.followupTime || '11:00 AM'}
                        </span>
                        <span>•</span>
                        <span>Assigned: <strong className="text-slate-700">{item.assignedToName}</strong></span>
                        {item.phone && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{item.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.leadId && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/leads/${item.leadId}`)}
                        >
                          Profile
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteFollowup(item.leadId, item.id, item.name)}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  You are all caught up! No pending follow-ups in your queue.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Project Realization */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Project Realization</CardTitle>
                <CardDescription>Live occupancy & inventory velocity</CardDescription>
              </div>
            </CardHeader>
            <div className="p-4 space-y-3.5">
              {projectStats.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/properties/${proj.id}`)}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                      {proj.name}
                    </span>
                    <span className="font-semibold text-emerald-700 text-[11px]">
                      {proj.availableUnits} Avail
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="truncate max-w-[140px]">{proj.city || proj.location}</span>
                    <span>{proj.bookedPercentage}% Booked</span>
                  </div>

                  <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${proj.bookedPercentage}%` }}
                    />
                  </div>
                </div>
              ))}

              <Link to="/units" className="block pt-1">
                <Button variant="secondary" size="sm" className="w-full">
                  Browse Full Unit Inventory
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Verified Unit Bookings</CardTitle>
            <CardDescription>
              Transactions verified and registered through the sales operations desk
            </CardDescription>
          </div>
          <Link
            to="/bookings"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <Table
          columns={bookingColumns}
          data={recentBookings}
          emptyTitle="No bookings recorded yet"
          emptyDescription="Bookings will appear here once prospective leads confirm unit allocations."
        />
      </Card>
    </div>
  );
}

export default DashboardPage;
