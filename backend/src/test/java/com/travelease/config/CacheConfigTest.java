package com.travelease.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.dto.response.AdminStatsResponse;
import com.travelease.dto.response.PackageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CacheConfigTest {

    private final CacheConfig cacheConfig = new CacheConfig();
    private final ObjectMapper jsonHelper = new ObjectMapper();

    @Test
    void redisSerializer_RoundTripsPackageResponseWithLocalDateTimeAndJsonNode() throws Exception {
        GenericJackson2JsonRedisSerializer serializer = cacheConfig.buildRedisValueSerializer();

        PackageResponse original = samplePackageResponse(1L, "goa-beach-escape");
        byte[] serialized = serializer.serialize(original);
        assertNotNull(serialized);

        Object deserializedObj = serializer.deserialize(serialized);
        assertInstanceOf(PackageResponse.class, deserializedObj);

        PackageResponse restored = (PackageResponse) deserializedObj;
        assertEquals(1L, restored.getId());
        assertEquals("goa-beach-escape", restored.getSlug());
        assertEquals(new BigDecimal("9999.00"), restored.getBasePrice());
        assertEquals(original.getCreatedAt(), restored.getCreatedAt());
        assertEquals(original.getUpdatedAt(), restored.getUpdatedAt());
        assertNotNull(restored.getItinerary());
        assertTrue(restored.getItinerary().isArray());
        assertEquals("Arrival in Goa", restored.getItinerary().get(0).get("title").asText());
        assertNotNull(restored.getInclusions());
        assertEquals("Daily breakfast", restored.getInclusions().get(0).asText());
    }

    @Test
    void redisSerializer_RoundTripsListOfPackageResponsesSafely() throws Exception {
        GenericJackson2JsonRedisSerializer serializer = cacheConfig.buildRedisValueSerializer();

        List<PackageResponse> packages = new ArrayList<>();
        packages.add(samplePackageResponse(1L, "goa-beach-escape"));
        packages.add(samplePackageResponse(2L, "manali-mountain-getaway"));

        byte[] serialized = serializer.serialize(packages);
        assertNotNull(serialized);

        Object deserializedObj = serializer.deserialize(serialized);
        assertInstanceOf(List.class, deserializedObj);

        @SuppressWarnings("unchecked")
        List<Object> restoredList = (List<Object>) deserializedObj;
        assertEquals(2, restoredList.size());
        assertInstanceOf(PackageResponse.class, restoredList.get(0));
        assertInstanceOf(PackageResponse.class, restoredList.get(1));

        PackageResponse second = (PackageResponse) restoredList.get(1);
        assertEquals("manali-mountain-getaway", second.getSlug());
        assertNotNull(second.getCreatedAt());
        assertEquals(2, second.getInclusions().size());
    }

    @Test
    void redisSerializer_RoundTripsAdminStatsResponse() {
        GenericJackson2JsonRedisSerializer serializer = cacheConfig.buildRedisValueSerializer();

        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalCustomers(15L);
        stats.setActiveCustomers(14L);
        stats.setTotalBookings(8L);
        stats.setConfirmedRevenue(new BigDecimal("49995.00"));

        byte[] serialized = serializer.serialize(stats);
        Object restoredObj = serializer.deserialize(serialized);
        assertInstanceOf(AdminStatsResponse.class, restoredObj);

        AdminStatsResponse restored = (AdminStatsResponse) restoredObj;
        assertEquals(15L, restored.getTotalCustomers());
        assertEquals(14L, restored.getActiveCustomers());
        assertEquals(new BigDecimal("49995.00"), restored.getConfirmedRevenue());
    }

    @Test
    void redisSerializer_RejectsUntrustedPolymorphicGadgetTypes() {
        GenericJackson2JsonRedisSerializer serializer = cacheConfig.buildRedisValueSerializer();
        byte[] maliciousPayload = "{\"@class\":\"javax.naming.InitialContext\"}".getBytes(StandardCharsets.UTF_8);

        assertThrows(SerializationException.class, () -> serializer.deserialize(maliciousPayload));
    }

    private PackageResponse samplePackageResponse(Long id, String slug) throws Exception {
        PackageResponse pkg = new PackageResponse();
        pkg.setId(id);
        pkg.setSlug(slug);
        pkg.setTitle("Test Tour " + id);
        pkg.setDestination("India");
        pkg.setDescription("Curated test package");
        pkg.setBasePrice(new BigDecimal("9999.00"));
        pkg.setDuration("4 Days / 3 Nights");
        pkg.setCoverImage("tour1.jpg");
        pkg.setDetailImage("goa.jpg");
        pkg.setAvailable(true);
        pkg.setCreatedAt(LocalDateTime.of(2026, 11, 12, 10, 30, 15));
        pkg.setUpdatedAt(LocalDateTime.of(2026, 11, 12, 12, 45, 0));

        JsonNode itinerary = jsonHelper.readTree("[{\"day\":1,\"title\":\"Arrival in Goa\",\"details\":\"Check-in\"}]");
        JsonNode inclusions = jsonHelper.readTree("[\"Daily breakfast\",\"Airport transfers\"]");
        pkg.setItinerary(itinerary);
        pkg.setInclusions(inclusions);
        return pkg;
    }
}
