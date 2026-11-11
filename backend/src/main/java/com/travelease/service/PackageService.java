package com.travelease.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.dto.request.PackageCreateRequest;
import com.travelease.dto.request.PackageUpdateRequest;
import com.travelease.dto.response.PackageResponse;
import com.travelease.entity.Package;
import com.travelease.exception.BadRequestException;
import com.travelease.exception.ResourceNotFoundException;
import com.travelease.repository.BookingRepository;
import com.travelease.repository.PackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PackageService {

    private final PackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;

    public PackageService(PackageRepository packageRepository, BookingRepository bookingRepository, ObjectMapper objectMapper) {
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getAllAvailablePackages() {
        return packageRepository.findByAvailableTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackagesForAdmin() {
        return packageRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PackageResponse getPackageById(Long id) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));
        return mapToResponse(pkg);
    }

    @Transactional(readOnly = true)
    public Package findEntityById(Long id) {
        return packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));
    }

    @Transactional
    public PackageResponse createPackage(PackageCreateRequest request) {
        String slug = request.getSlug().trim().toLowerCase();
        if (packageRepository.existsBySlug(slug)) {
            throw new BadRequestException("A package with slug '" + slug + "' already exists.");
        }

        String itineraryJson = serializeJsonNode(request.getItinerary(), "[]");
        String inclusionsJson = serializeJsonNode(request.getInclusions(), "[]");

        Package pkg = new Package(
                slug,
                request.getTitle().trim(),
                request.getDescription(),
                request.getBasePrice(),
                request.getDuration().trim(),
                request.getCoverImage(),
                request.getDetailImage(),
                itineraryJson,
                inclusionsJson,
                request.isAvailable()
        );

        Package saved = packageRepository.save(pkg);
        return mapToResponse(saved);
    }

    @Transactional
    public PackageResponse updatePackage(Long id, PackageUpdateRequest request) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            pkg.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            pkg.setDescription(request.getDescription());
        }
        if (request.getBasePrice() != null) {
            pkg.setBasePrice(request.getBasePrice());
        }
        if (request.getDuration() != null && !request.getDuration().isBlank()) {
            pkg.setDuration(request.getDuration().trim());
        }
        if (request.getCoverImage() != null) {
            pkg.setCoverImage(request.getCoverImage());
        }
        if (request.getDetailImage() != null) {
            pkg.setDetailImage(request.getDetailImage());
        }
        if (request.getItinerary() != null) {
            pkg.setItineraryJson(serializeJsonNode(request.getItinerary(), pkg.getItineraryJson()));
        }
        if (request.getInclusions() != null) {
            pkg.setInclusionsJson(serializeJsonNode(request.getInclusions(), pkg.getInclusionsJson()));
        }
        if (request.getAvailable() != null) {
            pkg.setAvailable(request.getAvailable());
        }

        Package updated = packageRepository.save(pkg);
        return mapToResponse(updated);
    }

    @Transactional
    public void deletePackage(Long id) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));

        // Preserve integrity if bookings exist
        if (bookingRepository.existsByTourPackageId(id)) {
            throw new BadRequestException("Cannot delete package '" + pkg.getTitle() + "' because existing customer bookings depend on it. Please mark it as unavailable instead.");
        }

        packageRepository.delete(pkg);
    }

    @Transactional
    public PackageResponse setAvailability(Long id, boolean available) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));
        pkg.setAvailable(available);
        return mapToResponse(packageRepository.save(pkg));
    }

    public PackageResponse mapToResponse(Package pkg) {
        PackageResponse response = new PackageResponse();
        response.setId(pkg.getId());
        response.setSlug(pkg.getSlug());
        response.setTitle(pkg.getTitle());
        response.setDescription(pkg.getDescription());
        response.setBasePrice(pkg.getBasePrice());
        response.setDuration(pkg.getDuration());
        response.setCoverImage(pkg.getCoverImage());
        response.setDetailImage(pkg.getDetailImage());
        response.setAvailable(pkg.isAvailable());
        response.setCreatedAt(pkg.getCreatedAt());
        response.setUpdatedAt(pkg.getUpdatedAt());

        try {
            response.setItinerary(objectMapper.readTree(pkg.getItineraryJson()));
        } catch (Exception e) {
            response.setItinerary(objectMapper.createArrayNode());
        }

        try {
            response.setInclusions(objectMapper.readTree(pkg.getInclusionsJson()));
        } catch (Exception e) {
            response.setInclusions(objectMapper.createArrayNode());
        }

        return response;
    }

    private String serializeJsonNode(JsonNode node, String fallback) {
        if (node == null || node.isNull()) {
            return fallback;
        }
        return node.toString();
    }
}
