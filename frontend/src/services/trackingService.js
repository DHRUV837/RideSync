const EARTH_RADIUS_KM = 6371;

export function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function buildRouteProfile(routeCoordinates) {
  const distances = [0];
  let totalDistance = 0;

  for (let i = 1; i < routeCoordinates.length; i += 1) {
    const previous = routeCoordinates[i - 1];
    const current = routeCoordinates[i];
    const segment = haversineDistance(previous, current);
    totalDistance += segment;
    distances.push(totalDistance);
  }

  return {
    coordinates: routeCoordinates,
    distances,
    totalDistanceKm: totalDistance,
  };
}

export function interpolateAlongRoute(profile, distanceKm) {
  if (!profile || !Array.isArray(profile.coordinates) || profile.coordinates.length === 0) {
    return null;
  }

  const clampedDistance = Math.min(Math.max(distanceKm, 0), profile.totalDistanceKm);
  const { distances, coordinates } = profile;

  if (clampedDistance <= 0) {
    return coordinates[0];
  }
  if (clampedDistance >= profile.totalDistanceKm) {
    return coordinates[coordinates.length - 1];
  }

  let segmentIndex = distances.findIndex((total) => total >= clampedDistance);
  if (segmentIndex <= 0) {
    segmentIndex = 1;
  }

  const segmentStart = coordinates[segmentIndex - 1];
  const segmentEnd = coordinates[segmentIndex];
  const startDistance = distances[segmentIndex - 1];
  const segmentLength = distances[segmentIndex] - startDistance;
  const segmentProgress = segmentLength > 0 ? (clampedDistance - startDistance) / segmentLength : 0;

  return [
    segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * segmentProgress,
    segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * segmentProgress,
  ];
}

export function findStepProgress(steps, traveledMeters) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return { current: null, next: null };
  }

  let cumulative = 0;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const nextCumulative = cumulative + (step.distance || 0);
    if (traveledMeters < nextCumulative) {
      return {
        current: {
          ...step,
          distanceRemaining: nextCumulative - traveledMeters,
          progress: Math.round(((traveledMeters - cumulative) / (step.distance || 1)) * 100),
        },
        next: steps[index + 1] || null,
      };
    }
    cumulative = nextCumulative;
  }

  const last = steps[steps.length - 1];
  return { current: last, next: null };
}

export function getStopProgress(routeProfile, waypointCoordinates) {
  if (!routeProfile || !Array.isArray(routeProfile.coordinates)) {
    return 0;
  }
  return Math.min(100, Math.round((waypointCoordinates.length / routeProfile.coordinates.length) * 100));
}

export function findClosestSegmentIndex(profile, targetCoords) {
  if (!profile || !Array.isArray(profile.coordinates)) {
    return 0;
  }

  let closestIndex = 0;
  let closestDistance = Infinity;

  profile.coordinates.forEach((coords, index) => {
    const distance = haversineDistance(coords, targetCoords);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export function formatEta(minutes) {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `${hours}h ${mins}m`;
}
