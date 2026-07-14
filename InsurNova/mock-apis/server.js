const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/**
 * Mock Weather API
 * Simulates weather data with rainfall, temperature, wind
 */
app.get('/mock/weather', (req, res) => {
  const { city = 'Mumbai' } = req.query;
  
  // Generate realistic mock data
  const conditions = ['Clear', 'Rainy', 'Cloudy', 'Stormy', 'Partly Cloudy'];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const rainfall = randomCondition === 'Rainy' || randomCondition === 'Stormy' 
    ? Math.floor(Math.random() * 100) + 20  // 20-120mm
    : Math.floor(Math.random() * 10);       // 0-10mm
  
  const temperature = Math.floor(Math.random() * 20) + 25; // 25-45°C
  const humidity = Math.floor(Math.random() * 40) + 50;    // 50-90%
  const windSpeed = Math.floor(Math.random() * 30) + 5;    // 5-35 km/h
  
  res.json({
    success: true,
    source: 'mock_weather_api',
    location: city,
    timestamp: new Date().toISOString(),
    data: {
      condition: randomCondition,
      temperature: temperature,
      feels_like: temperature + Math.floor(Math.random() * 5),
      humidity: humidity,
      rainfall_mm: rainfall,
      rainfall_24h: rainfall * 1.5,
      wind_speed_kmh: windSpeed,
      visibility_km: Math.floor(Math.random() * 10) + 5,
      pressure_mb: Math.floor(Math.random() * 50) + 1000,
      severity: rainfall > 50 ? 'high' : rainfall > 20 ? 'medium' : 'low',
      alert: rainfall > 50 ? 'Heavy rainfall warning' : null
    }
  });
});

/**
 * Mock AQI (Air Quality Index) API
 * Simulates pollution data
 */
app.get('/mock/aqi', (req, res) => {
  const { city = 'Mumbai' } = req.query;
  
  // AQI ranges: 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive, 151-200 Unhealthy, 201+ Very Unhealthy
  const aqi = Math.floor(Math.random() * 250) + 20; // 20-270
  
  let category, severity, healthAdvice;
  if (aqi <= 50) {
    category = 'Good';
    severity = 'low';
    healthAdvice = 'Air quality is satisfactory';
  } else if (aqi <= 100) {
    category = 'Moderate';
    severity = 'medium';
    healthAdvice = 'Acceptable for most people';
  } else if (aqi <= 150) {
    category = 'Unhealthy for Sensitive Groups';
    severity = 'medium';
    healthAdvice = 'Sensitive individuals should limit outdoor exposure';
  } else if (aqi <= 200) {
    category = 'Unhealthy';
    severity = 'high';
    healthAdvice = 'Everyone should reduce outdoor activities';
  } else {
    category = 'Very Unhealthy';
    severity = 'critical';
    healthAdvice = 'Avoid all outdoor activities';
  }
  
  res.json({
    success: true,
    source: 'mock_aqi_api',
    location: city,
    timestamp: new Date().toISOString(),
    data: {
      aqi: aqi,
      category: category,
      severity: severity,
      pollutants: {
        pm25: Math.floor(Math.random() * 100) + 20,
        pm10: Math.floor(Math.random() * 150) + 30,
        o3: Math.floor(Math.random() * 80) + 10,
        no2: Math.floor(Math.random() * 60) + 10,
        so2: Math.floor(Math.random() * 40) + 5,
        co: Math.floor(Math.random() * 20) + 2
      },
      health_advice: healthAdvice,
      alert: severity === 'high' || severity === 'critical' ? 'High pollution alert' : null
    }
  });
});

/**
 * Mock Government Alert API
 * Simulates curfews, lockdowns, emergency alerts
 */
app.get('/mock/govt', (req, res) => {
  const { city = 'Mumbai', state = 'Maharashtra' } = req.query;
  
  // Randomly generate alerts (20% chance)
  const hasAlert = Math.random() < 0.2;
  
  if (!hasAlert) {
    return res.json({
      success: true,
      source: 'mock_govt_api',
      location: { city, state },
      timestamp: new Date().toISOString(),
      data: {
        active_alerts: [],
        message: 'No active government alerts'
      }
    });
  }
  
  const alertTypes = [
    { type: 'curfew', reason: 'Law and order situation', severity: 70, duration: '6 hours' },
    { type: 'lockdown', reason: 'Public health emergency', severity: 85, duration: '3 days' },
    { type: 'curfew', reason: 'VIP movement', severity: 40, duration: '2 hours' },
    { type: 'emergency', reason: 'Natural disaster', severity: 90, duration: 'Until further notice' }
  ];
  
  const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  
  res.json({
    success: true,
    source: 'mock_govt_api',
    location: { city, state },
    timestamp: new Date().toISOString(),
    data: {
      active_alerts: [{
        id: `ALERT-${Date.now()}`,
        type: alert.type,
        severity: alert.severity,
        reason: alert.reason,
        duration: alert.duration,
        issued_at: new Date(Date.now() - 3600000).toISOString(),
        expires_at: new Date(Date.now() + 21600000).toISOString(),
        affected_areas: [city],
        restrictions: alert.type === 'curfew' 
          ? ['No outdoor movement', 'Essential services only']
          : ['Stay at home', 'All non-essential activities prohibited']
      }],
      message: `${alert.type} in effect`
    }
  });
});

