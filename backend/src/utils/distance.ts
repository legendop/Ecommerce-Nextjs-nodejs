import config from '../config';
import { DeliveryCalculation } from '../types/express';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate delivery charge and estimate based on distance
 */
export const calculateDelivery = (
  customerLat: number,
  customerLng: number,
  warehouseLat: number = config.WAREHOUSE_LAT,
  warehouseLng: number = config.WAREHOUSE_LNG,
  freeRadiusKm: number = config.FREE_RADIUS_KM,
  baseCharge: number = config.BASE_DELIVERY_CHARGE,
  extraChargePerKm: number = config.EXTRA_CHARGE_PER_KM
): DeliveryCalculation => {
  const distance = calculateDistance(
    warehouseLat,
    warehouseLng,
    customerLat,
    customerLng
  );

  // Within free radius
  if (distance <= freeRadiusKm) {
    return {
      distance,
      deliveryCharge: 0,
      estimate: 'Next day delivery',
      isEligible: true,
    };
  }

  // Calculate extra charge for distance beyond free radius
  const extraDistance = distance - freeRadiusKm;
  const extraCharge = extraDistance * extraChargePerKm;
  const totalCharge = baseCharge + extraCharge;

  return {
    distance,
    deliveryCharge: Math.round(totalCharge),
    estimate: '2-3 days delivery',
    isEligible: true,
  };
};

/**
 * Check if delivery is possible (max distance check)
 */
export const isDeliveryPossible = (
  customerLat: number,
  customerLng: number,
  maxDistanceKm: number = 100,
  warehouseLat: number = config.WAREHOUSE_LAT,
  warehouseLng: number = config.WAREHOUSE_LNG
): boolean => {
  const distance = calculateDistance(
    warehouseLat,
    warehouseLng,
    customerLat,
    customerLng
  );
  return distance <= maxDistanceKm;
};
