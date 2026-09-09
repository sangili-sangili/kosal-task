import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Layers,
  CheckCircle2,
  Calendar,
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  Search,
  ShieldCheck,
  Sparkles,
  Award,
  Compass,
  Filter,
  Pencil,
  Trash2,
  UploadCloud,
  Check,
  Link2,
  Image as ImageIcon,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { UNIT_STATUS } from '../../mock/mockData';
import { formatINRCompact, formatINR } from '../../utils/crmFormatters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import AddUnitModal from '../../components/properties/AddUnitModal';
import StateCitySelect from '../../components/forms/StateCitySelect';

const COVER_PRESETS = [
  {
    id: 'highrise',
    label: 'Glass High-Rise',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'waterfront',
    label: 'Waterfront Luxury',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'garden',
    label: 'Garden Township',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'skyline',
    label: 'Skyline Landmark',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
];

export function ProjectDetailPage() {
  // Support both :id and :projectId params from React Router
  const { id, projectId } = useParams();
  const currentProjectId = id || projectId;
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [bhkFilter, setBhkFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unitSearch, setUnitSearch] = useState('');

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddTowerModalOpen, setIsAddTowerModalOpen] = useState(false);

  // Tower Form State
  const [towerFormData, setTowerFormData] = useState({ name: '', description: '18 Floors residential block' });
  const [towerErrors, setTowerErrors] = useState({});

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    location: '',
    priceRange: '',
    startingPrice: '',
    possessionDate: '',
    description: '',
    coverImage: '',
  });

  const [editErrors, setEditErrors] = useState({});
  const editFileInputRef = useRef(null);
  const [editImageMode, setEditImageMode] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [editUploadedFileName, setEditUploadedFileName] = useState('');
  const [editIsDragging, setEditIsDragging] = useState(false);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await propertyService.getProjectById(currentProjectId``);
      if (!data) throw new Error('Development project not found');
      const presetCover = COVER_PRESETS[(data.id || 0) % COVER_PRESETS.length]?.url;
      setProject({
        ...data,
        coverImage: data.coverImage || presetCover,
      });
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setFetchError(err.message || 'Failed to fetch project details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProjectId) {
      fetchProjectDetails();
    }
  }, [currentProjectId]);

  const openEditModal = () => {
    if (!project) return;
    setEditFormData({
      name: project.name || '',
      country: project.country || 'India',
      state: project.state || 'Karnataka',
      city: project.city || (project.location ? project.location.split(',')[1]?.trim() : '') || 'Bengaluru',
      location: project.location || '',
      priceRange: project.priceRange || '',
      startingPrice: project.startingPrice || '',
      possessionDate: project.possessionDate || 'Dec 2027',
      description: project.description || '',
      coverImage: project.coverImage || COVER_PRESETS[0].url,
    });
    setEditUploadedFileName('Current cover image');
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    setEditUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditFormData((prev) => ({
        ...prev,
        coverImage: event.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!project) return;
    const errors = {};
    if (!editFormData.name.trim()) errors.name = 'Project name is required';
    if (!editFormData.location.trim()) errors.location = 'Location address is required';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await propertyService.updateProject(project.id, {
        name: editFormData.name.trim(),
        location: editFormData.location.trim(),
        description: editFormData.description.trim(),
      });
      setIsEditModalOpen(false);
      await fetchProjectDetails();
    } catch (err) {
      console.error('Failed to update project:', err);
      setEditErrors({ submit: err.message || 'Failed to update development project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      await propertyService.deleteProject(project.id);
      setIsDeleteModalOpen(false);
      navigate('/properties');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert(err.message || 'Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTowerSubmit = async (e) => {
    e.preventDefault();
    if (!towerFormData.name.trim()) {
      setTowerErrors({ name: 'Tower name is required (e.g. Tower C)' });
      return;
    }

    setIsSubmitting(true);
    try {
      await propertyService.createBuilding(project.id, {
        name: towerFormData.name.trim(),
        description: towerFormData.description.trim() || 'Residential Tower Block',
      });
      setIsAddTowerModalOpen(false);
      setTowerFormData({ name: '', description: '18 Floors residential block' });
      setTowerErrors({});
      await fetchProjectDetails();
    } catch (err) {
      console.error('Failed to create tower building:', err);
      setTowerErrors({ submit: err.message || 'Failed to add tower building' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten nested units from live buildings
  const projectUnits = useMemo(() => {
    if (!project || !project.buildings) return [];
    return project.buildings.flatMap((bld) =>
      (bld.units || []).map((u) => ({
        id: u.id,
        buildingId: bld.id,
        buildingName: bld.name,
        unitNumber: u.unit_number,
        type: u.unit_type,
        floor: u.floor,
        area: u.area,
        price: u.price,
        status: u.status,
        facing: u.facing || 'East',
        projectId: project.id,
        projectName: project.name,
      }))
    );
  }, [project]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (fetchError || !project) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-subtle mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          {fetchError || `No development project matches ID ${currentProjectId}.`}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/properties">
            <Button variant="primary" size="md" leftIcon={ArrowLeft}>
              Back to All Projects
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={fetchProjectDetails}>
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }
  const totalUnits = projectUnits.length;
  const availableUnits = projectUnits.filter((u) => u.status === UNIT_STATUS.AVAILABLE).length;
  const bookedUnits = projectUnits.filter((u) => u.status === UNIT_STATUS.BOOKED).length;
  const blockedUnits = projectUnits.filter((u) => u.status === UNIT_STATUS.BLOCKED).length;
  const occupancyRate = totalUnits > 0 ? Math.round((bookedUnits / totalUnits) * 100) : 0;

  // Multi-filtered units for table
  const displayedUnits = projectUnits.filter((u) => {
    if (selectedBuildingId && u.buildingId !== selectedBuildingId) return false;
    if (bhkFilter !== 'ALL' && !u.type.includes(bhkFilter)) return false;
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    if (unitSearch.trim()) {
      const q = unitSearch.toLowerCase();
      return (
        u.unitNumber.toLowerCase().includes(q) ||
        u.buildingName.toLowerCase().includes(q) ||
        u.facing.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unitColumns = [
    {
      key: 'unitNumber',
      title: 'Unit Number',
      render: (num, row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900">{num}</span>
          <p className="text-[10px] text-slate-400">{row.facing} Facing</p>
        </div>
      ),
    },
    {
      key: 'buildingName',
      title: 'Tower',
      render: (bld) => (
        <span className="text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
          {bld}
        </span>
      ),
    },
    {
      key: 'type',
      title: 'Typology',
      render: (type) => <span className="text-xs font-medium text-slate-800">{type}</span>,
    },
    {
      key: 'floor',
      title: 'Floor Level',
      render: (fl) => <span className="text-xs font-mono text-slate-600">{fl}th Floor</span>,
    },
    {
      key: 'area',
      title: 'Super Area',
      render: (area) => (
        <div>
          <span className="text-xs font-medium text-slate-700">{area} sq ft</span>
          <p className="text-[10px] text-slate-400">Carpet: ~{Math.round(area * 0.76)} sq ft</p>
        </div>
      ),
    },
    {
      key: 'price',
      title: 'Base Price',
      render: (price) => (
        <div>
          <span className="text-xs font-bold text-slate-900">{formatINRCompact(price)}</span>
          <p className="text-[10px] text-slate-400">{formatINR(price)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Availability',
      render: (status) => {
        const badgeVariant =
          status === UNIT_STATUS.AVAILABLE
            ? 'success'
            : status === UNIT_STATUS.BOOKED
            ? 'danger'
            : 'warning';
        return (
          <Badge variant={badgeVariant} size="xs" dot>
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
        <div className="flex justify-end">
          {row.status === UNIT_STATUS.AVAILABLE ? (
            <Link to={`/bookings/create?unitId=${row.id}`}>
              <Button variant="primary" size="xs" leftIcon={BookmarkCheck} className="shadow-2xs">
                Reserve Unit
              </Button>
            </Link>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium px-2 py-1">
              {row.status === UNIT_STATUS.BOOKED ? 'Allotted' : 'On Hold'}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to All Property Developments</span>
        </Link>
      </div>

      {/* Luxury Project Hero Banner Header */}
      <div
        className="relative rounded-2xl overflow-hidden text-white shadow-card p-6 sm:p-8"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.82) 55%, rgba(15, 23, 42, 0.65) 100%), url(${
            project.coverImage ||
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            {/* Top Tag Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-xs">
                <MapPin className="w-3 h-3 text-brand-400" />
                {project.location || project.city}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                RERA Certified Masterplan
              </span>

              <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                Possession: <strong className="text-white ml-1">{project.possessionDate}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-xs">
              {project.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl">
              {project.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              <div className="text-emerald-300 font-bold text-sm">
                Pricing: {project.priceRange || `From ${project.startingPrice}`}
              </div>
              <div className="text-slate-400">•</div>
              <div className="text-slate-300">
                Total Towers: <strong className="text-white">{project.buildings?.length || 3} Blocks</strong>
              </div>
              <div className="text-slate-400">•</div>
              <div className="text-slate-300">
                Live Occupancy: <strong className="text-emerald-400">{occupancyRate}% Sold</strong>
              </div>
            </div>
          </div>

          {/* Quick Actions Strip (Booking, Lead, Edit, Delete) */}
          <div className="flex flex-col gap-2.5 shrink-0 self-start lg:self-center">
            <Link to={`/bookings/create?projectId=${project.id}`}>
              <Button
                variant="accent"
                size="md"
                leftIcon={BookmarkCheck}
                className="w-full shadow-md"
              >
                Create Booking for Project
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={Plus}
              onClick={() => setIsAddUnitModalOpen(true)}
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs font-semibold"
            >
              Add Unit to Project
            </Button>

            {/* Edit & Delete Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Pencil}
                onClick={openEditModal}
                className="flex-1 bg-white/10 hover:bg-white/25 text-white border-white/25 backdrop-blur-xs text-xs font-semibold"
              >
                Edit Project
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-rose-600/80 hover:bg-rose-600 text-white border-transparent text-xs font-semibold"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Towers & Blocks</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {project.buildings?.length || 0} Towers
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">High-rise developments</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Catalog Units</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalUnits} Units</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded in ERP</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Available Units</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{availableUnits} Avail</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${totalUnits > 0 ? (availableUnits / totalUnits) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Committed / Booked</span>
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{bookedUnits} Booked</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Buildings List / Tower Selector */}
      <Card className="border-slate-200/90 shadow-subtle">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Architectural Towers & Blocks</CardTitle>
            <CardDescription>Select any tower to inspect floor plans and unit availability</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedBuildingId && (
              <button
                type="button"
                onClick={() => setSelectedBuildingId('')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline mr-2"
              >
                Reset / Show All Towers
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsAddTowerModalOpen(true)}
              className="text-xs"
            >
              Add Tower / Block
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!project.buildings || project.buildings.length === 0) ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No architectural towers added yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">Add towers to configure units and start booking allotments</p>
              <Button
                variant="primary"
                size="xs"
                leftIcon={Plus}
                onClick={() => setIsAddTowerModalOpen(true)}
              >
                Add First Tower
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {project.buildings.map((bld) => {
                const isSelected = selectedBuildingId === bld.id;
                const bldUnits = projectUnits.filter((u) => u.buildingId === bld.id);
                const bldAvail = bldUnits.filter((u) => u.status === UNIT_STATUS.AVAILABLE).length;

                return (
                  <div
                    key={bld.id}
                    onClick={() => setSelectedBuildingId(isSelected ? '' : bld.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">{bld.name}</h4>
                      <span className={`text-[11px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {bld.description || 'Tower Block'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        Units Available:
                      </span>
                      <span className={`font-bold font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {bldAvail} Available
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Units Table Section with Filters */}
      <Card className="border-slate-200/90 shadow-subtle">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>
              {selectedBuildingId
                ? `Tower Inventory: ${project.buildings?.find((b) => b.id === selectedBuildingId)?.name}`
                : 'Complete Project Inventory Catalog'}
            </CardTitle>
            <CardDescription>
              Showing {displayedUnits.length} units with live reservation and pricing status
            </CardDescription>
          </div>

          {/* Unit Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <Input
                placeholder="Search unit (e.g. A-102)..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                isSearch
                onClear={() => setUnitSearch('')}
                className="py-1.5 text-xs"
              />
            </div>

            {/* Typology Filter */}
            <select
              value={bhkFilter}
              onChange={(e) => setBhkFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="ALL">All Typologies</option>
              <option value="2 BHK">2 BHK</option>
              <option value="3 BHK">3 BHK</option>
              <option value="4 BHK">4 BHK Luxury</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value={UNIT_STATUS.AVAILABLE}>Available Only</option>
              <option value={UNIT_STATUS.BOOKED}>Booked</option>
              <option value={UNIT_STATUS.BLOCKED}>Blocked / Hold</option>
            </select>

            <Button
              type="button"
              variant="primary"
              size="xs"
              leftIcon={Plus}
              onClick={() => setIsAddUnitModalOpen(true)}
              className="shadow-2xs text-xs font-semibold shrink-0"
            >
              Add Unit
            </Button>
          </div>
        </CardHeader>

        <Table
          columns={unitColumns}
          data={displayedUnits}
          emptyTitle="No units match filter criteria"
          emptyDescription="Try clearing filters or changing tower selection."
        />
      </Card>

      {/* Edit Property Development Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Development: ${project.name}`}
        description="Update project overview, price bracket, possession date, or architectural cover image"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Development Project Name"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            error={editErrors.name}
          />

          {/* Third-party cascading country, state and city selector */}
          <StateCitySelect
            selectedCountry={editFormData.country || 'India'}
            selectedState={editFormData.state || 'Karnataka'}
            selectedCity={editFormData.city}
            onCountryChange={(cntry) => setEditFormData({ ...editFormData, country: cntry })}
            onStateChange={(st) => setEditFormData({ ...editFormData, state: st })}
            onCityChange={(ct) => setEditFormData({ ...editFormData, city: ct })}
          />

          <Input
            label="Specific Location / Address"
            required
            value={editFormData.location}
            onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
            error={editErrors.location}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Starting Base Price"
              value={editFormData.startingPrice}
              onChange={(e) => setEditFormData({ ...editFormData, startingPrice: e.target.value })}
            />

            <Input
              label="Full Price Bracket"
              value={editFormData.priceRange}
              onChange={(e) => setEditFormData({ ...editFormData, priceRange: e.target.value })}
            />

            <Input
              label="Possession Date"
              value={editFormData.possessionDate}
              onChange={(e) => setEditFormData({ ...editFormData, possessionDate: e.target.value })}
            />
          </div>

          {/* Architectural Cover Image Style Selector */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-700">
                Architectural Cover Image
              </label>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEditImageMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    editImageMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload from Device
                </button>
                <button
                  type="button"
                  onClick={() => setEditImageMode('preset')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    editImageMode === 'preset'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setEditImageMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    editImageMode === 'url'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Direct URL
                </button>
              </div>
            </div>

            {/* Mode 1: Device Upload */}
            {editImageMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/jpg, image/gif"
                  onChange={handleEditFileChange}
                  className="hidden"
                />

                {editFormData.coverImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={editFormData.coverImage}
                      alt="Cover Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end justify-between p-3.5">
                      <div className="text-white text-xs">
                        <span className="font-semibold block truncate max-w-xs">
                          {editUploadedFileName || 'Cover Image Selected'}
                        </span>
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Ready to update
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => editFileInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-slate-800 shadow-xs"
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 rounded-xl p-6 text-center cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-2.5">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click to upload new cover photo from device
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Presets */}
            {editImageMode === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => {
                  const isSelected = editFormData.coverImage === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setEditFormData({ ...editFormData, coverImage: preset.url });
                        setEditUploadedFileName(preset.label);
                      }}
                      className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-600 ring-2 ring-brand-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover" />
                      <div className="p-1.5 bg-white text-[11px] font-medium text-slate-700 text-center truncate">
                        {preset.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mode 3: Direct URL */}
            {editImageMode === 'url' && (
              <div className="space-y-2">
                <Input
                  placeholder="https://images.unsplash.com/... or image link"
                  value={editFormData.coverImage}
                  onChange={(e) => setEditFormData({ ...editFormData, coverImage: e.target.value })}
                  leftIcon={Link2}
                />
                {editFormData.coverImage && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                    <img
                      src={editFormData.coverImage}
                      alt="URL Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Textarea
            label="Architectural Overview & Highlights"
            rows={3}
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />

          {editErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{editErrors.submit}</span>
            </div>
          )}

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 px-6 shadow-xs mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title={`Delete Development: ${project.name}?`}
        description="Are you sure you want to delete this property development?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold">This action cannot be undone.</p>
              <p>
                Deleting <strong>{project.name}</strong> will remove the project along with{' '}
                <strong>{projectUnits.length} catalog units</strong> and their occupancy records from
                the active CRM master.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Keep Development
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={isSubmitting}
              leftIcon={Trash2}
              onClick={handleDeleteConfirm}
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Tower Modal */}
      <Modal
        isOpen={isAddTowerModalOpen}
        onClose={() => !isSubmitting && setIsAddTowerModalOpen(false)}
        title={`Add Tower to ${project.name}`}
        description="Create a new architectural tower or block in this development"
        size="sm"
      >
        <form onSubmit={handleAddTowerSubmit} className="space-y-4">
          <Input
            label="Tower / Building Name"
            placeholder="e.g. Tower C or West Wing"
            required
            value={towerFormData.name}
            onChange={(e) => setTowerFormData({ ...towerFormData, name: e.target.value })}
            error={towerErrors.name}
          />
          <Input
            label="Description / Specifications"
            placeholder="e.g. 24 Floors, 4 Units per floor"
            value={towerFormData.description}
            onChange={(e) => setTowerFormData({ ...towerFormData, description: e.target.value })}
          />

          {towerErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{towerErrors.submit}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              onClick={() => setIsAddTowerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={Building2}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Tower...' : 'Add Tower'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Unit to Project Modal */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        defaultProjectId={project.id}
        defaultProjectName={project.name}
        towers={project.buildings}
        onSuccess={fetchProjectDetails}
      />
    </div>
  );
}

export default ProjectDetailPage;
