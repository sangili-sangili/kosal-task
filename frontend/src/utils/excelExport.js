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

export default exportLeadsToExcel;
