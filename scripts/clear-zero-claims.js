const database = require('../shared/database/connection');
const { Claim } = require('../shared/database/models');

(async () => {
  try {
    if (!database.isConnected()) {
      await database.connect();
    }

    const { data, error } = await database.getClient()
      .from('claims')
      .delete()
      .lte('amount_calculated', 0);

    if (error) {
      console.error('Error deleting zero-amount claims:', error.message || error);
    } else {
      const deleted = Array.isArray(data) ? data.length : 0;
      console.log('Deleted zero-amount claims:', deleted);
    }
  } catch (e) {
    console.error('Unexpected error deleting zero-amount claims:', e.message || e);
  } finally {
    process.exit(0);
  }
})();
