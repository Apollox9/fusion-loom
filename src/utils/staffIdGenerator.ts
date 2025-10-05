// Generate unique 10-character alphanumeric staff ID
export const generateStaffId = (role: string): string => {
  const prefixes: Record<string, string> = {
    'OPERATOR': 'OPR',
    'AUDITOR': 'AUD',
    'SUPERVISOR': 'SUP',
    'AGENT': 'AGT'
  };

  const prefix = prefixes[role] || 'STF';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomChars = Array.from({ length: 7 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  
  return `${prefix}${randomChars}`;
};

// Validate staff ID format
export const isValidStaffId = (staffId: string): boolean => {
  const pattern = /^(OPR|AUD|SUP|AGT|STF)\d{7}$/;
  return pattern.test(staffId);
};
