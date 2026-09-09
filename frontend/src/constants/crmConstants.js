/**
 * Core Real Estate CRM Constants and Enums
 * Source of truth for business domain constants, stage configurations, and RBAC permissions.
 */

export const LEAD_STAGES = Object.freeze({
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  SITE_VISIT: 'SITE_VISIT',
  INTERESTED: 'INTERESTED',
  NEGOTIATION: 'NEGOTIATION',
  BOOKED: 'BOOKED',
  LOST: 'LOST',
});

export const STAGE_CONFIG = {
  [LEAD_STAGES.NEW]: { label: 'New', color: 'sky', badgeClass: 'badge-new' },
  [LEAD_STAGES.CONTACTED]: { label: 'Contacted', color: 'blue', badgeClass: 'badge-contacted' },
  [LEAD_STAGES.SITE_VISIT]: { label: 'Site Visit', color: 'amber', badgeClass: 'badge-sitevisit' },
  [LEAD_STAGES.INTERESTED]: { label: 'Interested', color: 'purple', badgeClass: 'badge-interested' },
  [LEAD_STAGES.NEGOTIATION]: { label: 'Negotiation', color: 'orange', badgeClass: 'badge-negotiation' },
  [LEAD_STAGES.BOOKED]: { label: 'Booked', color: 'emerald', badgeClass: 'badge-booked' },
  [LEAD_STAGES.LOST]: { label: 'Lost', color: 'rose', badgeClass: 'badge-lost' },
};

export const UNIT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
});

