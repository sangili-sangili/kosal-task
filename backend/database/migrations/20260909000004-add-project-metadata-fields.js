'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('projects');

    if (!tableInfo.country) {
      await queryInterface.addColumn('projects', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'India',
      });
    }

    if (!tableInfo.state) {
      await queryInterface.addColumn('projects', 'state', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'Karnataka',
      });
    }

    if (!tableInfo.city) {
      await queryInterface.addColumn('projects', 'city', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'Bengaluru',
      });
    }

    if (!tableInfo.starting_price) {
      await queryInterface.addColumn('projects', 'starting_price', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableInfo.price_range) {
      await queryInterface.addColumn('projects', 'price_range', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableInfo.possession_date) {
      await queryInterface.addColumn('projects', 'possession_date', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('projects');
    if (tableInfo.country) await queryInterface.removeColumn('projects', 'country');
    if (tableInfo.state) await queryInterface.removeColumn('projects', 'state');
    if (tableInfo.city) await queryInterface.removeColumn('projects', 'city');
    if (tableInfo.starting_price) await queryInterface.removeColumn('projects', 'starting_price');
    if (tableInfo.price_range) await queryInterface.removeColumn('projects', 'price_range');
    if (tableInfo.possession_date) await queryInterface.removeColumn('projects', 'possession_date');
  },
};
