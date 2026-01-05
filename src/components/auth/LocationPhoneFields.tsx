import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGeonames } from '@/hooks/useGeonames';
import { parsePhoneNumberFromString, AsYouType, CountryCode, getCountryCallingCode } from 'libphonenumber-js';

interface LocationPhoneFieldsProps {
  country: string;
  region: string;
  district: string;
  phoneNumber: string;
  onCountryChange: (value: string, code: string) => void;
  onRegionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onPhoneChange: (formattedPhone: string, fullPhone: string) => void;
}

export function LocationPhoneFields({
  country,
  region,
  district,
  phoneNumber,
  onCountryChange,
  onRegionChange,
  onDistrictChange,
  onPhoneChange
}: LocationPhoneFieldsProps) {
  const {
    countries,
    regions,
    districts,
    loadingCountries,
    loadingRegions,
    loadingDistricts,
    fetchRegions,
    fetchDistricts
  } = useGeonames();

  const [countryOpen, setCountryOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [localPhone, setLocalPhone] = useState('');
  const [countryCallingCode, setCountryCallingCode] = useState('');

  // Country code to libphonenumber country code mapping
  const getLibPhoneCountryCode = (geonamesCountryCode: string): CountryCode => {
    return geonamesCountryCode as CountryCode;
  };

  const handleCountrySelect = (countryName: string, countryCode: string) => {
    setSelectedCountryCode(countryCode);
    onCountryChange(countryName, countryCode);
    setCountryOpen(false);
    
    // Reset region and district
    onRegionChange('');
    onDistrictChange('');
    setSelectedRegionId(null);
    setLocalPhone('');
    
    // Fetch regions for selected country
    fetchRegions(countryCode);
    
    // Get calling code
    try {
      const callingCode = getCountryCallingCode(getLibPhoneCountryCode(countryCode));
      setCountryCallingCode(`+${callingCode}`);
    } catch {
      setCountryCallingCode('');
    }
  };

  const handleRegionSelect = (regionName: string, regionId: number) => {
    setSelectedRegionId(regionId);
    onRegionChange(regionName);
    setRegionOpen(false);
    
    // Reset district
    onDistrictChange('');
    
    // Fetch districts for selected region
    fetchDistricts(regionId, selectedCountryCode);
  };

  const handleDistrictSelect = (districtName: string) => {
    onDistrictChange(districtName);
    setDistrictOpen(false);
  };

  const handlePhoneInput = (value: string) => {
    // Remove any non-digit characters except spaces
    const digitsOnly = value.replace(/[^\d\s]/g, '');
    setLocalPhone(digitsOnly);
    
    if (selectedCountryCode && digitsOnly) {
      try {
        // Format as user types
        const formatter = new AsYouType(getLibPhoneCountryCode(selectedCountryCode));
        const formatted = formatter.input(digitsOnly);
        
        // Get full phone number with country code for storage
        const fullNumber = `${countryCallingCode}${digitsOnly.replace(/\s/g, '')}`;
        
        onPhoneChange(formatted, fullNumber);
      } catch {
        onPhoneChange(digitsOnly, `${countryCallingCode}${digitsOnly.replace(/\s/g, '')}`);
      }
    } else {
      onPhoneChange(digitsOnly, digitsOnly);
    }
  };

  return (
    <div className="space-y-4">
      {/* Country Field */}
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              className="w-full justify-between"
            >
              {country || "Select country..."}
              {loadingCountries ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {countries.map((c) => (
                    <CommandItem
                      key={c.countryCode}
                      value={c.countryName}
                      onSelect={() => handleCountrySelect(c.countryName, c.countryCode)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          country === c.countryName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {c.countryName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Region Field */}
      <div className="space-y-2">
        <Label htmlFor="region">Region/State *</Label>
        <Popover open={regionOpen} onOpenChange={setRegionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={regionOpen}
              className="w-full justify-between"
              disabled={!country}
            >
              {region || (country ? "Select region..." : "Select country first")}
              {loadingRegions ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search region..." />
              <CommandList>
                <CommandEmpty>No region found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {regions.map((r) => (
                    <CommandItem
                      key={r.geonameId}
                      value={r.name}
                      onSelect={() => handleRegionSelect(r.name, r.geonameId)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          region === r.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {r.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* District Field */}
      <div className="space-y-2">
        <Label htmlFor="district">District *</Label>
        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={districtOpen}
              className="w-full justify-between"
              disabled={!region}
            >
              {district || (region ? "Select district..." : "Select region first")}
              {loadingDistricts ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search district..." />
              <CommandList>
                <CommandEmpty>No district found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {districts.map((d) => (
                    <CommandItem
                      key={d.geonameId}
                      value={d.name}
                      onSelect={() => handleDistrictSelect(d.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          district === d.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {d.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Phone Number Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="flex gap-2">
          <div className="flex items-center px-3 bg-muted rounded-md border min-w-[70px] justify-center">
            <span className="text-sm font-medium">{countryCallingCode || '+---'}</span>
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder={country ? "Enter phone number" : "Select country first"}
            value={localPhone}
            onChange={(e) => handlePhoneInput(e.target.value)}
            disabled={!country}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Phone number will be stored as: {phoneNumber || 'N/A'}
        </p>
      </div>
    </div>
  );
}
