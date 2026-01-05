import { useState, useEffect } from "react";

const GEONAMES_USERNAME = "apollo_x9"; // Using demo account - in production, use your own

interface Country {
  geonameId: number;
  countryCode: string;
  countryName: string;
}

interface Region {
  geonameId: number;
  name: string;
  adminCode1: string;
}

interface District {
  geonameId: number;
  name: string;
  adminCode2: string;
}

export function useGeonames() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Fallback data for when API fails
  const fallbackCountries: Country[] = [
    { geonameId: 149590, countryCode: "TZ", countryName: "Tanzania" },
    { geonameId: 192950, countryCode: "KE", countryName: "Kenya" },
    { geonameId: 226074, countryCode: "UG", countryName: "Uganda" },
    { geonameId: 953987, countryCode: "ZA", countryName: "South Africa" },
    { geonameId: 6252001, countryCode: "US", countryName: "United States" },
    { geonameId: 2635167, countryCode: "GB", countryName: "United Kingdom" },
  ];

  const fallbackRegions: Record<string, Region[]> = {
    TZ: [
      { geonameId: 1, name: "Dar es Salaam", adminCode1: "23" },
      { geonameId: 2, name: "Arusha", adminCode1: "01" },
      { geonameId: 3, name: "Dodoma", adminCode1: "03" },
      { geonameId: 4, name: "Mwanza", adminCode1: "18" },
      { geonameId: 5, name: "Kilimanjaro", adminCode1: "09" },
      { geonameId: 6, name: "Morogoro", adminCode1: "16" },
      { geonameId: 7, name: "Tanga", adminCode1: "25" },
      { geonameId: 8, name: "Mbeya", adminCode1: "14" },
      { geonameId: 9, name: "Iringa", adminCode1: "04" },
      { geonameId: 10, name: "Pwani", adminCode1: "19" },
    ],
    KE: [
      { geonameId: 1, name: "Nairobi", adminCode1: "30" },
      { geonameId: 2, name: "Mombasa", adminCode1: "28" },
      { geonameId: 3, name: "Kisumu", adminCode1: "17" },
      { geonameId: 4, name: "Nakuru", adminCode1: "31" },
      { geonameId: 5, name: "Eldoret", adminCode1: "45" },
    ],
    UG: [
      { geonameId: 1, name: "Kampala", adminCode1: "C" },
      { geonameId: 2, name: "Wakiso", adminCode1: "W" },
      { geonameId: 3, name: "Mukono", adminCode1: "M" },
      { geonameId: 4, name: "Jinja", adminCode1: "J" },
      { geonameId: 5, name: "Mbarara", adminCode1: "MB" },
    ],
  };

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch(`https://secure.geonames.org/countryInfoJSON?username=${GEONAMES_USERNAME}`);
      const data = await response.json();
      if (data.geonames) {
        setCountries(
          data.geonames.map((c: any) => ({
            geonameId: c.geonameId,
            countryCode: c.countryCode,
            countryName: c.countryName,
          })),
        );
      } else {
        setCountries(fallbackCountries);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries(fallbackCountries);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchRegions = async (countryCode: string) => {
    setLoadingRegions(true);
    setRegions([]);
    setDistricts([]);
    try {
      const response = await fetch(
        `https://secure.geonames.org/childrenJSON?geonameId=${getCountryGeonameId(countryCode)}&username=${GEONAMES_USERNAME}`,
      );
      const data = await response.json();
      if (data.geonames) {
        setRegions(
          data.geonames.map((r: any) => ({
            geonameId: r.geonameId,
            name: r.name || r.toponymName,
            adminCode1: r.adminCode1,
          })),
        );
      } else if (fallbackRegions[countryCode]) {
        setRegions(fallbackRegions[countryCode]);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      if (fallbackRegions[countryCode]) {
        setRegions(fallbackRegions[countryCode]);
      }
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchDistricts = async (regionGeonameId: number, countryCode: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    try {
      const response = await fetch(
        `https://secure.geonames.org/childrenJSON?geonameId=${regionGeonameId}&username=${GEONAMES_USERNAME}`,
      );
      const data = await response.json();
      if (data.geonames && data.geonames.length > 0) {
        setDistricts(
          data.geonames.map((d: any) => ({
            geonameId: d.geonameId,
            name: d.name || d.toponymName,
            adminCode2: d.adminCode2 || "",
          })),
        );
      } else {
        // If no children, use the region itself as the district
        const region = regions.find((r) => r.geonameId === regionGeonameId);
        if (region) {
          setDistricts([
            {
              geonameId: regionGeonameId,
              name: region.name,
              adminCode2: "",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const getCountryGeonameId = (countryCode: string): number => {
    const country = countries.find((c) => c.countryCode === countryCode);
    return country?.geonameId || 0;
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  return {
    countries,
    regions,
    districts,
    loadingCountries,
    loadingRegions,
    loadingDistricts,
    fetchRegions,
    fetchDistricts,
  };
}
