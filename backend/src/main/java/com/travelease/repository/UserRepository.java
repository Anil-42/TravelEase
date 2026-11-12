package com.travelease.repository;

import com.travelease.dto.response.AdminCustomerResponse;
import com.travelease.entity.Role;
import com.travelease.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole(Role role);
    java.util.List<User> findByRole(Role role);

    long countByRole(Role role);
    long countByRoleAndActiveTrue(Role role);

    @Query("""
            SELECT new com.travelease.dto.response.AdminCustomerResponse(
                u.id, u.username, u.email, u.role, u.active, u.createdAt, COUNT(b.id)
            )
            FROM User u
            LEFT JOIN Booking b ON b.user = u
            WHERE u.role = com.travelease.entity.Role.ROLE_USER
              AND (:active IS NULL OR u.active = :active)
              AND (:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
            GROUP BY u.id, u.username, u.email, u.role, u.active, u.createdAt
            """)
    Page<AdminCustomerResponse> findCustomerSummaries(
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable
    );
}
