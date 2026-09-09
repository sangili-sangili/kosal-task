  /**
 * Utility to export datasets directly to Microsoft Excel-compatible CSV
 * Includes UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel opens it cleanly
 * with proper column separation and character encoding.
 */

export function exportToExcel(filename, headers, rows) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  // UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Specifically format and export Leads data to Excel
 * @param {Array} leads
 */
export function exportLeadsToExcel(leads = []) {
  const headers = [
    'Lead ID',
    'Customer Name',
    'Email Address',
    'Phone Number',
    'Pipeline Stage',
    'Assigned Representative',
    'Representative Email',
    'Lead Source',
    'Next Follow-up Date',
    'Registration Date',
  ];

  const rows = leads.map((lead) => [
    lead.id || '',
    lead.name || '',
    lead.email || 'N/A',
    lead.phone || '',
    lead.stage || '',
    lead.assignedSalesEmployee?.name || lead.assignedToName || 'Unassigned',
    lead.assignedSalesEmployee?.email || '',
    lead.source || 'Walk-in',
    lead.follow_up_date || lead.followupDate || 'None',
    lead.created_at || lead.createdAt
      ? new Date(lead.created_at || lead.createdAt).toLocaleDateString('en-IN')
      : '',
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(`RealEstate_CRM_Leads_${timestamp}`, headers, rows);
}

/**
 * Specifically format and export Property Developments & Projects data to Excel (.csv)
 * @param {Array} projects
 */
export function exportProjectsToExcel(projects = []) {
  const headers = [
    'Project ID',
    'Project Name',
    'City',
    'State',
    'Country',
    'Specific Location / Address',
    'Starting Price',
    'Full Price Bracket',
    'Possession Date',
    'Towers / Blocks',
    'Total Units',
    'Available Units',
    'Booked / Allotted Units',
    'Occupancy Rate',
    'Status',
    'Overview / Highlights',
    'Created Date',
  ];

  const rows = projects.map((proj) => {
    const projectUnits = proj.buildings?.flatMap((b) => b.units || []) || [];
    const availableUnits = projectUnits.filter((u) => u.status === 'AVAILABLE').length;
    const totalUnits = projectUnits.length;
    const bookedUnits = totalUnits - availableUnits;
    const occupancyRate = totalUnits ? `${Math.round((bookedUnits / totalUnits) * 100)}%` : '0%';
    const towersCount = proj.buildings?.length || 0;

    return [
      proj.id || '',
      proj.name || '',
      proj.city || '',
      proj.state || '',
      proj.country || 'India',
      proj.location || '',
      proj.starting_price || proj.startingPrice || '',
      proj.price_range || proj.priceRange || '',
      proj.possession_date || proj.possessionDate || '',
      towersCount,
      totalUnits,
      availableUnits,
      bookedUnits,
      occupancyRate,
      proj.status || 'ACTIVE',
      proj.description || '',
      proj.created_at || proj.createdAt
        ? new Date(proj.created_at || proj.createdAt).toLocaleDateString('en-IN')
        : '',
    ];
  });

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(`RealEstate_CRM_Projects_${timestamp}`, headers, rows);
}

/**
 * Specifically format and export Unit Inventory data to Excel (.csv)
 * @param {Array} units
 */
export function exportUnitsToExcel(units = []) {
  const headers = [
    'Unit ID',
    'Unit Number',
    'Project Name',
    'Tower / Building',
    'Typology / Config',
    'Floor Level',
    'Super Area (sq ft)',
    'Estimated Carpet Area (sq ft)',
    'Facing Direction',
    'Price (INR)',
    'Price Display',
    'Availability Status',
    'Created Date',
  ];

  const rows = units.map((u) => {
    const projName = u.building?.project?.name || u.projectName || 'Residential Development';
    const bldName = u.building?.name || u.buildingName || 'Tower Block';
    const priceNum = Number(u.price) || 0;
    const priceDisplay = priceNum > 0 ? (priceNum >= 10000000 ? `₹${(priceNum / 10000000).toFixed(2)} Cr` : `₹${(priceNum / 100000).toFixed(2)} L`) : 'N/A';
    const area = Number(u.area) || 0;
    const carpet = area > 0 ? Math.round(area * 0.76) : '';

    return [
      u.id || '',
      u.unit_number || u.unitNumber || '',
      projName,
      bldName,
      u.unit_type || u.type || '',
      u.floor !== undefined ? `${u.floor}th Floor` : '',
      area,
      carpet,
      u.facing || 'East',
      priceNum,
      priceDisplay,
      u.status || 'AVAILABLE',
      u.created_at || u.createdAt
        ? new Date(u.created_at || u.createdAt).toLocaleDateString('en-IN')
        : '',
    ];
  });

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(`RealEstate_CRM_Unit_Inventory_${timestamp}`, headers, rows);
}

/**
 * Specifically format and export Bookings data to Excel (.csv)
 * @param {Array} bookings
 */
export function exportBookingsToExcel(bookings = []) {
  const headers = [
    'Booking Reference',
    'Booking Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Project Name',
    'Tower / Building',
    'Unit Number',
    'Typology / Config',
    'Floor Level',
    'Token Deposit (INR)',
    'Total Price (INR)',
    'Booking Status',
    'Payment Status',
    'Booked By (Agent)',
    'Agent Email',
    'Cancellation Reason',
  ];

  const rows = bookings.map((b) => {
    const lead = b.lead || {};
    const unit = b.unit || {};
    const building = unit.building || {};
    const project = building.project || {};
    const agent = b.bookedBy || {};

    const tokenAmount = Number(b.amount || b.bookingAmount) || 0;
    const totalPrice = Number(unit.price || b.totalPrice) || tokenAmount;

    return [
      b.booking_reference || b.id || '',
      b.booking_date || b.bookedDate
        ? new Date(b.booking_date || b.bookedDate).toLocaleDateString('en-IN')
        : '',
      lead.name || b.customerName || 'N/A',
      lead.phone || b.customerPhone || 'N/A',
      lead.email || b.customerEmail || '',
      project.name || b.projectName || 'Residential',
      building.name || b.buildingName || '',
      unit.unit_number || b.unitNumber || '',
      unit.unit_type || b.unitType || '',
      unit.floor !== undefined ? `${unit.floor}th Floor` : '',
      tokenAmount,
      totalPrice,
      b.status || 'CONFIRMED',
      b.payment_status || b.paymentStatus || 'TOKEN_RECEIVED',
      agent.name || b.bookedBy || 'Direct',
      agent.email || '',
      b.cancellation_reason || b.cancelReason || '',
    ];
  });

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(`RealEstate_CRM_Bookings_${timestamp}`, headers, rows);
}

export default exportLeadsToExcel;
