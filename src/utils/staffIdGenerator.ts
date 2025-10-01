// Generate unique staff ID with role prefix
export const generateStaffId = (role: string): string => {
  const prefixes: Record<string, string> = {
    'OPERATOR': 'OPR',
    'AUDITOR': 'AUD',
    'SUPERVISOR': 'SUP',
    'AGENT': 'AGT'
  };

  const prefix = prefixes[role] || 'STF';
  const randomNumbers = Math.floor(1000000 + Math.random() * 9000000).toString();
  
  return `${prefix}${randomNumbers}`;
};

// Validate staff ID format
export const isValidStaffId = (staffId: string): boolean => {
  const pattern = /^(OPR|AUD|SUP|AGT|STF)\d{7}$/;
  return pattern.test(staffId);
};
