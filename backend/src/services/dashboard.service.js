const { sequelize, Lead, Unit, Booking, LeadFollowup } = require('../models');
const { ROLES } = require('../constants/roles');
const { LEAD_STAGES } = require('../constants/leadStages');
const { UNIT_STATUS } = require('../constants/unitStatus');
const { BOOKING_STATUS } = require('../constants/bookingStatus');
const { FOLLOWUP_STATUS } = require('../models/LeadFollowup');

class DashboardService {
  /**
   * Aggregate high-level CRM performance metrics scoped by role
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async getMetrics(currentUser) {
    const isSales = currentUser.role === ROLES.SALES;

    // 1. Lead Metrics & Stage Breakdown
    const leadWhere = {};
    if (isSales) {
      leadWhere.assigned_to = currentUser.id;
    }

    const totalLeads = await Lead.count({ where: leadWhere });

    // Count per stage
    const rawStageCounts = await Lead.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: leadWhere,
      group: ['stage'],
      raw: true,
    });

    const stageMap = {};
    Object.values(LEAD_STAGES).forEach((stage) => {
      stageMap[stage] = 0;
    });
    rawStageCounts.forEach((row) => {
      stageMap[row.stage] = parseInt(row.count, 10);
    });

    // 2. Inventory Metrics (Total, Available, Booked, Blocked)
    const totalUnits = await Unit.count();
    const availableUnits = await Unit.count({ where: { status: UNIT_STATUS.AVAILABLE } });
    const bookedUnits = await Unit.count({ where: { status: UNIT_STATUS.BOOKED } });
    const blockedUnits = await Unit.count({ where: { status: UNIT_STATUS.BLOCKED } });

    // 3. Revenue & Confirmed Bookings Metrics
    const bookingWhere = { status: BOOKING_STATUS.CONFIRMED };
    if (isSales) {
      bookingWhere.booked_by = currentUser.id;
    }

    const totalBookingsCount = await Booking.count({ where: bookingWhere });
    const rawRevenue = await Booking.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue']],
      where: bookingWhere,
      raw: true,
    });

    const totalRevenue = rawRevenue[0] && rawRevenue[0].total_revenue
      ? parseFloat(rawRevenue[0].total_revenue)
      : 0.0;

    // 4. Pending Follow-up Activities
    const followupWhere = { status: FOLLOWUP_STATUS.PENDING };
    if (isSales) {
      followupWhere.assigned_to = currentUser.id;
    }
    const pendingFollowupsCount = await LeadFollowup.count({ where: followupWhere });

    return {
      leads: {
        total: totalLeads,
        byStage: stageMap,
      },
      inventory: {
        totalUnits,
        availableUnits,
        bookedUnits,
        blockedUnits,
      },
      revenue: {
        totalRevenue,
        totalBookingsCount,
      },
      followups: {
        pendingCount: pendingFollowupsCount,
      },
    };
  }
}

module.exports = new DashboardService();
