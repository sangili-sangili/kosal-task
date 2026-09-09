import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Search,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Check,
  Link2,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
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

export function ProjectListPage({ defaultOpenCreate = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, units, addProject, updateProject, deleteProject } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    defaultOpenCreate || location.pathname.includes('/create') || location.pathname.includes('/new')
  );

  useEffect(() => {
    if (defaultOpenCreate || location.pathname.includes('/create') || location.pathname.includes('/new')) {
      setIsCreateModalOpen(true);
    }
  }, [defaultOpenCreate, location.pathname]);

  // Image upload ref and tab mode for CREATE
  const fileInputRef = useRef(null);
  const [imageUploadMode, setImageUploadMode] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // New Project Form State
  const [formData, setFormData] = useState({
    name: '',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    location: '',
    priceRange: '₹95 L - ₹2.4 Cr',
    startingPrice: '₹95 L',
    possessionDate: 'Dec 2027',
    description: '',
    coverImage: COVER_PRESETS[0].url,
    totalTowers: '3',
    floorsPerTower: '18',
  });

  const [formErrors, setFormErrors] = useState({});

  // EDIT and DELETE Modal States
  const [editingProject, setEditingProject] = useState(null);
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
  const [editImageMode, setEditImageMode] = useState('upload');
  const [editUploadedFileName, setEditUploadedFileName] = useState('');

  const [deletingProject, setDeletingProject] = useState(null);

  // File Upload Handlers (Create)
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, or GIF)');
      return;
    }
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        coverImage: e.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processImageFile(file);
  };

  const handleQuickFill = () => {
    setFormData({
      name: 'Godrej Palm Retreat',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      location: 'Panathur Main Road, Near Tech Park',
      priceRange: '₹1.15 Cr - ₹2.85 Cr',
      startingPrice: '₹1.15 Cr',
      possessionDate: 'Mar 2028',
      description:
        'Biophilic resort-style community with sunken clubhouse, floating cabanas, and 85% open landscaped greenery.',
      coverImage: COVER_PRESETS[1].url,
      totalTowers: '3',
      floorsPerTower: '22',
    });
    setUploadedFileName('godrej-palm-retreat.jpg');
    setFormErrors({});
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Development project name is required';
    if (!formData.location.trim()) errors.location = 'Specific address / area location is required';
    if (!formData.startingPrice.trim()) errors.startingPrice = 'Starting price is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const numTowers = parseInt(formData.totalTowers, 10) || 2;
    const towerLetters = ['A', 'B', 'C', 'D', 'E'];
    const generatedBuildings = Array.from({ length: numTowers }, (_, i) => ({
      id: `bld-${Date.now()}-${i + 1}`,
      name: `Tower ${towerLetters[i] || i + 1}`,
      floors: parseInt(formData.floorsPerTower, 10) || 18,
      totalUnits: 20,
      availableUnits: 20,
      bookedUnits: 0,
    }));

    const newProject = addProject({
      name: formData.name.trim(),
      country: formData.country || 'India',
      state: formData.state || 'Karnataka',
      city: formData.city,
      location: formData.location.trim(),
      priceRange: formData.priceRange.trim(),
      startingPrice: formData.startingPrice.trim(),
      possessionDate: formData.possessionDate.trim(),
      description:
        formData.description.trim() ||
        'Master-planned residential development featuring premium amenities and landscaped greens.',
      coverImage: formData.coverImage,
      totalUnits: numTowers * 20,
      availableUnits: numTowers * 20,
      buildings: generatedBuildings,
    });

    setIsCreateModalOpen(false);
    navigate(`/properties/${newProject.id}`);
  };

  // Edit Handlers
  const openEditModal = (proj) => {
    setEditingProject(proj);
    setEditFormData({
      name: proj.name || '',
      country: proj.country || 'India',
      state: proj.state || 'Karnataka',
      city: proj.city || 'Bengaluru',
      location: proj.location || '',
      priceRange: proj.priceRange || '',
      startingPrice: proj.startingPrice || '',
      possessionDate: proj.possessionDate || '',
      description: proj.description || '',
      coverImage: proj.coverImage || COVER_PRESETS[0].url,
    });
    setEditUploadedFileName('Current cover image');
    setEditErrors({});
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, or GIF)');
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

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingProject) return;
    const errors = {};
    if (!editFormData.name.trim()) errors.name = 'Project name is required';
    if (!editFormData.location.trim()) errors.location = 'Location address is required';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    updateProject(editingProject.id, {
      name: editFormData.name.trim(),
      country: editFormData.country || 'India',
      state: editFormData.state || 'Karnataka',
      city: editFormData.city,
      location: editFormData.location.trim(),
      priceRange: editFormData.priceRange.trim(),
      startingPrice: editFormData.startingPrice.trim(),
      possessionDate: editFormData.possessionDate.trim(),
      description: editFormData.description.trim(),
      coverImage: editFormData.coverImage,
    });

    setEditingProject(null);
  };

  // Delete Handlers
  const openDeleteModal = (proj) => {
    setDeletingProject(proj);
  };

  const handleDeleteConfirm = () => {
    if (!deletingProject) return;
    deleteProject(deletingProject.id);
    setDeletingProject(null);
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Property Developments & Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active residential developments, architectural towers, and master catalog inventory
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/units">
            <Button variant="secondary" size="md" leftIcon={<Layers className="w-4 h-4" />}>
              View All Units
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-xs"
          >
            Add New Property
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="max-w-md">
        <Input
          placeholder="Search by project name, city, or locality..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isSearch
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Empty State when no project matches */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No projects match your search"
          description="Try searching for another development name or add a new property development to the catalog."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const projectUnits = units.filter((u) => u.projectId === project.id);
            const availableUnits = projectUnits.filter((u) => u.status === 'AVAILABLE').length;
            const totalUnits = projectUnits.length || project.totalUnits || 30;
            const bookedUnits = totalUnits - availableUnits;
            const occupancyRate = totalUnits ? Math.round((bookedUnits / totalUnits) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/properties/${project.id}`)}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between relative"
              >
                {/* Cover Image Banner */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={
                      project.coverImage ||
                      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Quick Edit & Delete Action Buttons on Card */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Edit Development"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="w-8 h-8 rounded-lg bg-black/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Development"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(project);
                      }}
                      className="w-8 h-8 rounded-lg bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-black/50 backdrop-blur-md border border-white/20">
                      <MapPin className="w-3 h-3 text-brand-300" />
                      {project.city}
                    </span>
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                      {project.priceRange || `From ${project.startingPrice}`}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Metrics & Occupancy */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {project.buildings?.length || project.totalBuildings || 2} Towers
                      </span>
                      <span className="font-semibold text-slate-800">
                        {availableUnits} Units Available
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Allotted / Booked</span>
                        <span className="font-semibold text-slate-700">{occupancyRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-semibold">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {project.possessionDate}
                    </span>
                    <span className="text-brand-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Project Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Property Development Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          if (location.pathname.includes('/create') || location.pathname.includes('/new')) {
            navigate('/properties');
          }
        }}
        title="Add New Property Development"
        description="Register an architectural masterplan, specify towers, and auto-initialize catalog units"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Demo Quick Fill Banner */}
          <div className="flex items-center justify-between p-3 bg-brand-50/70 border border-brand-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-slate-800">
                Want to test adding a project quickly?
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleQuickFill}
              className="bg-white border-brand-300 text-brand-700 hover:bg-brand-50 text-xs font-semibold"
            >
              Fill Sample Project
            </Button>
          </div>

          <Input
            label="Development Project Name"
            placeholder="e.g. Godrej Palm Retreat"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          {/* Third-party cascading country, state and city selector */}
          <StateCitySelect
            selectedCountry={formData.country || 'India'}
            selectedState={formData.state || 'Karnataka'}
            selectedCity={formData.city}
            onCountryChange={(cntry) => setFormData({ ...formData, country: cntry })}
            onStateChange={(st) => setFormData({ ...formData, state: st })}
            onCityChange={(ct) => setFormData({ ...formData, city: ct })}
          />

          <Input
            label="Specific Location / Address"
            placeholder="e.g. Panathur Main Road, Outer Ring Road"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={formErrors.location}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Starting Base Price"
              placeholder="e.g. ₹95 L"
              required
              value={formData.startingPrice}
              onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
              error={formErrors.startingPrice}
            />

            <Input
              label="Full Price Bracket"
              placeholder="e.g. ₹95 L - ₹2.4 Cr"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
            />

            <Input
              label="Possession Date"
              placeholder="e.g. Dec 2027"
              value={formData.possessionDate}
              onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Initial Towers / Blocks"
              options={[
                { value: '2', label: '2 Towers (Tower A, Tower B)' },
                { value: '3', label: '3 Towers (Tower A, Tower B, Tower C)' },
                { value: '4', label: '4 Towers (Tower A, B, C, D)' },
              ]}
              value={formData.totalTowers}
              onChange={(e) => setFormData({ ...formData, totalTowers: e.target.value })}
            />

            <Input
              label="Floors per Tower"
              type="number"
              placeholder="e.g. 18"
              value={formData.floorsPerTower}
              onChange={(e) => setFormData({ ...formData, floorsPerTower: e.target.value })}
            />
          </div>

          {/* Architectural Cover Image Uploader & Presets */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-700">
                Architectural Cover Image Style
              </label>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    imageUploadMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload from Device
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('preset')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    imageUploadMode === 'preset'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    imageUploadMode === 'url'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Direct URL
                </button>
              </div>
            </div>

            {/* Mode 1: Upload from Device */}
            {imageUploadMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/jpg, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.coverImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={formData.coverImage}
                      alt="Cover Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end justify-between p-3.5">
                      <div className="text-white text-xs">
                        <span className="font-semibold block truncate max-w-xs">
                          {uploadedFileName || 'Custom uploaded cover image'}
                        </span>
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Image uploaded and ready
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white/90 hover:bg-white text-slate-800 shadow-xs"
                        >
                          Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="xs"
                          onClick={() => {
                            setFormData({ ...formData, coverImage: '' });
                            setUploadedFileName('');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-brand-500 bg-brand-50/60'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-2.5">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click to browse or drag & drop property cover photo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Upload from your laptop or phone (PNG, JPG, WEBP, or GIF up to 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Presets */}
            {imageUploadMode === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => {
                  const isSelected = formData.coverImage === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setFormData({ ...formData, coverImage: preset.url });
                        setUploadedFileName(preset.label);
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
            {imageUploadMode === 'url' && (
              <div className="space-y-2">
                <Input
                  placeholder="https://images.unsplash.com/... or cloud CDN image link"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  leftIcon={Link2}
                />
                {formData.coverImage && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                    <img
                      src={formData.coverImage}
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
            placeholder="e.g. Biophilic resort-style community with sunken clubhouse, floating cabanas, and 85% open landscaped greenery..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 px-6 shadow-xs mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setIsCreateModalOpen(false);
                if (location.pathname.includes('/create') || location.pathname.includes('/new')) {
                  navigate('/properties');
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create & Publish Development
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Property Development Modal */}
      <Modal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title={`Edit Development: ${editingProject?.name || ''}`}
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

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 -mx-6 px-6 shadow-xs mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEditingProject(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        title={`Delete Development: ${deletingProject?.name || ''}?`}
        description="Are you sure you want to delete this property development?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold">This action cannot be undone.</p>
              <p>
                Deleting <strong>{deletingProject?.name}</strong> will remove the project along with its catalog units and occupancy records from the active CRM master.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingProject(null)}
            >
              Keep Development
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              leftIcon={Trash2}
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProjectListPage;
