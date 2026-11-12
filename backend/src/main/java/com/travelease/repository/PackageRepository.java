package com.travelease.repository;

import com.travelease.entity.Package;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PackageRepository extends JpaRepository<Package, Long> {
    List<Package> findByAvailableTrue();
    Optional<Package> findBySlug(String slug);
    boolean existsBySlug(String slug);
    long countByAvailableTrue();

    @Query("""
            SELECT p FROM Package p
            WHERE p.available = true
              AND (:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(p.destination, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:destination IS NULL OR LOWER(COALESCE(p.destination, '')) LIKE LOWER(CONCAT('%', :destination, '%')))
              AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
            """)
    Page<Package> searchAvailablePackages(
            @Param("search") String search,
            @Param("destination") String destination,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );
}
