interface PhoneFormat {
  code: string;
  maxLength: number;
  format: (input: string) => string;
}

export const phoneFormats: Record<string, PhoneFormat> = {
  'United States': {
    code: '+1',
    maxLength: 10,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) return `${match[1]} ${match[2]} ${match[3]}`;
      return cleaned;
    }
  },
  'United Kingdom': {
    code: '+44',
    maxLength: 10,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{4})(\d{6})$/);
      if (match) return `${match[1]} ${match[2]}`;
      return cleaned;
    }
  },
  'Tanzania': {
    code: '+255',
    maxLength: 9,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
      if (match) return `${match[1]} ${match[2]} ${match[3]}`;
      return cleaned;
    }
  },
  'Kenya': {
    code: '+254',
    maxLength: 9,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{6})$/);
      if (match) return `${match[1]} ${match[2]}`;
      return cleaned;
    }
  },
  'Uganda': {
    code: '+256',
    maxLength: 9,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{6})$/);
      if (match) return `${match[1]} ${match[2]}`;
      return cleaned;
    }
  },
  'South Africa': {
    code: '+27',
    maxLength: 9,
    format: (input: string) => {
      const cleaned = input.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
      if (match) return `${match[1]} ${match[2]} ${match[3]}`;
      return cleaned;
    }
  },
  'Default': {
    code: '+1',
    maxLength: 15,
    format: (input: string) => input.replace(/\D/g, '')
  }
};

export const formatPhoneNumber = (country: string, input: string): string => {
  const format = phoneFormats[country] || phoneFormats['Default'];
  const cleaned = input.replace(/\D/g, '').slice(0, format.maxLength);
  return format.format(cleaned);
};

export const getPhoneCode = (country: string): string => {
  return phoneFormats[country]?.code || phoneFormats['Default'].code;
};

export const getMaxPhoneLength = (country: string): number => {
  return phoneFormats[country]?.maxLength || phoneFormats['Default'].maxLength;
};
