package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FareMatrixDto {
    /** Ordered stop names: [origin, stop1, stop2, ..., destination] */
    private List<String> stopNames;
    /** All valid from→to pairs with computed fares */
    private List<FareSegment> segments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FareSegment {
        private String from;
        private String to;
        private Double fare;
    }
}
