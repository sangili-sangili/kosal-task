'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('leads');
    if (!tableInfo.avatar) {
      await queryInterface.addColumn('leads', 'avatar', {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('leads');
    if (tableInfo.avatar) {
      await queryInterface.removeColumn('leads', 'avatar');
    }
  },
};
