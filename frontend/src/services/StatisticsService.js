/**
 * StatisticsService - Calculate real optimization statistics
 * 
 * All calculations are based on actual route data from OSRM and OR-Tools
 */

const FUEL_MILEAGE_KM_PER_LITER = 15;
const FUEL_PRICE_PER_LITER = 105;
const AVERAGE_SPEED_KM_PER_HOUR = 40;

/**
 * Calculate fuel saved based on distance saved
 * @param {number} distanceSavedKm - Distance saved in kilometers
 * @returns {number} Fuel saved in liters
 */
export function calculateFuelSaved(distanceSavedKm) {
  if (!distanceSavedKm || distanceSavedKm <= 0) return 0;
  return distanceSavedKm / FUEL_MILEAGE_KM_PER_LITER;
}

/**
 * Calculate money saved based on fuel saved
 * @param {number} fuelSavedLiters - Fuel saved in liters
 * @returns {number} Money saved in rupees
 */
export function calculateMoneySaved(fuelSavedLiters) {
  if (!fuelSavedLiters || fuelSavedLiters <= 0) return 0;
  return fuelSavedLiters * FUEL_PRICE_PER_LITER;
}

/**
 * Calculate time saved based on distance saved
 * @param {number} distanceSavedKm - Distance saved in kilometers
 * @returns {number} Time saved in minutes
 */
export function calculateTimeSaved(distanceSavedKm) {
  if (!distanceSavedKm || distanceSavedKm <= 0) return 0;
  return (distanceSavedKm / AVERAGE_SPEED_KM_PER_HOUR) * 60;
}

/**
 * Calculate distance saved percentage
 * @param {number} originalDistanceKm - Original distance in kilometers
 * @param {number} optimizedDistanceKm - Optimized distance in kilometers
 * @returns {number} Percentage saved
 */
export function calculateDistanceSavedPercent(originalDistanceKm, optimizedDistanceKm) {
  if (!originalDistanceKm || originalDistanceKm <= 0) return 0;
  const distanceSaved = originalDistanceKm - optimizedDistanceKm;
  return (distanceSaved / originalDistanceKm) * 100;
}

/**
 * Calculate complete optimization statistics
 * @param {Object} params - Optimization parameters
 * @param {number} params.originalDistanceKm - Original distance
 * @param {number} params.optimizedDistanceKm - Optimized distance
 * @param {number} params.originalDurationMinutes - Original duration
 * @param {number} params.optimizedDurationMinutes - Optimized duration
 * @param {number} params.solverTimeMs - Solver time in milliseconds
 * @param {number} params.osrmResponseTimeMs - OSRM response time in milliseconds
 * @param {number} params.acceptedRiders - Number of accepted riders
 * @returns {Object} Complete statistics object
 */
export function calculateOptimizationStatistics({
  originalDistanceKm,
  optimizedDistanceKm,
  originalDurationMinutes,
  optimizedDurationMinutes,
  solverTimeMs,
  osrmResponseTimeMs,
  acceptedRiders,
  passengerSegments = [],
}) {
  const distanceSavedKm = originalDistanceKm - optimizedDistanceKm;
  const distanceSavedPercent = calculateDistanceSavedPercent(originalDistanceKm, optimizedDistanceKm);
  const fuelSavedLiters = calculateFuelSaved(distanceSavedKm);
  const moneySavedRupees = calculateMoneySaved(fuelSavedLiters);
  const timeSavedMinutes = calculateTimeSaved(distanceSavedKm);
  const durationSavedMinutes = originalDurationMinutes - optimizedDurationMinutes;
  const averageFare = passengerSegments.length > 0
    ? passengerSegments.reduce((sum, segment) => sum + (segment.fare || 0), 0) / passengerSegments.length
    : 0;
  const totalEarnings = passengerSegments.reduce((sum, segment) => sum + (segment.fare || 0), 0);

  return {
    originalDistanceKm: Math.round(originalDistanceKm * 100) / 100,
    optimizedDistanceKm: Math.round(optimizedDistanceKm * 100) / 100,
    distanceSavedKm: Math.round(distanceSavedKm * 100) / 100,
    distanceSavedPercent: Math.round(distanceSavedPercent * 100) / 100,
    fuelSavedLiters: Math.round(fuelSavedLiters * 100) / 100,
    moneySavedRupees: Math.round(moneySavedRupees * 100) / 100,
    timeSavedMinutes: Math.round(timeSavedMinutes * 100) / 100,
    originalDurationMinutes: Math.round(originalDurationMinutes * 100) / 100,
    optimizedDurationMinutes: Math.round(optimizedDurationMinutes * 100) / 100,
    durationSavedMinutes: Math.round(durationSavedMinutes * 100) / 100,
    solverTimeMs,
    osrmResponseTimeMs,
    totalOptimizationTimeMs: solverTimeMs + osrmResponseTimeMs,
    acceptedRiders,
    pickupStops: acceptedRiders,
    fuelMileage: FUEL_MILEAGE_KM_PER_LITER,
    fuelPrice: FUEL_PRICE_PER_LITER,
    averageSpeed: AVERAGE_SPEED_KM_PER_HOUR,
    averageFare,
    totalEarnings,
  };
}

/**
 * Format statistics for display
 * @param {Object} statistics - Statistics object
 * @returns {Object} Formatted statistics with labels
 */
export function formatStatisticsForDisplay(statistics) {
  return {
    originalDistance: `${statistics.originalDistanceKm} km`,
    optimizedDistance: `${statistics.optimizedDistanceKm} km`,
    distanceSaved: `${statistics.distanceSavedKm} km (${statistics.distanceSavedPercent}%)`,
    fuelSaved: `${statistics.fuelSavedLiters} L`,
    moneySaved: `₹${statistics.moneySavedRupees}`,
    timeSaved: `${statistics.timeSavedMinutes} min`,
    originalDuration: `${statistics.originalDurationMinutes} min`,
    optimizedDuration: `${statistics.optimizedDurationMinutes} min`,
    durationSaved: `${statistics.durationSavedMinutes} min`,
    solverTime: `${statistics.solverTimeMs} ms`,
    osrmTime: `${statistics.osrmResponseTimeMs} ms`,
    totalTime: `${statistics.totalOptimizationTimeMs} ms`,
    acceptedRiders: statistics.acceptedRiders,
    pickupStops: statistics.pickupStops,
    averageFare: `₹${Math.round(statistics.averageFare || 0)}`,
    totalEarnings: `₹${Math.round(statistics.totalEarnings || 0)}`,
  };
}
