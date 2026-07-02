const OSRM_BASE_URL = import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org/route/v1/driving';

function validateOsrmResponse(data) {
  return data && data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0;
}

function parseOsrmSteps(legs) {
  return legs.flatMap((leg) =>
    (leg.steps || []).map((step) => ({
      name: step.name || 'Unnamed road',
      distance: step.distance || 0,
      duration: step.duration || 0,
      maneuver: step.maneuver || {},
      instruction: step.maneuver?.instruction || step.name || 'Continue',
    }))
  );
}

export async function fetchDrivingRoute(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error('At least two waypoints are required to build a route.');
  }

  // Support both lat/lon and latitude/longitude formats
  const coordinates = waypoints
    .map((wp) => `${wp.lon || wp.longitude},${wp.lat || wp.latitude}`)
    .join(';');
  
  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=true&annotations=distance,duration`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Routing request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!validateOsrmResponse(data)) {
    throw new Error('OSRM route response was invalid.');
  }

  const route = data.routes[0];
  const geometry = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
  const steps = parseOsrmSteps(route.legs || []);

  return {
    geometry,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    steps,
  };
}

export function formatRoadName(name) {
  if (!name || name === '') {
    return 'Unnamed road';
  }
  return name;
}
