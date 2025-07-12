const { logger } = require('~/config');

const options = [
  {
    label: 'com_ui_lm',
    value: 'lm',
  },
  {
    label: 'com_ui_student',
    value: 'student',
  },
  {
    label: 'com_ui_administrative',
    value: 'administrative',
  },
  {
    label: 'com_ui_selfdev',
    value: 'selfdev',
  },
  {
    label: 'com_ui_activities',
    value: 'activities',
  },
  {
    label: 'com_ui_idea',
    value: 'idea',
  },
  {
    label: 'com_ui_travel',
    value: 'travel',
  },
  {
    label: 'com_ui_teach_or_explain',
    value: 'teach_or_explain',
  },
  {
    label: 'com_ui_write',
    value: 'write',
  },
  {
    label: 'com_ui_shop',
    value: 'shop',
  },
  {
    label: 'com_ui_code',
    value: 'code',
  },
  {
    label: 'com_ui_misc',
    value: 'misc',
  },
  {
    label: 'com_ui_roleplay',
    value: 'roleplay',
  },
  {
    label: 'com_ui_finance',
    value: 'finance',
  },
];

module.exports = {
  /**
   * Retrieves the categories asynchronously.
   * @returns {Promise<TGetCategoriesResponse>} An array of category objects.
   * @throws {Error} If there is an error retrieving the categories.
   */
  getCategories: async () => {
    try {
      // const categories = await Categories.find();
      return options;
    } catch (error) {
      logger.error('Error getting categories', error);
      return [];
    }
  },
};
