export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

// Very rough approximation: 1 degree latitude ~ 111 km. 
// At equator, 1 degree longitude ~ 111 km.
// For bounding box we slightly over-fetch by not adjusting for cosine of latitude perfectly.
export function getBoundingBox(lat: number, lon: number, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));
  
  return {
    minLat: lat - latDelta,
    minLon: lon - lonDelta,
    maxLat: lat + latDelta,
    maxLon: lon + lonDelta
  };
}
