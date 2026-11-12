package com.travelease.repository;

import com.travelease.entity.ContactInquiry;
import com.travelease.entity.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactInquiryRepository extends JpaRepository<ContactInquiry, Long> {
    List<ContactInquiry> findAllByOrderBySubmittedAtDesc();
    long countByStatus(InquiryStatus status);

    @Query("""
            SELECT c FROM ContactInquiry c
            WHERE (:status IS NULL OR c.status = :status)
              AND (:search IS NULL
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.message) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<ContactInquiry> findFilteredInquiries(
            @Param("status") InquiryStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
