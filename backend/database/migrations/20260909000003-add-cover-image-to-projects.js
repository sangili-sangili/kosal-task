'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('projects');
    if (!tableInfo.cover_image) {
      await queryInterface.addColumn('projects', 'cover_image', {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('projects');
    if (tableInfo.cover_image) {
      await queryInterface.removeColumn('projects', 'cover_image');
    }
  },
};
