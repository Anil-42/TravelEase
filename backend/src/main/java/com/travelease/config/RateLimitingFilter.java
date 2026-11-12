package com.travelease.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.travelease.dto.response.ErrorResponse;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

/**
 * Protects authentication, contact, and API endpoints against brute-force attacks and spam.
 * Uses an atomic Redis Lua script (INCR + conditional/self-healing EXPIRE) when RATE_LIMIT_STORE=redis
 * is configured for horizontal multi-node deployments, with a bounded Caffeine fallback for standalone nodes.
 * X-Forwarded-For is only consulted when the direct socket peer matches configured trusted proxies.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);
    private static final long WINDOW_SECONDS = 60L;

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$"
    );
    private static final Pattern IPV6_PATTERN = Pattern.compile("^[0-9a-fA-F:]{2,39}$");

    private static final DefaultRedisScript<Long> RATE_LIMIT_LUA_SCRIPT;

    static {
        RATE_LIMIT_LUA_SCRIPT = new DefaultRedisScript<>();
        RATE_LIMIT_LUA_SCRIPT.setResultType(Long.class);
        RATE_LIMIT_LUA_SCRIPT.setScriptText(
                "local current = redis.call('INCR', KEYS[1]) " +
                "if current == 1 then " +
                "  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) " +
                "else " +
                "  local ttl = redis.call('TTL', KEYS[1]) " +
                "  if ttl == -1 then " +
                "    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) " +
                "  end " +
                "end " +
                "return current"
        );
    }

    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;
    private final ObjectMapper objectMapper;

    @Value("${travelease.rate-limit.enabled:true}")
    private boolean enabled = true;

    @Value("${travelease.rate-limit.store:caffeine}")
    private String storeType = "caffeine";

    @Value("${travelease.rate-limit.login-per-minute:20}")
    private int loginPerMinute = 20;

    @Value("${travelease.rate-limit.register-per-minute:10}")
    private int registerPerMinute = 10;

    @Value("${travelease.rate-limit.password-reset-per-minute:10}")
    private int passwordResetPerMinute = 10;

    @Value("${travelease.rate-limit.contact-per-minute:10}")
    private int contactPerMinute = 10;

    @Value("${travelease.rate-limit.general-per-minute:600}")
    private int generalPerMinute = 600;

    @Value("${travelease.rate-limit.trusted-proxies:}")
    private String trustedProxiesConfig = "";

    private volatile List<IpAddressMatcher> trustedProxyMatchers = List.of();

    private final Cache<String, AtomicInteger> localCounters = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(1))
            .maximumSize(100_000)
            .build();

    public RateLimitingFilter(ObjectProvider<StringRedisTemplate> redisTemplateProvider, ObjectMapper objectMapper) {
        this.redisTemplateProvider = redisTemplateProvider;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void initTrustedProxies() {
        List<IpAddressMatcher> matchers = new ArrayList<>();
        if (trustedProxiesConfig != null && !trustedProxiesConfig.isBlank()) {
            for (String entry : trustedProxiesConfig.split(",")) {
                String trimmed = entry.trim();
                if (!trimmed.isEmpty()) {
                    try {
                        matchers.add(new IpAddressMatcher(trimmed));
                    } catch (IllegalArgumentException ex) {
                        log.warn("Ignoring invalid trusted proxy CIDR/IP '{}': {}", trimmed, ex.getMessage());
                    }
                }
            }
        }
        this.trustedProxyMatchers = List.copyOf(matchers);
    }

    void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    void setStoreType(String storeType) {
        this.storeType = storeType;
    }

    void setLoginPerMinute(int loginPerMinute) {
        this.loginPerMinute = loginPerMinute;
    }

    void setTrustedProxiesConfig(String trustedProxiesConfig) {
        this.trustedProxiesConfig = trustedProxiesConfig;
        initTrustedProxies();
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!enabled || HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        LimitRule rule = resolveRule(request.getMethod(), path);
        String bucketKey = "rl:" + rule.bucket() + ":" + clientIp;

        long count = incrementAndGet(bucketKey);
        if (count > rule.limit()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse err = new ErrorResponse(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Too Many Requests",
                    "Rate limit exceeded. Please wait a minute before retrying."
            );
            objectMapper.writeValue(response.getWriter(), err);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private long incrementAndGet(String key) {
        if ("redis".equalsIgnoreCase(storeType)) {
            StringRedisTemplate redis = redisTemplateProvider.getIfAvailable();
            if (redis != null) {
                try {
                    Long val = redis.execute(
                            RATE_LIMIT_LUA_SCRIPT,
                            Collections.singletonList(key),
                            String.valueOf(WINDOW_SECONDS)
                    );
                    if (val != null) {
                        return val;
                    }
                    log.warn("Redis rate-limiter Lua script returned null, falling back to local Caffeine window");
                } catch (Exception ex) {
                    log.warn("Redis rate-limiter unavailable, falling back to local Caffeine window: {}", ex.getMessage());
                }
            }
        }
        AtomicInteger counter = localCounters.get(key, k -> new AtomicInteger(0));
        return counter != null ? counter.incrementAndGet() : 1L;
    }

    private LimitRule resolveRule(String method, String path) {
        if (HttpMethod.POST.matches(method)) {
            if ("/api/auth/login".equals(path)) {
                return new LimitRule("login", loginPerMinute);
            }
            if ("/api/auth/register".equals(path)) {
                return new LimitRule("register", registerPerMinute);
            }
            if ("/api/auth/forgot-password".equals(path) || "/api/auth/reset-password".equals(path)) {
                return new LimitRule("pw_reset", passwordResetPerMinute);
            }
            if ("/api/contact".equals(path)) {
                return new LimitRule("contact", contactPerMinute);
            }
        }
        return new LimitRule("general", generalPerMinute);
    }

    String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || !isTrustedProxy(remoteAddr)) {
            return remoteAddr != null ? remoteAddr : "unknown";
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) {
            return remoteAddr;
        }

        // Walk right-to-left so client-injected leftmost entries cannot bypass rate limiting
        String[] hops = forwarded.split(",");
        for (int i = hops.length - 1; i >= 0; i--) {
            String candidate = hops[i].trim();
            if (!isValidIpLiteral(candidate)) {
                return remoteAddr;
            }
            if (!isTrustedProxy(candidate)) {
                return candidate;
            }
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String ipAddress) {
        if (!isValidIpLiteral(ipAddress) || trustedProxyMatchers.isEmpty()) {
            return false;
        }
        for (IpAddressMatcher matcher : trustedProxyMatchers) {
            try {
                if (matcher.matches(ipAddress)) {
                    return true;
                }
            } catch (IllegalArgumentException ignored) {
                // Skip incompatible IPv4/IPv6 family comparisons
            }
        }
        return false;
    }

    private boolean isValidIpLiteral(String candidate) {
        if (candidate == null || candidate.isEmpty() || candidate.length() > 45) {
            return false;
        }
        if (IPV4_PATTERN.matcher(candidate).matches()) {
            return true;
        }
        return candidate.contains(":") && IPV6_PATTERN.matcher(candidate).matches();
    }

    static String getRateLimitLuaScriptText() {
        return RATE_LIMIT_LUA_SCRIPT.getScriptAsString();
    }

    private record LimitRule(String bucket, int limit) {
    }
}
