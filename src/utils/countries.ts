export interface Country {
  name: string;
  code: string;
  phoneCode: string;
  phoneFormat: string;
  maxLength: number;
  regions: Region[];
}

export interface Region {
  name: string;
  districts: string[];
}

export const countries: Country[] = [
  {
    name: "Tanzania",
    code: "TZ",
    phoneCode: "+255",
    phoneFormat: "+255 ### ### ###",
    maxLength: 13,
    regions: [
      {
        name: "Kilimanjaro",
        districts: ["Hai", "Moshi Rural", "Moshi Urban", "Mwanga", "Rombo", "Same", "Siha"]
      },
      {
        name: "Dar es Salaam",
        districts: ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"]
      },
      {
        name: "Arusha",
        districts: ["Arusha City", "Arusha Rural", "Karatu", "Longido", "Monduli", "Ngorongoro"]
      },
      {
        name: "Dodoma",
        districts: ["Dodoma Urban", "Dodoma Rural", "Bahi", "Chamwino", "Chemba", "Kondoa", "Kongwa", "Mpwapwa"]
      },
      {
        name: "Mwanza",
        districts: ["Nyamagana", "Ilemela", "Magu", "Misungwi", "Sengerema", "Kwimba", "Ukerewe", "Busega"]
      }
    ]
  },
  {
    name: "Kenya",
    code: "KE",
    phoneCode: "+254",
    phoneFormat: "+254 ### ### ###",
    maxLength: 13,
    regions: [
      {
        name: "Nairobi",
        districts: ["Nairobi Central", "Nairobi East", "Nairobi North", "Nairobi South", "Nairobi West"]
      },
      {
        name: "Central",
        districts: ["Kiambu", "Kirinyaga", "Murang'a", "Nyandarua", "Nyeri"]
      },
      {
        name: "Coast",
        districts: ["Kilifi", "Kwale", "Lamu", "Mombasa", "Taita-Taveta", "Tana River"]
      }
    ]
  },
  {
    name: "Uganda",
    code: "UG",
    phoneCode: "+256",
    phoneFormat: "+256 ### ### ###",
    maxLength: 13,
    regions: [
      {
        name: "Central",
        districts: ["Kampala", "Wakiso", "Mpigi", "Mukono", "Luwero", "Nakasongola"]
      },
      {
        name: "Eastern",
        districts: ["Jinja", "Iganga", "Kamuli", "Mbale", "Soroti", "Tororo"]
      }
    ]
  },
  {
    name: "United States",
    code: "US",
    phoneCode: "+1",
    phoneFormat: "+1 (###) ###-####",
    maxLength: 14,
    regions: [
      {
        name: "California",
        districts: ["Los Angeles County", "San Francisco County", "Orange County", "San Diego County"]
      },
      {
        name: "New York",
        districts: ["New York County", "Kings County", "Queens County", "Bronx County"]
      }
    ]
  }
];

export const formatPhoneNumber = (value: string, format: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = format;
  
  for (let i = 0; i < digits.length; i++) {
    formatted = formatted.replace('#', digits[i]);
  }
  
  return formatted.replace(/#/g, '');
};

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getRegionsByCountry = (countryCode: string): Region[] => {
  const country = getCountryByCode(countryCode);
  return country ? country.regions : [];
};

export const getDistrictsByRegion = (countryCode: string, regionName: string): string[] => {
  const regions = getRegionsByCountry(countryCode);
  const region = regions.find(r => r.name === regionName);
  return region ? region.districts : [];
};