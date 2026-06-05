/**
 * Free Routing Service using OpenRouteService (OpenStreetMap)
 * No API key needed for basic usage (2000 requests/day limit)
 * Alternative services available: Mapbox, GraphHopper, etc.
 */

// Free OpenRouteService API key (demo key)
const ORS_API_KEY = '5b3ce3597851110001cf6248your_key_here'; // Get from https://openrouteservice.org/dev/#/signup

// Alternative: Mapbox free tier (50k requests/month)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Cache for geocoding results
const geocodeCache = new Map();
const citySuggestionsCache = new Map();

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
   * Calculate route between two locations (simplified API)
   * @param {string} origin - Origin address
   * @param {string} destination - Destination address
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise} - Route information
   */
  calculateRoute: async (origin, destination, vehicleType = 'TRUCK') => {
    try {
      const metrics = await routingService.calculateTripMetrics(origin, destination, vehicleType, 'ors');
      return {
        distanceKm: metrics.totalDistance,
        durationHours: metrics.estimatedDuration,
        fuelConsumption: metrics.fuelConsumption,
        coordinates: metrics.coordinates
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  },

  /**
   * Geocode an address to coordinates (simplified API)
   * @param {string} address - Full address to geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string}>}
   */
  geocodeAddress: async (address) => {
    try {
      console.log('Geocoding address:', address);
      
      if (!address || address.trim().length === 0) {
        throw new Error('Address is required');
      }
      
      // Use the existing geocodeLocation method
      const result = await routingService.geocodeLocation(address);
      
      return {
        lat: result.lat,
        lng: result.lng,
        displayName: result.displayName,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Geocode address error:', error);
      
      // Try a simplified version of the address
      try {
        // Extract just city and province for fallback
        const parts = address.split(',');
        const simplifiedAddress = parts.slice(-2).join(',').trim();
        console.log('Trying simplified address:', simplifiedAddress);
        
        const result = await routingService.geocodeLocation(simplifiedAddress);
        return {
          lat: result.lat,
          lng: result.lng,
          displayName: result.displayName,
          approximated: true,
          confidence: result.confidence
        };
      } catch (fallbackError) {
        console.error('Fallback geocoding also failed:', fallbackError);
        throw error;
      }
    }
  },

  /**
   * Geocode a location to coordinates with multiple fallback strategies
   * @param {string} location - Address or location name
   * @returns {Object} - {lat, lng, displayName, confidence}
   */
  geocodeLocation: async (location) => {
    try {
      // Check cache first
      const cacheKey = location.toLowerCase().trim();
      if (geocodeCache.has(cacheKey)) {
        console.log('Returning cached geocode result for:', location);
        return geocodeCache.get(cacheKey);
      }

      // Clean up the address for better geocoding
      let cleanLocation = location
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
      
      // Add South Africa if not present
      if (!cleanLocation.toLowerCase().includes('south africa')) {
        cleanLocation = cleanLocation + ', South Africa';
      }

      // Try multiple geocoding strategies
      const strategies = [
        () => geocodeWithNominatim(cleanLocation),
        () => geocodeWithFallback(cleanLocation),
        () => geocodeWithBroadSearch(cleanLocation),
        () => geocodeWithCityOnly(cleanLocation)
      ];

      let result = null;
      for (const strategy of strategies) {
        try {
          result = await strategy();
          if (result && result.lat && result.lng) {
            // Cache the successful result
            geocodeCache.set(cacheKey, result);
            console.log('Geocoding successful:', result.displayName);
            return result;
          }
        } catch (error) {
          console.log(`Geocoding strategy failed: ${error.message}`);
        }
      }

      throw new Error(`Location not found: "${location}"`);

    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  /**
   * Geocode with city and zip code components
   * @param {Object} addressComponents - { street, city, zipCode, province }
   * @returns {Object} - Coordinates
   */
  geocodeAddressComponents: async (addressComponents) => {
    const { street, city, zipCode, province } = addressComponents;
    
    // Build full address
    const parts = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (zipCode) parts.push(zipCode);
    if (province) parts.push(province);
    parts.push('South Africa');
    
    const fullAddress = parts.join(', ');
    
    return await routingService.geocodeLocation(fullAddress);
  },

  /**
   * Get city suggestions for autocomplete
   * @param {string} query - Partial city name
   * @param {string} countryCode - Country code (default: 'za' for South Africa)
   * @returns {Promise<Array>} - Array of city suggestions
   */
  suggestCities: async (query, countryCode = 'za') => {
    if (!query || query.length < 2) {
      return [];
    }

    // Check cache
    const cacheKey = `${query}_${countryCode}`.toLowerCase();
    if (citySuggestionsCache.has(cacheKey)) {
      return citySuggestionsCache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&countrycodes=${countryCode}&addressdetails=1&featuretype=city&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'LogisticsApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`City suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();

      const suggestions = data.map(item => {
        const address = item.address || {};
        return {
          city: address.city || address.town || address.village || address.municipality || item.display_name.split(',')[0],
          province: address.state || address.province || '',
          zipCode: address.postcode || '',
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        };
      }).filter(suggestion => suggestion.city); // Remove entries without city name

      // Remove duplicates by city name
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.city === suggestion.city)
      );

      // Cache results
      citySuggestionsCache.set(cacheKey, uniqueSuggestions);
      
      // Limit cache size
      if (citySuggestionsCache.size > 100) {
        const firstKey = citySuggestionsCache.keys().next().value;
        citySuggestionsCache.delete(firstKey);
      }

      return uniqueSuggestions;

    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    }
  },

  /**
   * Get zip code for a city
   * @param {string} city - City name
   * @param {string} province - Province (optional)
   * @returns {Promise<Object>} - { zipCode, coordinates }
   */
  getZipCodeForCity: async (city, province = '') => {
    try {
      const query = province ? `${city}, ${province}, South Africa` : `${city}, South Africa`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&countrycodes=za`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'LogisticsApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Zip code lookup failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return { zipCode: null, coordinates: null };
      }

      const address = data[0].address || {};
      const zipCode = address.postcode || null;
      const coordinates = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };

      return { zipCode, coordinates };

    } catch (error) {
      console.error('Error fetching zip code:', error);
      return { zipCode: null, coordinates: null };
    }
  },

  /**
   * Validate address components
   * @param {string} city - City name
   * @param {string} province - Province
   * @param {string} zipCode - Postal code
   * @returns {Promise<Object>} - { valid, suggestedZipCode, message }
   */
  validateAddress: async (city, province, zipCode) => {
    try {
      const query = `${city}, ${province || ''}, South Africa`.replace(/, ,/g, ',');
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=za`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'LogisticsApp/1.0'
          }
        }
      );

      if (!response.ok) {
        return { valid: true, suggestedZipCode: null, message: 'Unable to validate address' };
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return { valid: false, suggestedZipCode: null, message: 'City not found' };
      }

      // Check if any result matches the zip code
      let matchesZip = false;
      let suggestedZipCode = null;

      for (const result of data) {
        const address = result.address || {};
        const resultZipCode = address.postcode;
        
        if (resultZipCode && zipCode && resultZipCode === zipCode) {
          matchesZip = true;
          break;
        }
        
        if (resultZipCode && !suggestedZipCode) {
          suggestedZipCode = resultZipCode;
        }
      }

      if (zipCode && !matchesZip) {
        return {
          valid: false,
          suggestedZipCode,
          message: suggestedZipCode ? `Suggested zip code: ${suggestedZipCode}` : 'Zip code may be incorrect'
        };
      }

      return { valid: true, suggestedZipCode: null, message: 'Address verified' };

    } catch (error) {
      console.error('Address validation error:', error);
      return { valid: true, suggestedZipCode: null, message: 'Validation failed' };
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
  },

  /**
   * Clear geocoding cache (useful for testing)
   */
  clearCache: () => {
    geocodeCache.clear();
    citySuggestionsCache.clear();
    console.log('Geocoding cache cleared');
  }
};

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Geocode with Nominatim (primary strategy)
 */