/**
 * Mock News API
 * Simulates breaking news about events
 */
app.get('/mock/news', (req, res) => {
  const { category = 'all' } = req.query;
  
  const newsItems = [
    {
      headline: 'Heavy Rainfall Alert: IMD Issues Warning',
      category: 'weather',
      severity: 'high',
      summary: 'India Meteorological Department has issued a red alert for heavy rainfall in Mumbai and surrounding areas.',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
      headline: 'Air Quality Deteriorates: AQI Crosses 200',
      category: 'pollution',
      severity: 'medium',
      summary: 'Air quality index has reached unhealthy levels across major metropolitan areas.',
      timestamp: new Date(Date.now() - 10800000).toISOString()
    },
    {
      headline: 'Heatwave Conditions Persist in North India',
      category: 'weather',
      severity: 'high',
      summary: 'Temperatures soar above 45°C in multiple cities. Health advisory issued for outdoor workers.',
      timestamp: new Date(Date.now() - 14400000).toISOString()
    },
    {
      headline: 'Section 144 Imposed in City Center',
      category: 'government',
      severity: 'medium',
      summary: 'Prohibitory orders under Section 144 have been imposed following public safety concerns.',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];
  
  const filteredNews = category === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === category);
  
  res.json({
    success: true,
    source: 'mock_news_api',
    timestamp: new Date().toISOString(),
    data: {
      count: filteredNews.length,
      articles: filteredNews
    }
  });
});

/**
 * Mock Delivery Platform Profile API
 * Simulates fetching user data from Swiggy/Zomato/Uber
 */
app.get('/mock/delivery-profile', (req, res) => {
  const { userId, platform = 'Swiggy' } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required'
    });
  }

  // Generate realistic mock delivery partner data
  const avgDailyEarnings = Math.floor(Math.random() * 1000) + 800; // ₹800-1800
  const workingHours = Math.floor(Math.random() * 6) + 6; // 6-12 hours
  const totalDeliveries = Math.floor(Math.random() * 500) + 200;
  const rating = (4.0 + Math.random() * 1.0).toFixed(1); // 4.0-5.0
  const onTimePercentage = Math.floor(Math.random() * 15) + 85; // 85-100%

  res.json({
    success: true,
    source: `mock_${platform.toLowerCase()}_api`,
    timestamp: new Date().toISOString(),
    data: {
      userId,
      platform,
      verified: true,
      joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Earnings data
      avgDailyEarnings,
      avgWeeklyEarnings: avgDailyEarnings * 6,
      avgMonthlyEarnings: avgDailyEarnings * 26,
      currency: 'INR',
      
      // Work pattern
      workingHours,
      avgDeliveriesPerDay: Math.floor(totalDeliveries / 100),
      totalDeliveries,
      
      // Performance metrics
      rating: parseFloat(rating),
      onTimePercentage,
      customerSatisfaction: Math.floor(Math.random() * 10) + 90, // 90-100%
      
      // Schedule (mock weekly pattern)
      schedule: {
        monday: { start: '09:00', end: '18:00', active: true },
        tuesday: { start: '09:00', end: '18:00', active: true },
        wednesday: { start: '09:00', end: '18:00', active: true },
        thursday: { start: '09:00', end: '18:00', active: true },
        friday: { start: '09:00', end: '18:00', active: true },
        saturday: { start: '10:00', end: '16:00', active: true },
        sunday: { start: null, end: null, active: false }
      },
      
      // Risk indicators
      riskLevel: workingHours > 10 ? 'medium' : 'low',
      incidents: Math.floor(Math.random() * 3), // 0-2 incidents
      
      // Zone information
      primaryZone: 'Koramangala, Bengaluru',
      secondaryZones: ['HSR Layout', 'BTM Layout', 'Marathahalli']
    }
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'InsurNova Mock APIs running',
    available_endpoints: [
      '/mock/weather?city=Mumbai',
      '/mock/aqi?city=Mumbai',
      '/mock/govt?city=Mumbai&state=Maharashtra',
      '/mock/news?category=all',
      '/mock/delivery-profile?userId=123&platform=Swiggy'
    ]
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🌐 Mock APIs running on port ${PORT}`);
  console.log(`📡 Available at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET /mock/weather`);
  console.log(`  GET /mock/aqi`);
  console.log(`  GET /mock/govt`);
  console.log(`  GET /mock/news`);
});

module.exports = app;
