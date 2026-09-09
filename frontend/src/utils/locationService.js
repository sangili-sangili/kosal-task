/**
 * Third-party location service for dynamic Country, State, and City loading
 * Uses CountriesNow API (https://countriesnow.space/api/v0.1) with robust local caching
 * and instant global real estate hub fallbacks for maximum resilience.
 */

// In-memory cache for fast responsive UI
const cache = {
  countries: null,
  statesByCountry: {},
  citiesByCountryState: {},
};

// Key global real estate markets fallback
export const FALLBACK_COUNTRIES = [
  'India',
  'United Arab Emirates',
  'United States',
  'United Kingdom',
  'Singapore',
  'Canada',
  'Australia',
  'Saudi Arabia',
  'Qatar',
  'Germany',
  'Malaysia',
  'France',
  'Japan',
  'South Africa',
  'New Zealand',
];

// Resilient default Indian States
export const FALLBACK_INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Delhi',
  'Telangana',
  'Tamil Nadu',
  'Haryana',
  'Uttar Pradesh',
  'Gujarat',
  'West Bengal',
  'Kerala',
  'Rajasthan',
  'Punjab',
  'Andhra Pradesh',
  'Madhya Pradesh',
  'Goa',
];

// Major Real Estate Cities by State (Instant offline fallback for India)
export const FALLBACK_CITIES_BY_STATE = {
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Shivamogga', 'Davangere'],
  Maharashtra: ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai', 'Nagpur', 'Nashik', 'Pimpri-Chinchwad', 'Aurangabad'],
  Delhi: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka'],
  Telangana: ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore'],
  Haryana: ['Gurgaon (Gurugram)', 'Faridabad', 'Panchkula', 'Sonipat', 'Panipat', 'Karnal', 'Rohtak'],
  'Uttar Pradesh': ['Noida', 'Greater Noida', 'Ghaziabad', 'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'New Town (Rajarhat)', 'Siliguri', 'Durgapur', 'Asansol'],
  Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  Punjab: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali', 'Patiala'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kakinada'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
};

// International fallback states
export const FALLBACK_INTERNATIONAL_STATES = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi Emirate', 'Sharjah', 'Ajman Emirate', 'Ras al-Khaimah'],
  'United States': ['California', 'New York', 'Texas', 'Florida', 'Washington', 'Illinois', 'Massachusetts'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  Singapore: ['Central Community Development Council', 'South West', 'North East', 'North West'],
  Canada: ['Ontario', 'British Columbia', 'Quebec', 'Alberta'],
  Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'],
  'Saudi Arabia': ['Riyadh Region', 'Makkah Region', 'Eastern Province', 'Madinah Region'],
};

/**
 * Fetch all Countries from CountriesNow Third-Party API
 */
export async function fetchCountries() {
  if (cache.countries && cache.countries.length > 0) {
    return cache.countries;
  }

  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
    if (!response.ok) {
      throw new Error(`API responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.data && Array.isArray(json.data)) {
      const countryNames = json.data.map((c) => c.name).filter(Boolean);
      // Prioritize India at the top, then sort the rest alphabetically
      const sorted = Array.from(new Set(['India', ...countryNames.sort()]));
      cache.countries = sorted;
      return sorted;
    }
  } catch (error) {
    console.warn('[LocationService] Using fallback countries due to API error:', error);
  }

  cache.countries = FALLBACK_COUNTRIES;
  return FALLBACK_COUNTRIES;
}

/**
 * Fetch all States for a specific Country
 */
export async function fetchStatesForCountry(countryName = 'India') {
  if (!countryName) return [];

  if (cache.statesByCountry[countryName] && cache.statesByCountry[countryName].length > 0) {
    return cache.statesByCountry[countryName];
  }

  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    });

    if (!response.ok) {
      throw new Error(`API responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.data && Array.isArray(json.data.states) && json.data.states.length > 0) {
      const stateNames = json.data.states.map((s) => s.name).filter(Boolean).sort();
      cache.statesByCountry[countryName] = stateNames;
      return stateNames;
    }
  } catch (error) {
    console.warn(`[LocationService] Using fallback states for ${countryName}:`, error);
  }

  const fallback =
    countryName === 'India'
      ? FALLBACK_INDIAN_STATES
      : FALLBACK_INTERNATIONAL_STATES[countryName] || ['Capital Region', 'Central Province', 'Northern State', 'Southern State'];

  cache.statesByCountry[countryName] = fallback;
  return fallback;
}

// Backward-compatibility alias for fetchIndianStates
export async function fetchIndianStates() {
  return fetchStatesForCountry('India');
}

/**
 * Fetch all cities for a specific Country and State from CountriesNow Third-Party API
 */
export async function fetchCitiesForState(countryOrState, maybeState) {
  // Support both (countryName, stateName) and legacy (stateName)
  const countryName = maybeState ? countryOrState : 'India';
  const stateName = maybeState || countryOrState;

  if (!stateName) return [];

  const cacheKey = `${countryName}_${stateName}`;
  if (cache.citiesByCountryState[cacheKey] && cache.citiesByCountryState[cacheKey].length > 0) {
    return cache.citiesByCountryState[cacheKey];
  }

  const fallbackList =
    countryName === 'India' && FALLBACK_CITIES_BY_STATE[stateName]
      ? FALLBACK_CITIES_BY_STATE[stateName]
      : [stateName, 'Central Metro Area', 'Downtown District'];

  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName, state: stateName }),
    });

    if (!response.ok) {
      throw new Error(`API responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      const merged = Array.from(new Set([...fallbackList, ...json.data])).filter(Boolean).sort();
      cache.citiesByCountryState[cacheKey] = merged;
      return merged;
    }
  } catch (error) {
    console.warn(`[LocationService] Using fallback cities for ${countryName} - ${stateName}:`, error);
  }

  cache.citiesByCountryState[cacheKey] = fallbackList;
  return fallbackList;
}

