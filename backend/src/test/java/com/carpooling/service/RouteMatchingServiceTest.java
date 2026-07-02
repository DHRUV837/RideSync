package com.carpooling.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteMatchingServiceTest {

    private final RouteMatchingService routeMatchingService = new RouteMatchingService();

    @Test
    void shouldMatchPickupNearRouteGeometry() {
        String routeGeometry = "[[72.57,23.02],[72.60,23.05],[72.63,23.08]]";

        assertTrue(routeMatchingService.isPickupNearRoute(23.03, 72.58, routeGeometry, 5.0));
    }

    @Test
    void shouldRejectPickupFarFromRouteGeometry() {
        String routeGeometry = "[[72.57,23.02],[72.60,23.05],[72.63,23.08]]";

        assertFalse(routeMatchingService.isPickupNearRoute(23.50, 72.90, routeGeometry, 5.0));
    }

    @Test
    void shouldMatchDestinationNearRouteGeometry() {
        String routeGeometry = "[[72.57,23.02],[72.60,23.05],[72.63,23.08]]";

        assertTrue(routeMatchingService.isPickupNearRoute(23.08, 72.63, routeGeometry, 2.0));
    }
}
