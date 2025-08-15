let generateLocations = () => {
  // generate-locations.js

  // Centers: [lng, lat]
  const regions = {
    hungary: [19.040235, 47.497913], // Budapest
    netherlands: [4.904138, 52.367573], // Amsterdam
    syria: [36.2765, 33.5138], // Damascus
    italy: [12.496366, 41.902782], // Rome
    germany: [13.404954, 52.520008], // Berlin
  };

  const EARTH_RADIUS = 6371; // km
  const radiusKm = 20; // 20 km radius
  const pointsPerRegion = 400; // 5 × 400 = 2000

  function generateRandomPoint(centerLng, centerLat, radiusKm) {
    // Convert radius from km to radians
    const radiusInRad = radiusKm / EARTH_RADIUS;

    // Random bearing and distance
    const bearing = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusInRad;

    const lat1 = deg2rad(centerLat);
    const lng1 = deg2rad(centerLng);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance) +
        Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing),
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
        Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2),
      );

    return [rad2deg(lng2), rad2deg(lat2)];
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function rad2deg(rad) {
    return rad * (180 / Math.PI);
  }

  function generateAllLocations() {
    const allPoints: number[][] = [];

    for (const [region, [lng, lat]] of Object.entries(regions)) {
      for (let i = 0; i < pointsPerRegion; i++) {
        allPoints.push(generateRandomPoint(lng, lat, radiusKm));
      }
    }

    return allPoints;
  }

  return generateAllLocations();
};
