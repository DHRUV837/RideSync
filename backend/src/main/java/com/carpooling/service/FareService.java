package com.carpooling.service;

import com.carpooling.dto.FareMatrixDto;
import com.carpooling.entity.Ride;
import com.carpooling.entity.RideStop;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamic Fare Engine — M3.
 *
 * Fares between any two points on a ride are computed at runtime using:
 *   fare(A → B) = fareFromOrigin(B) − fareFromOrigin(A)
 *
 * The origin has fareFromOrigin = 0, and the destination's fareFromOrigin = estimatedFare.
 */
@Service
public class FareService {

    /**
     * Builds the ordered fare ladder for a ride.
     * Returns a LinkedHashMap where key = stop name, value = fare from origin.
     * Order: origin → stop1 → stop2 → … → destination.
     */
    private LinkedHashMap<String, Double> buildFareLadder(Ride ride) {
        LinkedHashMap<String, Double> ladder = new LinkedHashMap<>();

        // Origin at ₹0
        String originName = ride.getStartAddress();
        ladder.put(originName, 0.0);

        // Intermediate stops sorted by stopOrder
        List<RideStop> stops = ride.getStops();
        if (stops != null && !stops.isEmpty()) {
            stops.stream()
                    .sorted(Comparator.comparingInt(RideStop::getStopOrder))
                    .forEach(stop -> ladder.put(stop.getStopName(), stop.getFareFromOrigin()));
        }

        // Destination at estimatedFare
        String destName = ride.getEndAddress();
        ladder.put(destName, ride.getEstimatedFare());

        return ladder;
    }

    /**
     * Calculate the fare between two named points on a ride.
     *
     * @param ride           the ride containing stops
     * @param pickupName     name of the pickup point (origin address or stop name)
     * @param dropoffName    name of the dropoff point (stop name or destination address)
     * @return computed fare, or null if either stop name is not found
     */
    public Double calculateFare(Ride ride, String pickupName, String dropoffName) {
        if (pickupName == null || dropoffName == null) {
            return null;
        }

        LinkedHashMap<String, Double> ladder = buildFareLadder(ride);

        Double pickupFare = findFareInLadder(ladder, pickupName);
        Double dropoffFare = findFareInLadder(ladder, dropoffName);

        if (pickupFare == null || dropoffFare == null) {
            return null;
        }

        double fare = dropoffFare - pickupFare;
        return fare > 0 ? fare : null; // fare must be positive (pickup before dropoff)
    }

    /**
     * Look up a stop name in the fare ladder, using case-insensitive contains matching
     * to handle address strings that may be longer than stop names.
     */
    private Double findFareInLadder(LinkedHashMap<String, Double> ladder, String name) {
        String normalised = name.trim().toLowerCase();

        // Exact match first
        for (Map.Entry<String, Double> entry : ladder.entrySet()) {
            if (entry.getKey().trim().equalsIgnoreCase(normalised)) {
                return entry.getValue();
            }
        }

        // Partial match — the address may contain the stop name or vice-versa
        for (Map.Entry<String, Double> entry : ladder.entrySet()) {
            String ladderKey = entry.getKey().trim().toLowerCase();
            if (ladderKey.contains(normalised) || normalised.contains(ladderKey)) {
                return entry.getValue();
            }
        }

        return null;
    }

    /**
     * Returns the full fare matrix for a ride — every valid from→to pair.
     * Only forward segments (pickup before dropoff in route order) are included.
     */
    public FareMatrixDto getFareMatrix(Ride ride) {
        LinkedHashMap<String, Double> ladder = buildFareLadder(ride);

        List<String> orderedNames = new ArrayList<>(ladder.keySet());
        List<FareMatrixDto.FareSegment> segments = new ArrayList<>();

        for (int i = 0; i < orderedNames.size(); i++) {
            for (int j = i + 1; j < orderedNames.size(); j++) {
                String from = orderedNames.get(i);
                String to = orderedNames.get(j);
                double fare = ladder.get(to) - ladder.get(from);

                segments.add(FareMatrixDto.FareSegment.builder()
                        .from(from)
                        .to(to)
                        .fare(fare)
                        .build());
            }
        }

        return FareMatrixDto.builder()
                .stopNames(orderedNames)
                .segments(segments)
                .build();
    }
}
