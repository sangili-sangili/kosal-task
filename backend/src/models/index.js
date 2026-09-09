const { sequelize } = require('../config/database');
const { initUserModel } = require('./User');
const { initProjectModel } = require('./Project');
const { initBuildingModel } = require('./Building');
const { initUnitModel } = require('./Unit');
const { initLeadModel } = require('./Lead');
const { initLeadNoteModel } = require('./LeadNote');
const { initLeadFollowupModel } = require('./LeadFollowup');
const { initBookingModel } = require('./Booking');
const { initAuditLogModel } = require('./AuditLog');

// 1. Initialize Models with Database Connection
const User = initUserModel(sequelize);
const Project = initProjectModel(sequelize);
const Building = initBuildingModel(sequelize);
const Unit = initUnitModel(sequelize);
const Lead = initLeadModel(sequelize);
const LeadNote = initLeadNoteModel(sequelize);
const LeadFollowup = initLeadFollowupModel(sequelize);
const Booking = initBookingModel(sequelize);
const AuditLog = initAuditLogModel(sequelize);

// 2. Define Associations

// A. Project <-> Building (1-to-Many)
Project.hasMany(Building, {
  foreignKey: 'project_id',
  as: 'buildings',
  onDelete: 'CASCADE',
});
Building.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

// B. Building <-> Unit (1-to-Many)
Building.hasMany(Unit, {
  foreignKey: 'building_id',
  as: 'units',
  onDelete: 'CASCADE',
});
Unit.belongsTo(Building, {
  foreignKey: 'building_id',
  as: 'building',
});

// C. Lead <-> LeadNote (1-to-Many)
Lead.hasMany(LeadNote, {
  foreignKey: 'lead_id',
  as: 'notes',
  onDelete: 'CASCADE',
});
LeadNote.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
});

LeadNote.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasMany(LeadNote, {
  foreignKey: 'user_id',
  as: 'notes',
});

// D. Lead <-> LeadFollowup (1-to-Many)
Lead.hasMany(LeadFollowup, {
  foreignKey: 'lead_id',
  as: 'followups',
  onDelete: 'CASCADE',
});
LeadFollowup.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
});

LeadFollowup.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignedSalesEmployee',
});
User.hasMany(LeadFollowup, {
  foreignKey: 'assigned_to',
  as: 'followups',
});

// E. Lead <-> User (assignedSalesEmployee & createdBy)
Lead.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignedSalesEmployee',
});
User.hasMany(Lead, {
  foreignKey: 'assigned_to',
  as: 'assignedLeads',
});

Lead.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});
User.hasMany(Lead, {
  foreignKey: 'created_by',
  as: 'createdLeads',
});

// F. Booking Relationships
Booking.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
});
Lead.hasMany(Booking, {
  foreignKey: 'lead_id',
  as: 'bookings',
});

Booking.belongsTo(Unit, {
  foreignKey: 'unit_id',
  as: 'unit',
});
Unit.hasMany(Booking, {
  foreignKey: 'unit_id',
  as: 'bookings',
});

Booking.belongsTo(User, {
  foreignKey: 'booked_by',
  as: 'bookedBy',
});
User.hasMany(Booking, {
  foreignKey: 'booked_by',
  as: 'bookings',
});

// G. AuditLog <-> User
AuditLog.belongsTo(User, {
  foreignKey: 'actor_id',
  as: 'actorUser',
});
User.hasMany(AuditLog, {
  foreignKey: 'actor_id',
  as: 'auditLogs',
});

module.exports = {
  sequelize,
  User,
  Project,
  Building,
  Unit,
  Lead,
  LeadNote,
  LeadFollowup,
  Booking,
  AuditLog,
};
