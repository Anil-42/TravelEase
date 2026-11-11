package com.travelease.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class PackageCreateRequest {

    @NotBlank(message = "Slug is required")
    @Size(max = 100)
    private String slug;

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    private String description;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Base price cannot be negative")
    private BigDecimal basePrice;

    @NotBlank(message = "Duration is required")
    @Size(max = 50)
    private String duration;

    private String coverImage;
    private String detailImage;

    private JsonNode itinerary;
    private JsonNode inclusions;

    private boolean available = true;

    public PackageCreateRequest() {
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public String getDetailImage() {
        return detailImage;
    }

    public void setDetailImage(String detailImage) {
        this.detailImage = detailImage;
    }

    public JsonNode getItinerary() {
        return itinerary;
    }

    public void setItinerary(JsonNode itinerary) {
        this.itinerary = itinerary;
    }

    public JsonNode getInclusions() {
        return inclusions;
    }

    public void setInclusions(JsonNode inclusions) {
        this.inclusions = inclusions;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
