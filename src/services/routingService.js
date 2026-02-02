/**
 * Free Routing Service using OpenRouteService (OpenStreetMap)
 * No API key needed for basic usage (2000 requests/day limit)
 * Alternative services available: Mapbox, GraphHopper, etc.
 */

// Free OpenRouteService API key (demo key)
const ORS_API_KEY = '5b3ce3597851110001cf6248your_key_here'; // Get from https://openrouteservice.org/dev/#/signup

// Alternative: Mapbox free tier (50k requests/month)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export const routingService = {
  /**
   * Calculate trip metrics between two locations
   * @param {string} origin - Origin location (e.g., "Johannesburg, South Africa")
   * @param {string} destination - Destination location
   * @param {string} vehicleType - Vehicle type (TRUCK, TRAILER, VAN, CAR)
   * @param {string} service - Which service to use ('ors', 'mapbox', 'graphhopper')
   * @returns {Promise} - Distance, duration, and fuel consumption
   */
  calculateTripMetrics: async (origin, destination, vehicleType = 'TRUCK', service = 'ors') => {
    try {
      console.log(`Calculating metrics from "${origin}" to "${destination}" using ${service}`);

      // Validate inputs
      if (!origin || !destination) {
        throw new Error('Both origin and destination are required');
      }

      // Use selected service
      let metrics;
      switch (service.toLowerCase()) {
        case 'mapbox':
          metrics = await calculateWithMapbox(origin, destination, vehicleType);
          break;
        case 'graphhopper':
          metrics = await calculateWithGraphHopper(origin, destination, vehicleType);
          break;
        case 'ors':
        default:
          metrics = await calculateWithOpenRouteService(origin, destination, vehicleType);
          break;
      }

      // Calculate fuel consumption
      const fuelConsumption = calculateFuelConsumption(metrics.distance, vehicleType);

      return {
        totalDistance: Math.round(metrics.distance * 10) / 10, // 1 decimal place
        estimatedDuration: Math.round(metrics.duration * 10) / 10,
        fuelConsumption: Math.round(fuelConsumption),
        coordinates: metrics.coordinates,
        routeGeometry: metrics.routeGeometry,
        serviceUsed: service
      };

    } catch (error) {
      console.error('Error in routingService:', error);
      throw new Error(`Failed to calculate metrics: ${error.message}`);
    }
  },

  /**
   * Geocode a location to coordinates
   * @param {string} location - Address or location name
   * @returns {Object} - {lat, lng} coordinates
   */
  geocodeLocation: async (location) => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=za`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'LogisticsApp/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`Location not found: "${location}"`);
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  /**
   * Get multiple route options (fastest, shortest, balanced)
   * @param {string} origin - Origin location
   * @param {string} destination - Destination location
   * @returns {Promise} - Array of route options
   */
  getRouteOptions: async (origin, destination) => {
    try {
      // This is a simplified version - you can enhance it
      const fastest = await calculateWithOpenRouteService(origin, destination, 'TRUCK');

      return [{
        type: 'fastest',
        distance: fastest.distance,
        duration: fastest.duration,
        coordinates: fastest.coordinates
      }];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calculate fuel cost based on current fuel price
   * @param {number} distance - Distance in km
   * @param {string} vehicleType - Vehicle type
   * @param {number} fuelPrice - Price per liter (default: South Africa average)
   * @returns {Object} - Fuel consumption and cost
   */
  calculateFuelCost: (distance, vehicleType, fuelPrice = 23.5) => {
    const fuelLiters = calculateFuelConsumption(distance, vehicleType);
    const cost = fuelLiters * fuelPrice;

    return {
      liters: Math.round(fuelLiters),
      cost: Math.round(cost * 100) / 100,
      fuelPrice,
      costPerKm: Math.round((cost / distance) * 100) / 100
    };
  }
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Calculate with OpenRouteService (free, open-source)
 */
async function calculateWithOpenRouteService(origin, destination, vehicleType) {
  try {
    // Geocode locations first
    const originCoords = await routingService.geocodeLocation(origin);
    const destCoords = await routingService.geocodeLocation(destination);

    // Profile based on vehicle type
    const profile = getVehicleProfile(vehicleType);

    // Call OpenRouteService Directions API
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        },
        body: JSON.stringify({
          coordinates: [
            [originCoords.lng, originCoords.lat],
            [destCoords.lng, destCoords.lat]
          ],
          instructions: false,
          geometry: true
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouteService error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No route found between locations');
    }

    const route = data.features[0];
    const distance = route.properties.segments[0].distance / 1000; // Convert to km
    const duration = route.properties.segments[0].duration / 3600; // Convert to hours

    return {
      distance,
      duration,
      coordinates: {
        origin: originCoords,
        destination: destCoords
      },
      routeGeometry: route.geometry,
      rawData: data
    };

  } catch (error) {
    console.error('OpenRouteService calculation error:', error);
    throw error;
  }
}

/**
 * Calculate with Mapbox (free tier: 50k requests/month)
 */
async function calculateWithMapbox(origin, destination, vehicleType) {
  try {
    if (!MAPBOX_TOKEN) {
      throw new Error('Mapbox token not configured');
    }

    // Geocode with Mapbox
    const geocodeUrl = (location) =>
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_TOKEN}&country=za&limit=1`;

    const [originRes, destRes] = await Promise.all([
      fetch(geocodeUrl(origin)),
      fetch(geocodeUrl(destination))
    ]);

    const [originData, destData] = await Promise.all([
      originRes.json(),
      destRes.json()
    ]);

    if (!originData.features[0] || !destData.features[0]) {
      throw new Error('Could not find one or both locations');
    }

    const originCoords = originData.features[0].center; // [lng, lat]
    const destCoords = destData.features[0].center;

    // Get directions
    const dirResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=true`
    );

    const dirData = await dirResponse.json();

    if (!dirData.routes || dirData.routes.length === 0) {
      throw new Error('No route found');
    }

    const distance = dirData.routes[0].distance / 1000; // km
    const duration = dirData.routes[0].duration / 3600; // hours

    return {
      distance,
      duration,
      coordinates: {
        origin: { lat: originCoords[1], lng: originCoords[0] },
        destination: { lat: destCoords[1], lng: destCoords[0] }
      },
      routeGeometry: dirData.routes[0].geometry,
      rawData: dirData
    };

  } catch (error) {
    console.error('Mapbox calculation error:', error);
    throw error;
  }
}

/**
 * Calculate with GraphHopper (free tier: 500 requests/day)
 */
async function calculateWithGraphHopper(origin, destination, vehicleType) {
  try {
    const apiKey = process.env.REACT_APP_GRAPHHOPPER_KEY || 'demo_key';

    const response = await fetch(
      `https://graphhopper.com/api/1/route?point=${encodeURIComponent(origin)}&point=${encodeURIComponent(destination)}&vehicle=truck&locale=en&key=${apiKey}&points_encoded=false`
    );

    if (!response.ok) {
      throw new Error(`GraphHopper error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.paths || data.paths.length === 0) {
      throw new Error('No route found');
    }

    const distance = data.paths[0].distance / 1000; // km
    const duration = data.paths[0].time / 3600000; // ms to hours

    return {
      distance,
      duration,
      coordinates: {
        origin: data.paths[0].points.coordinates[0],
        destination: data.paths[0].points.coordinates[data.paths[0].points.coordinates.length - 1]
      },
      routeGeometry: data.paths[0].points,
      rawData: data
    };

  } catch (error) {
    console.error('GraphHopper calculation error:', error);
    throw error;
  }
}

/**
 * Get vehicle profile for routing service
 */
function getVehicleProfile(vehicleType) {
  const profiles = {
    TRUCK: 'driving-hgv', // Heavy goods vehicle
    TRAILER: 'driving-hgv',
    VAN: 'driving-car',
    CAR: 'driving-car',
    MOTORCYCLE: 'driving-motorcycle'
  };
  return profiles[vehicleType] || 'driving-car';
}

/**
 * Calculate fuel consumption based on distance and vehicle type
 */
function calculateFuelConsumption(distance, vehicleType) {
  // Average fuel consumption in liters per 100km
  const fuelRates = {
    TRUCK: 35,    // 35L/100km for heavy trucks
    TRAILER: 40,  // 40L/100km for trailers
    VAN: 12,      // 12L/100km for vans
    CAR: 8,       // 8L/100km for cars
    MOTORCYCLE: 4 // 4L/100km for motorcycles
  };

  const rate = fuelRates[vehicleType] || 35;
  return (distance * rate) / 100;
}

export default routingService;