// src/services/routingService.js

/**
 * Free Routing Service using OpenRouteService (OpenStreetMap)
 * No API key needed for basic usage (2000 requests/day limit)
 * Alternative services available: Mapbox, GraphHopper, etc.
 */

// Free OpenRouteService API key (demo key)
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE4ZmFlZjFiNmFmMjQyNjQ4ZDA5MzBiOGRjMzIzMDlhIiwiaCI6Im11cm11cjY0In0='; // Get from https://openrouteservice.org/dev/#/signup

// Alternative: Mapbox free tier (50k requests/month)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Cache for geocoding results
const geocodeCache = new Map();
const citySuggestionsCache = new Map();
const distanceCache = new Map();

/**
 * Helper: Check if string is coordinates
 */
const isCoordinate = (str) => {
  if (!str) return false;
  return /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(str.trim());
};

/**
 * Helper: Parse coordinates from string
 */
const parseCoordinates = (str) => {
  if (!str) return null;
  const [lat, lng] = str.split(',').map(coord => parseFloat(coord.trim()));
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

/**
 * Helper: Format coordinates to string
 */
const formatCoordinates = (lat, lng) => `${lat},${lng}`;

/**
 * Helper: Get vehicle profile for routing
 */
const getVehicleProfile = (vehicleType) => {
  const profiles = {
    TRUCK: 'driving-hgv',
    TRAILER: 'driving-hgv',
    VAN: 'driving-car',
    CAR: 'driving-car',
    MOTORCYCLE: 'driving-motorcycle'
  };
  return profiles[vehicleType] || 'driving-car';
};

/**
 * Helper: Calculate fuel consumption
 */
const calculateFuelConsumption = (distance, vehicleType) => {
  const fuelRates = {
    TRUCK: 35,
    TRAILER: 40,
    VAN: 12,
    CAR: 8,
    MOTORCYCLE: 4
  };
  const rate = fuelRates[vehicleType] || 35;
  return (distance * rate) / 100;
};

/**
 * Helper: Clean address for geocoding
 */
const cleanAddress = (address) => {
  if (!address) return '';
  return address
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Helper: Build full address with South Africa
 */
const buildFullAddress = (address) => {
  let cleaned = cleanAddress(address);
  if (!cleaned.toLowerCase().includes('south africa')) {
    cleaned = cleaned + ', South Africa';
  }
  return cleaned;
};

/* ============================================================
   GEOCODING FUNCTIONS
   ============================================================ */

/**
 * Geocode with Nominatim (primary strategy)
 */
const geocodeWithNominatim = async (location, countryCode = 'za') => {
  const cleanLocation = buildFullAddress(location);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanLocation)}&limit=1&addressdetails=1&countrycodes=${countryCode}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'LogisticsApp/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error('No results from Nominatim');
  }

  const result = data[0];
  const address = result.address || {};
  
  // Calculate confidence score
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
};

/**
 * Geocode with fallback (remove specific numbers/street)
 */
const geocodeWithFallback = async (location) => {
  let simplified = location
    .replace(/^\d+\s+/, '')
    .replace(/\b(stand|erf|plot|portion|unit|flat|apartment)\s+\d+\b/gi, '')
    .trim();
  
  if (simplified === location || simplified.length < 5) {
    throw new Error('No simplification possible');
  }
  
  return await geocodeWithNominatim(simplified);
};

/**
 * Geocode with broad search (city only)
 */
const geocodeWithBroadSearch = async (location) => {
  const parts = location.split(',');
  let cityOnly = parts[0].trim();
  cityOnly = cityOnly.replace(/^\d+\s+/, '').trim();
  
  if (cityOnly === location || cityOnly.length < 3) {
    throw new Error('Cannot extract city name');
  }
  
  return await geocodeWithNominatim(cityOnly);
};

/**
 * Geocode with city only (last resort)
 */
const geocodeWithCityOnly = async (location) => {
  const words = location.split(/[\s,]+/);
  for (const word of words) {
    if (word.length > 3 && word.match(/^[A-Za-z]+$/)) {
      try {
        return await geocodeWithNominatim(word);
      } catch (e) {
        continue;
      }
    }
  }
  throw new Error('No city name found');
};

