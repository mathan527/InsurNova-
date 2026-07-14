/**
 * Platform Integration Service
 * Mock integration with delivery platforms
 */

const { logger } = require('../utils/logger');

class PlatformIntegrationService {
  constructor() {
    this.platformName = 'MockDeliveryPlatform';
  }

  generateMockEarnings(userId, days = 30) {
    const earnings = [];
    const today = new Date();
    const baseEarning = 1000;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendBonus = isWeekend ? 1.2 : 1.0;
      const randomFactor = 0.8 + (Math.random() * 0.4);
      
      const dailyEarning = Math.round(baseEarning * weekendBonus * randomFactor);
      
      earnings.push({
        date: date.toISOString(),
        earnings: dailyEarning,
        deliveries: Math.floor(dailyEarning / 50),
        hoursWorked: 8 + Math.floor(Math.random() * 3),
        platform: this.platformName
      });
    }
    
    return earnings;
  }

  async fetchUserEarnings(userId, startDate, endDate) {
    try {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const earningsData = this.generateMockEarnings(userId, days + 30);
      
      const filteredData = earningsData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      const totalEarnings = filteredData.reduce((sum, r) => sum + r.earnings, 0);
      const totalDeliveries = filteredData.reduce((sum, r) => sum + r.deliveries, 0);
      const avgDailyEarnings = filteredData.length > 0 ? totalEarnings / filteredData.length : 0;

      return {
        success: true,
        userId,
        platform: this.platformName,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: filteredData.length
        },
        summary: {
          totalEarnings: Math.round(totalEarnings),
          totalDeliveries,
          avgDailyEarnings: Math.round(avgDailyEarnings),
          avgEarningsPerDelivery: totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0
        },
        dailyData: filteredData
      };
    } catch (error) {
      logger.error('Failed to fetch platform earnings', {error: error.message});
      throw error;
    }
  }

  async verifyDisruption(userId, disruptionDate, duration) {
    try {
      const startDate = new Date(disruptionDate);
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date(disruptionDate);
      endDate.setDate(endDate.getDate() + 1);

      const earningsData = await this.fetchUserEarnings(userId, startDate, endDate);
      
      const disruptionDay = earningsData.dailyData.find(record => {
        const recordDate = new Date(record.date);
        const disruptDate = new Date(disruptionDate);
        return recordDate.toDateString() === disruptDate.toDateString();
      });

      if (!disruptionDay) {
        return {verified: false, reason: 'No earnings data found'};
      }

      const last30Days = earningsData.dailyData.filter(r => new Date(r.date) < new Date(disruptionDate));
      const expectedEarnings = last30Days.length > 0
        ? last30Days.reduce((sum, r) => sum + r.earnings, 0) / last30Days.length
        : 1000;

      const actualEarnings = disruptionDay.earnings;
      const earningsLoss = Math.max(0, expectedEarnings - actualEarnings);
      const lossPercentage = (earningsLoss / expectedEarnings) * 100;

      return {
        verified: true,
        disruptionDate: disruptionDate.toISOString(),
        baselineEarnings: Math.round(expectedEarnings),
        actualEarnings,
        verifiedLoss: Math.round(earningsLoss),
        lossPercentage: Math.round(lossPercentage),
        deliveriesCompleted: disruptionDay.deliveries,
        metadata: {platform: this.platformName, hoursWorked: disruptionDay.hoursWorked}
      };
    } catch (error) {
      logger.error('Failed to verify disruption', {error: error.message});
      throw error;
    }
  }
}

module.exports = new PlatformIntegrationService();