export const PERMISSION_MODULES = [
  {
    id: 'mod_dashboard',
    category: 'Dashboard & Analytics',
    menuTitle: 'Dashboard Menu',
    iconName: 'LayoutDashboard',
    route: '/dashboard',
    description: 'Executive KPI visibility, revenue tracking, and business analytics',
    permissions: [
      { id: 'dashboard.view', label: 'Access Sales Dashboard', desc: 'View executive KPIs, revenue trajectory, and pipeline breakdown' },
      { id: 'dashboard.export_reports', label: 'Export Executive MIS', desc: 'Download analytical KPI summaries and performance dossiers' },
    ],
  },
  {
    id: 'mod_leads',
    category: 'Leads Management',
    menuTitle: 'Leads Menu',
    iconName: 'Users',
    route: '/leads',
    description: 'Prospect registration, communication logs, stage progression, and reassignment',
    permissions: [
      { id: 'leads.view', label: 'View Leads Directory', desc: 'Browse all prospect inquiries, contact cards, and timelines' },
      { id: 'leads.create', label: 'Register New Leads', desc: 'Create walk-in inquiries and incoming prospect profiles' },
      { id: 'leads.edit', label: 'Edit Lead Details', desc: 'Update prospect budgets, preferred BHK, and contact details' },
      { id: 'leads.stage_update', label: 'Progress Funnel Stages', desc: 'Advance leads across sales stages (New → Site Visit → Negotiation → Booked)' },
      { id: 'leads.reassign', label: 'Reassign Lead Owners', desc: 'Transfer prospect opportunities across sales team members' },
      { id: 'leads.delete', label: 'Delete Inactive Prospects', desc: 'Permanently remove duplicate or invalid lead records' },
      { id: 'leads.export', label: 'Export Leads Database', desc: 'Download filtered pipeline records in CSV / Excel format' },
    ],
  },
  {
    id: 'mod_properties',
    category: 'Property Developments',
    menuTitle: 'Properties Menu',
    iconName: 'Building2',
    route: '/properties',
    description: 'Master developments, architectural plans, tower specifications, and base pricing',
    permissions: [
      { id: 'properties.view', label: 'View Property Master', desc: 'Browse master developments, towers, and project details' },
      { id: 'properties.create', label: 'Add New Developments', desc: 'Register new master-planned projects and architectural layouts' },
      { id: 'properties.edit', label: 'Edit Development Details', desc: 'Update project amenities, pricing brackets, and possession timelines' },
      { id: 'properties.delete', label: 'Delete Developments', desc: 'Remove property projects and linked architectural records' },
    ],
  },
  {
    id: 'mod_units',
    category: 'Units Inventory',
    menuTitle: 'Units Inventory Menu',
    iconName: 'Layers',
    route: '/units',
    description: 'Floor level units, carpet area specifications, and availability management',
    permissions: [
      { id: 'units.view', label: 'View Units Catalog', desc: 'Inspect unit availability grid and filter by BHK/Tower' },
      { id: 'units.create', label: 'Add Catalog Units', desc: 'Configure individual flats, floor levels, and base allotment rates' },
      { id: 'units.edit', label: 'Edit Unit Specifications', desc: 'Update super built-up area, carpet dimensions, and base rate' },
      { id: 'units.block', label: 'Block / Hold Units', desc: 'Place temporary 24-hr allotment freeze on units' },
      { id: 'units.price_override', label: 'Base Price Override', desc: 'Authorize custom base-price waivers and commercial adjustments' },
    ],
  },
  {
    id: 'mod_bookings',
    category: 'Bookings & Sales',
    menuTitle: 'Bookings Menu',
    iconName: 'BookmarkCheck',
    route: '/bookings',
    description: 'Unit reservations, 4-step booking workflow, payment milestones, and agreements',
    permissions: [
      { id: 'bookings.view', label: 'View All Bookings', desc: 'Inspect committed unit reservations and token receipts' },
      { id: 'bookings.create', label: 'Create Unit Reservation', desc: 'Execute 4-step customer booking wizard and allocate token units' },
      { id: 'bookings.approve', label: 'Approve Token Receipts', desc: 'Verify banking clearance and approve payment milestones' },
      { id: 'bookings.cancel', label: 'Cancel Booking & Release', desc: 'Void reservation allotment and restore unit to inventory' },
      { id: 'bookings.export', label: 'Export Booking Dossiers', desc: 'Generate official customer allotment letters and agreement PDFs' },
    ],
  },
  {
    id: 'mod_users',
    category: 'User Management',
    menuTitle: 'User Management Menu',
    iconName: 'UserCheck',
    route: '/users',
    description: 'Employee directory, sales team onboarding, status changes, and project assignments',
    permissions: [
      { id: 'users.view', label: 'View Users Directory', desc: 'Inspect internal employees, managers, and channel partner accounts' },
      { id: 'users.create', label: 'Onboard New Employees', desc: 'Create staff accounts, assign corporate emails, and configure roles' },
      { id: 'users.edit', label: 'Edit Staff Profiles', desc: 'Update contact details, sales targets, and assigned developments' },
      { id: 'users.delete', label: 'Deactivate / Delete Accounts', desc: 'Suspend platform credentials and revoke access privileges' },
    ],
  },
  {
    id: 'mod_roles',
    category: 'Roles Master',
    menuTitle: 'Roles Master Menu',
    iconName: 'ShieldCheck',
    route: '/roles',
    description: 'RBAC security roles, granular permission matrices, and access governance',
    permissions: [
      { id: 'roles.view', label: 'View Roles Master', desc: 'Inspect RBAC role hierarchy and assigned staff members' },
      { id: 'roles.manage', label: 'Configure Roles & Permissions', desc: 'Create custom roles, edit matrix, and modify module permissions' },
    ],
  },
  {
    id: 'mod_audit',
    category: 'Recent Activity & Audit Logs',
    menuTitle: 'Audit Logs Menu',
    iconName: 'History',
    route: '/audit',
    description: 'System-wide audit trail, timestamped events, IP logs, and forensic activity history',
    permissions: [
      { id: 'audit.view', label: 'View Audit Trail', desc: 'Access real-time activity stream and historical change logs' },
      { id: 'audit.filter_sensitive', label: 'Inspect Security Overrides', desc: 'Review IP signatures, permission modifications, and user deactivations' },
      { id: 'audit.export', label: 'Export Audit Dossier', desc: 'Download compliance log files in CSV and JSON formats' },
    ],
  },
];

export const BHK_OPTIONS = ['1BHK', '2BHK', '2.5BHK', '3BHK', '4BHK', 'Penthouse', 'Plot', 'Villa'];

export const BUDGET_RANGES = [
  '₹40 Lakhs - ₹70 Lakhs',
  '₹70 Lakhs - ₹1.2 Crore',
  '₹1.2 Crore - ₹2.0 Crore',
  '₹2.0 Crore - ₹3.5 Crore',
  '₹3.5 Crore - ₹6.0 Crore',
  'Above ₹6.0 Crore',
];