/* ============================================================
   DISTANCE CALCULATION FUNCTIONS
   ============================================================ */

/**
 * Calculate direct distance using OpenRouteService with coordinates
 */
const calculateDirectDistance = async (originCoords, destCoords) => {
  const origin = parseCoordinates(originCoords);
  const dest = parseCoordinates(destCoords);
  
  if (!origin || !dest) {
    throw new Error('Invalid coordinates');
  }

  const profile = 'driving-car';

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
          [origin.lng, origin.lat],
          [dest.lng, dest.lat]
        ],
        instructions: false,
        geometry: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ORS error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error('No route found');
  }

  const route = data.features[0];
  const distance = route.properties.segments[0].distance / 1000;
  const duration = route.properties.segments[0].duration / 3600;

  return {
    distance: Math.round(distance * 10) / 10,
    duration: Math.round(duration * 10) / 10
  };
};

/**
 * Fallback distance calculation using city names (approximate)
 */
const calculateFallbackDistance = (origin, destination) => {
  const originParts = origin.toLowerCase().split(/[\s,]+/);
  const destParts = destination.toLowerCase().split(/[\s,]+/);
  
  // Approximate distances between major South African cities
  const cityDistances = {
    'johannesburg': { 'durban': 570, 'capetown': 1400, 'pretoria': 55, 'bloemfontein': 400, 'benoni': 25 },
    'durban': { 'johannesburg': 570, 'capetown': 1640, 'pretoria': 620, 'bloemfontein': 600 },
    'capetown': { 'johannesburg': 1400, 'durban': 1640, 'pretoria': 1450, 'bloemfontein': 1000 },
    'pretoria': { 'johannesburg': 55, 'durban': 620, 'capetown': 1450, 'bloemfontein': 450 },
    'bloemfontein': { 'johannesburg': 400, 'durban': 600, 'capetown': 1000, 'pretoria': 450 },
    'benoni': { 'johannesburg': 25, 'pretoria': 60, 'durban': 580 }
  };
  
  let originCity = null;
  let destCity = null;
  
  for (const part of originParts) {
    if (part in cityDistances) {
      originCity = part;
      break;
    }
  }
  
  for (const part of destParts) {
    if (part in cityDistances) {
      destCity = part;
      break;
    }
  }
  
  if (originCity && destCity && originCity in cityDistances && cityDistances[originCity][destCity]) {
    const distance = cityDistances[originCity][destCity];
    return {
      distance: distance,
      duration: Math.round(distance / 60 * 10) / 10
    };
  }
  
  // If no city match, return a default
  return {
    distance: 0,
    duration: 0
  };
};

/* ============================================================
   ROUTING SERVICE - MAIN EXPORT
   ============================================================ */

