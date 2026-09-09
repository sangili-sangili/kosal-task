/**
 * Lead Stages Constants
 */
const LEAD_STAGES = Object.freeze({
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  SITE_VISIT: 'SITE_VISIT',
  INTERESTED: 'INTERESTED',
  NEGOTIATION: 'NEGOTIATION',
  BOOKED: 'BOOKED',
  LOST: 'LOST',
});

const LEAD_STAGE_VALUES = Object.values(LEAD_STAGES);

module.exports = {
  LEAD_STAGES,
  LEAD_STAGE_VALUES,
};
