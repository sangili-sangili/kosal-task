import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Loader2 } from 'lucide-react';
import {
  fetchCountries,
  fetchStatesForCountry,
  fetchCitiesForState,
  FALLBACK_COUNTRIES,
  FALLBACK_INDIAN_STATES,
} from '../../utils/locationService';
import Select from '../ui/Select';
import Input from '../ui/Input';

export function StateCitySelect({
  selectedCountry = 'India',
  selectedState = 'Karnataka',
  selectedCity = 'Bengaluru',
  onCountryChange,
  onStateChange,
  onCityChange,
  countryError,
  stateError,
  cityError,
}) {
  const [countriesList, setCountriesList] = useState(FALLBACK_COUNTRIES);
  const [statesList, setStatesList] = useState(FALLBACK_INDIAN_STATES);
  const [citiesList, setCitiesList] = useState([]);

  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [isCustomState, setIsCustomState] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [apiSource, setApiSource] = useState('Loading...');

  // 1. Fetch Global Countries on Mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCountries(true);

    fetchCountries()
      .then((countries) => {
        if (isMounted && countries && countries.length > 0) {
          setCountriesList(countries);
          setApiSource('CountriesNow Public API');
        }
      })
      .catch(() => {
        if (isMounted) setApiSource('Cached Geo Catalog');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCountries(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch States when Country Changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedCountry) return;

    setIsLoadingStates(true);
    fetchStatesForCountry(selectedCountry)
      .then((states) => {
        if (isMounted) {
          setStatesList(states);
          // If current state not in new country's states, select the first one
          if (states && states.length > 0) {
            if (!states.includes(selectedState) && !isCustomState) {
              onStateChange?.(states[0]);
            }
          } else {
            // If country has no sub-states returned, switch to custom state input
            setIsCustomState(true);
            onStateChange?.('');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatesList(['Capital Region', 'Central Province']);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingStates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // 3. Fetch Cities when Country or State Changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedState) return;

    setIsLoadingCities(true);
    fetchCitiesForState(selectedCountry, selectedState)
      .then((cities) => {
        if (isMounted) {
          setCitiesList(cities);
          // If current city is not in the new list, default to first city
          if (cities && cities.length > 0) {
            if (!cities.includes(selectedCity) && !isCustomCity) {
              onCityChange?.(cities[0]);
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setCitiesList(['Central City', 'Metro Region']);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry, selectedState]);

  const isGeoLoading = isLoadingCountries || isLoadingStates || isLoadingCities;

  return (
    <div className="space-y-1.5">
      {/* Top API status pill */}
      <div className="flex items-center justify-between pb-0.5">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          Location Master <span className="text-slate-400 font-normal">(Country, State & City)</span>
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/80">
          <Globe className="w-2.5 h-2.5 text-brand-600" />
          {isGeoLoading ? (
            <>
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Fetching Geo...
            </>
          ) : (
            `Live: ${apiSource}`
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Country Selector */}
        <div>
          <Select
            label="Country"
            required
            disabled={isLoadingCountries}
            value={selectedCountry}
            onChange={(e) => {
              const newCountry = e.target.value;
              onCountryChange?.(newCountry);
            }}
            error={countryError}
            options={countriesList.map((c) => ({
              value: c,
              label: c,
            }))}
          />
        </div>

        {/* 2. State / Province Selector */}
        <div>
          {isCustomState ? (
            <div className="space-y-1">
              <Input
                label="State / Province"
                placeholder="Enter state or province"
                required
                value={selectedState}
                onChange={(e) => onStateChange?.(e.target.value)}
                error={stateError}
              />
              {statesList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomState(false)}
                  className="text-[11px] text-brand-600 hover:underline font-medium"
                >
                  ← Back to state list
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Select
                label={selectedCountry === 'India' ? 'Select State' : 'State / Province'}
                required
                disabled={isLoadingStates}
                value={selectedState}
                onChange={(e) => {
                  if (e.target.value === '__OTHER_STATE__') {
                    setIsCustomState(true);
                    onStateChange?.('');
                  } else {
                    onStateChange?.(e.target.value);
                  }
                }}
                error={stateError}
                options={[
                  ...statesList.map((st) => ({
                    value: st,
                    label: st,
                  })),
                  { value: '__OTHER_STATE__', label: '+ Type custom state...' },
                ]}
              />
              {isLoadingStates && (
                <div className="absolute right-8 top-7 flex items-center pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. City / Region Selector */}
        <div>
          {isCustomCity ? (
            <div className="space-y-1">
              <Input
                label="City / Metro Region"
                placeholder="Enter specific city name"
                required
                value={selectedCity}
                onChange={(e) => onCityChange?.(e.target.value)}
                error={cityError}
              />
              <button
                type="button"
                onClick={() => setIsCustomCity(false)}
                className="text-[11px] text-brand-600 hover:underline font-medium"
              >
                ← Back to city list
              </button>
            </div>
          ) : (
            <div className="relative">
              <Select
                label={`City in ${selectedState || selectedCountry}`}
                required
                disabled={isLoadingCities}
                value={selectedCity}
                onChange={(e) => {
                  if (e.target.value === '__OTHER__') {
                    setIsCustomCity(true);
                    onCityChange?.('');
                  } else {
                    onCityChange?.(e.target.value);
                  }
                }}
                error={cityError}
                helperText={
                  !cityError && citiesList.length > 0
                    ? `${citiesList.length} cities cataloged`
                    : undefined
                }
                options={[
                  ...citiesList.map((c) => ({
                    value: c,
                    label: c,
                  })),
                  { value: '__OTHER__', label: '+ Type custom city...' },
                ]}
              />
              {isLoadingCities && (
                <div className="absolute right-8 top-7 flex items-center pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StateCitySelect;
