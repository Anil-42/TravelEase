package com.travelease.repository;

import com.travelease.entity.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PackageRepository extends JpaRepository<Package, Long> {
    List<Package> findByAvailableTrue();
    Optional<Package> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
