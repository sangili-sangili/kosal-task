/**
 * Unit Status Constants
 */
const UNIT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
});

const UNIT_STATUS_VALUES = Object.values(UNIT_STATUS);

module.exports = {
  UNIT_STATUS,
  UNIT_STATUS_VALUES,
};
