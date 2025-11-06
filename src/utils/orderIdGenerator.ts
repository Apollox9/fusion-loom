/**
 * Generates a unique 10-character Order ID
 * Format: Mix of uppercase A-Z and digits 0-9
 * Example: AB12CD34EF, XY98ZW76QR
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderId = '';
  
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderId += chars[randomIndex];
  }
  
  return orderId;
}

/**
 * Validates if a string matches the Order ID format
 */
export function isValidOrderId(orderId: string): boolean {
  return /^[A-Z0-9]{10}$/.test(orderId);
}