export const routingService = {

  /**
   * Calculate distance between two locations (for depot tracking)
   * @param {string} origin - Origin address or coordinates (e.g., "lat,lng" or "address")
   * @param {string} destination - Destination address or coordinates
   * @returns {Promise<Object>} - { distance: number, duration: number }
   */
  calculateDistance: async (origin, destination) => {
    try {
      if (!origin || !destination) {
        return { distance: 0, duration: 0 };
      }

      // Check cache
      const cacheKey = `${origin}|${destination}`.toLowerCase();
      if (distanceCache.has(cacheKey)) {
        return distanceCache.get(cacheKey);
      }

      // If coordinates are provided, use direct calculation
      if (isCoordinate(origin) && isCoordinate(destination)) {
        const result = await calculateDirectDistance(origin, destination);
        distanceCache.set(cacheKey, result);
        return result;
      }

      // Otherwise, geocode addresses first
      try {
        const originCoords = await routingService.geocodeLocation(origin);
        const destCoords = await routingService.geocodeLocation(destination);
        
        const result = await calculateDirectDistance(
          formatCoordinates(originCoords.lat, originCoords.lng),
          formatCoordinates(destCoords.lat, destCoords.lng)
        );
        
        distanceCache.set(cacheKey, result);
        return result;
        
      } catch (geocodeError) {
        console.warn('Geocoding failed, using fallback:', geocodeError.message);
        const result = calculateFallbackDistance(origin, destination);
        distanceCache.set(cacheKey, result);
        return result;
      }

    } catch (error) {
      console.error('Distance calculation error:', error);
      return { distance: 0, duration: 0 };
    }
  },

  /**
   * Calculate trip metrics between two locations
   * @param {string} origin - Origin location
   * @param {string} destination - Destination location
   * @param {string} vehicleType - Vehicle type (TRUCK, TRAILER, VAN, CAR)
   * @param {string} service - Which service to use ('ors', 'mapbox', 'graphhopper')
   * @returns {Promise<Object>} - { totalDistance, estimatedDuration, fuelConsumption }
   */
  calculateTripMetrics: async (origin, destination, vehicleType = 'TRUCK', service = 'ors') => {
    try {
      console.log(`Calculating metrics from "${origin}" to "${destination}" using ${service}`);

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

      const fuelConsumption = calculateFuelConsumption(metrics.distance, vehicleType);

      return {
        totalDistance: Math.round(metrics.distance * 10) / 10,
        estimatedDuration: Math.round(metrics.duration * 10) / 10,
        fuelConsumption: Math.round(fuelConsumption),
        coordinates: metrics.coordinates,
        routeGeometry: metrics.routeGeometry,
        serviceUsed: service
      };

    } catch (error) {
      console.error('Error in calculateTripMetrics:', error);
      throw new Error(`Failed to calculate metrics: ${error.message}`);
    }
  },

  /**
   * Calculate route between two locations (simplified API)
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
   */
  geocodeAddress: async (address) => {
    try {
      console.log('Geocoding address:', address);
      
      if (!address || address.trim().length === 0) {
        throw new Error('Address is required');
      }
      
      const result = await routingService.geocodeLocation(address);
      
      return {
        lat: result.lat,
        lng: result.lng,
        displayName: result.displayName,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Geocode address error:', error);
      
      // Try simplified version
      try {
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
   */
  geocodeLocation: async (location) => {
    try {
      const cacheKey = location.toLowerCase().trim();
      if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
      }

      const cleanLocation = buildFullAddress(location);

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
            geocodeCache.set(cacheKey, result);
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
   */
  geocodeAddressComponents: async (addressComponents) => {
    const { street, city, zipCode, province } = addressComponents;
    const parts = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (zipCode) parts.push(zipCode);
    if (province) parts.push(province);
    parts.push('South Africa');
    
    return await routingService.geocodeLocation(parts.join(', '));
  },

  /**
   * Get city suggestions for autocomplete
   */
  suggestCities: async (query, countryCode = 'za') => {
    if (!query || query.length < 2) {
      return [];
    }

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
      }).filter(suggestion => suggestion.city);

      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.city === suggestion.city)
      );

      citySuggestionsCache.set(cacheKey, uniqueSuggestions);
      
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
      return {
        zipCode: address.postcode || null,
        coordinates: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      };

    } catch (error) {
      console.error('Error fetching zip code:', error);
      return { zipCode: null, coordinates: null };
    }
  },

  /**
   * Validate address components
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
   * Clear all caches
   */
  clearCache: () => {
    geocodeCache.clear();
    citySuggestionsCache.clear();
    distanceCache.clear();
    console.log('All caches cleared');
  }
};

/* ============================================================
   ROUTING PROVIDERS (ORS, MAPBOX, GRAPHHOPPER)
   ============================================================ */

/**
 * Calculate with OpenRouteService (free, open-source)
 */
async function calculateWithOpenRouteService(origin, destination, vehicleType) {
  try {
    const originCoords = await routingService.geocodeLocation(origin);
    const destCoords = await routingService.geocodeLocation(destination);

    const profile = getVehicleProfile(vehicleType);

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
    const distance = route.properties.segments[0].distance / 1000;
    const duration = route.properties.segments[0].duration / 3600;

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

    const originCoords = originData.features[0].center;
    const destCoords = destData.features[0].center;

    const dirResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=true`
    );

    const dirData = await dirResponse.json();

    if (!dirData.routes || dirData.routes.length === 0) {
      throw new Error('No route found');
    }

    const distance = dirData.routes[0].distance / 1000;
    const duration = dirData.routes[0].duration / 3600;

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

    const distance = data.paths[0].distance / 1000;
    const duration = data.paths[0].time / 3600000;

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

export default routingService;
