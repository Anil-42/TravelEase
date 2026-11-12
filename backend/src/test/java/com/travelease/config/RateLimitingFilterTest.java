package com.travelease.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RateLimitingFilterTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @SuppressWarnings("unchecked")
    private ObjectProvider<StringRedisTemplate> providerReturning(StringRedisTemplate template) {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(template);
        return provider;
    }

    @Test
    void directRequests_CannotBypassRateLimitViaXForwardedForSpoofing() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(providerReturning(null), objectMapper);
        filter.setEnabled(true);
        filter.setStoreType("caffeine");
        filter.setLoginPerMinute(2);
        filter.setTrustedProxiesConfig("");

        FilterChain chain = mock(FilterChain.class);

        // Two requests with different forged X-Forwarded-For headers from same direct socket IP
        for (int i = 1; i <= 2; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr("198.51.100.25");
            req.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse res = new MockHttpServletResponse();

            filter.doFilterInternal(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        // Third request with another spoofed X-Forwarded-For must be rate-limited
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr("198.51.100.25");
        blockedReq.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        filter.doFilterInternal(blockedReq, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
        assertEquals("60", blockedRes.getHeader("Retry-After"));
        verify(chain, times(2)).doFilter(any(), any());
    }

    @Test
    void trustedProxy_ExtractsRightmostNonTrustedClientIp() {
        RateLimitingFilter filter = new RateLimitingFilter(providerReturning(null), objectMapper);
        filter.setTrustedProxiesConfig("10.0.0.0/8, 127.0.0.1");

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setRemoteAddr("10.0.0.4");
        req.addHeader("X-Forwarded-For", "192.0.2.50, 203.0.113.77, 10.0.0.9");

        assertEquals("203.0.113.77", filter.extractClientIp(req));
    }

    @Test
    void trustedProxy_InvalidForwardedHeaderFallsBackToRemoteAddr() {
        RateLimitingFilter filter = new RateLimitingFilter(providerReturning(null), objectMapper);
        filter.setTrustedProxiesConfig("127.0.0.1");

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setRemoteAddr("127.0.0.1");
        req.addHeader("X-Forwarded-For", "not-an-ip-header");

        assertEquals("127.0.0.1", filter.extractClientIp(req));
    }

    @Test
    @SuppressWarnings("unchecked")
    void redisStore_UsesAtomicLuaScriptWithExpirationAndEnforces429() throws Exception {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        AtomicInteger calls = new AtomicInteger(0);
        when(redisTemplate.execute(any(RedisScript.class), eq(Collections.singletonList("rl:login:203.0.113.10")), eq("60")))
                .thenAnswer(inv -> (long) calls.incrementAndGet());

        RateLimitingFilter filter = new RateLimitingFilter(providerReturning(redisTemplate), objectMapper);
        filter.setEnabled(true);
        filter.setStoreType("redis");
        filter.setLoginPerMinute(1);
        filter.setTrustedProxiesConfig("");

        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest req1 = new MockHttpServletRequest("POST", "/api/auth/login");
        req1.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse res1 = new MockHttpServletResponse();
        filter.doFilterInternal(req1, res1, chain);
        assertEquals(200, res1.getStatus());

        MockHttpServletRequest req2 = new MockHttpServletRequest("POST", "/api/auth/login");
        req2.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse res2 = new MockHttpServletResponse();
        filter.doFilterInternal(req2, res2, chain);
        assertEquals(429, res2.getStatus());

        verify(redisTemplate, times(2)).execute(
                any(RedisScript.class),
                eq(List.of("rl:login:203.0.113.10")),
                eq("60")
        );

        String scriptText = RateLimitingFilter.getRateLimitLuaScriptText();
        assertTrue(scriptText.contains("INCR"));
        assertTrue(scriptText.contains("EXPIRE"));
        assertTrue(scriptText.contains("TTL"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void redisStore_FailureFallsBackSafelyToLocalCaffeineLimiter() throws Exception {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any()))
                .thenThrow(new RuntimeException("Redis connection refused"));

        RateLimitingFilter filter = new RateLimitingFilter(providerReturning(redisTemplate), objectMapper);
        filter.setEnabled(true);
        filter.setStoreType("redis");
        filter.setLoginPerMinute(1);

        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest req1 = new MockHttpServletRequest("POST", "/api/auth/login");
        req1.setRemoteAddr("198.51.100.88");
        MockHttpServletResponse res1 = new MockHttpServletResponse();
        filter.doFilterInternal(req1, res1, chain);
        assertEquals(200, res1.getStatus());

        MockHttpServletRequest req2 = new MockHttpServletRequest("POST", "/api/auth/login");
        req2.setRemoteAddr("198.51.100.88");
        MockHttpServletResponse res2 = new MockHttpServletResponse();
        filter.doFilterInternal(req2, res2, chain);
        assertEquals(429, res2.getStatus());
    }
}
