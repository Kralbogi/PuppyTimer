// =============================================================================
// PuppyTimer Web - Location Utilities
// Haversine distance calculation and location formatting
// =============================================================================

/**
 * Haversine formula - calculates distance between two lat/lng points in meters
 */
export function haversineUzaklik(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Mesafe formatı - metre veya kilometre cinsinden
 */
export function mesafeFormati(metre: number): string {
  if (metre < 1000) {
    return `${Math.round(metre)}m uzakta`;
  }
  return `${(metre / 1000).toFixed(1)}km uzakta`;
}