async function geocodeWithNominatim(location) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&addressdetails=1&countrycodes=za`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'LogisticsApp/1.0'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error('No results from Nominatim');
  }

  const result = data[0];
  const address = result.address || {};
  
  // Calculate confidence score based on address detail
  let confidence = 1.0;
  if (!address.road && !address.city) confidence = 0.5;
  if (address.postcode) confidence = 0.9;
  
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
    confidence,
    addressDetails: {
      city: address.city || address.town || address.village,
      province: address.state || address.province,
      zipCode: address.postcode,
      street: address.road,
      suburb: address.suburb
    }
  };
}

/**
 * Geocode with fallback (remove specific numbers/street)
 */
async function geocodeWithFallback(location) {
  // Remove street numbers and specific qualifiers
  let simplified = location
    .replace(/^\d+\s+/, '') // Remove leading numbers
    .replace(/\b(stand|erf|plot|portion|unit|flat|apartment)\s+\d+\b/gi, '')
    .replace(/,\s*South\s+Africa$/i, '') // Remove South Africa for this attempt
    .trim();
  
  if (simplified === location || simplified.length < 5) {
    throw new Error('No simplification possible');
  }
  
  return await geocodeWithNominatim(simplified);
}

/**
 * Geocode with broad search (city only)
 */
async function geocodeWithBroadSearch(location) {
  // Extract only city/town name
  const parts = location.split(',');
  let cityOnly = parts[0].trim();
  
  // Remove street numbers from city name
  cityOnly = cityOnly.replace(/^\d+\s+/, '').trim();
  
  if (cityOnly === location || cityOnly.length < 3) {
    throw new Error('Cannot extract city name');
  }
  
  return await geocodeWithNominatim(cityOnly + ', South Africa');
}

/**
 * Geocode with city only (last resort)
 */
async function geocodeWithCityOnly(location) {
  // Try to find any populated place name in the address
  const words = location.split(/[\s,]+/);
  for (const word of words) {
    if (word.length > 3 && word.match(/^[A-Za-z]+$/)) {
      try {
        return await geocodeWithNominatim(word + ', South Africa');
      } catch (e) {
        continue;
      }
    }
  }
  throw new Error('No city name found');
}

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
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json',
          'Authorization': ORS_API_KEY
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
