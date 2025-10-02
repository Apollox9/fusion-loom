// TZS pricing calculations
const BASE_PRICE = 500; // TZS per garment
const EXTRA_PRICE = 300; // TZS per extra garment (>20)
const MAX_REGULAR_GARMENTS = 20;

export interface StudentPricing {
  studentName: string;
  totalGarments: number;
  regularGarments: number;
  extraGarments: number;
  totalPrice: number;
}

export const calculateStudentPrice = (totalGarments: number): number => {
  if (totalGarments <= MAX_REGULAR_GARMENTS) {
    return totalGarments * BASE_PRICE;
  }
  
  const regularPrice = MAX_REGULAR_GARMENTS * BASE_PRICE;
  const extraGarments = totalGarments - MAX_REGULAR_GARMENTS;
  const extraPrice = extraGarments * EXTRA_PRICE;
  
  return regularPrice + extraPrice;
};

export const calculateSessionTotal = (students: Array<{ totalGarments: number }>): number => {
  return students.reduce((total, student) => {
    return total + calculateStudentPrice(student.totalGarments);
  }, 0);
};

export const formatTZS = (amount: number): string => {
  return `TZS ${amount.toLocaleString('en-US')}`;
};

export const formatCurrency = (amount: number): string => {
  return formatTZS(amount);
};

export const calculateProfitByTier = (studentCount: number, totalAmount: number): number => {
  let profitPercentage = 0;
  
  if (studentCount < 100) {
    profitPercentage = 0.05; // 5%
  } else if (studentCount >= 100 && studentCount < 200) {
    profitPercentage = 0.08; // 8%
  } else if (studentCount >= 200 && studentCount < 500) {
    profitPercentage = 0.10; // 10%
  } else {
    profitPercentage = 0.18; // 18%
  }
  
  return totalAmount * profitPercentage;
};

export const getProfitTier = (studentCount: number): { range: string; percentage: string } => {
  if (studentCount < 100) return { range: '< 100', percentage: '5%' };
  if (studentCount >= 100 && studentCount < 200) return { range: '100-200', percentage: '8%' };
  if (studentCount >= 200 && studentCount < 500) return { range: '200-500', percentage: '10%' };
  return { range: '500+', percentage: '18%' };
};
