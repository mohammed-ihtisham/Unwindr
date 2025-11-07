# Final Design Document: Unwindr

## Overview

This document summarizes how the final design of Unwindr evolved from the initial concept design (Assignment 2) and visual design (Assignment 4b). The design shifted from a nationwide platform supporting exploration and user contributions to a focused, local discovery app prioritizing exploration over creation.

## Initial Concept (Assignment 2)

The initial design envisioned:
- **Geographic scope**: Entire United States
- **Core concepts**: UserAuth, PlaceCatalog, MediaGallery, InterestFilter, QualityRanking
- **Data sources**: Google Maps API, user-contributed places and media
- **Focus**: Exploration + contribution, community-driven content
- **Features**: User ratings, quality rankings, media analytics, moderation system

## Final Design

The final MVP design:
- **Geographic scope**: Cambridge, MA and Boston, MA
- **Core concepts**: UserAuth, PlaceCatalog, MediaLibrary, InterestFilter, Bookmark
- **Data sources**: OpenStreetMap (via Overpass API), provider-sourced media
- **Focus**: Exploration only, curated provider data
- **Removed**: QualityRanking, MediaAnalytics, user contribution features, moderation features

## Key Design Changes

### Geographic and Data Source Changes

**From**: Nationwide coverage using Google Maps API  
**To**: Cambridge/Boston area using OpenStreetMap data

- Switched from Google Maps API (cost-prohibitive at hundreds of dollars/month) to OpenStreetMap's Overpass API (free, open-source)
- Reduced scope to Cambridge and Boston for manageable data volume (thousands vs millions of places)
- Implemented bulk import via GeoJSON files instead of individual API calls
- Created deployment scripts for one-time data seeding outside the concept layer

### Concept Architecture Changes

**MediaGallery → MediaLibrary**
- Split original MediaGallery into two concepts: MediaLibrary (media data) and MediaAnalytics (engagement metrics)
- MediaLibrary now focuses solely on storing media metadata (URLs, sources, place associations)
- Removed user contribution methods (`addMedia()`, `deleteMedia()`) in favor of provider-sourced media
- MediaAnalytics concept removed entirely (see below)

**Removed Concepts**
- **QualityRanking**: Removed because it required either expensive external APIs (Google Places ratings) or user engagement data that doesn't exist in early-stage MVP
- **MediaAnalytics**: Removed because tracking engagement metrics doesn't provide value without sufficient user traffic; adds operational complexity without meaningful insights

**Added Concepts**
- **Bookmark**: New concept added to support exploration workflow, allowing users to save places they discover
  - Simple, modular design with user-isolated bookmarks
  - Depends only on User and Place concepts
  - Ordered by creation time (newest first)

### Feature Scope Changes

**From Contribution to Exploration**
- **PlaceCatalog**: Removed `addPlace()` and `updatePlace()` for end users (kept internal-only for testing/seeding)
- **MediaLibrary**: Removed `addMedia()` and `deleteMedia()`
- **Rationale**: User-generated content requires moderation/verification infrastructure that doesn't exist without an initial user base

**Simplified Authentication**
- **UserAuth**: Removed moderation functionality (`grantModerator`, `revokeModerator`, `changePassword`)
- Focused on core features: registration, login, session management, authentication verification
- Rationale: Moderation features unnecessary without users to moderate

### Technical Implementation Changes

**PlaceCatalog Refinements**
- Added `_id` field for MongoDB integration
- Switched from lat/lng to MongoDB GeoJSON format with `Location` objects for geospatial indexing
- Changed from full `User`/`Place` objects to `userId`/`placeId` (type `Id`) for optimized queries
- Split query methods: `getPlacesInViewport()` (IDs + essentials) vs `_getPlaceDetails()` (full data)
- Moved initialization methods (`bulkImportOSMPlaces()`, `seedPlaces()`, `checkAreaCoverage()`) to deployment scripts
- Added duplicate checking for data integrity

**InterestFilter Refinements**
- Reduced minimum tag requirement to three tags (from higher threshold)
- Added confidence validator (threshold < 0.65 triggers confirmation flag)
- Replaced `User` types with `Id` types for MongoDB compatibility
- Enhanced validators (whitelist, tag count, contradiction, confidence) to work cohesively

**Data Model Consistency**
- Standardized on `Id` types instead of full object types across all concepts
- Optimized for MongoDB's document structure throughout
- Improved parameter naming for clarity and consistency

## Summary

The final design represents a significant scope reduction and focus shift from the initial concept:
- **Geographic scope**: Nationwide → Local (Cambridge/Boston)
- **Data model**: User-contributed → Provider-curated
- **Feature set**: 5 concepts with contribution features → 5 concepts focused on discovery
- **Technical approach**: Premium APIs → Open-source alternatives, optimized for MongoDB

The MVP is now a focused platform for discovering places in Cambridge and Boston, with user authentication, bookmarking, interest-based filtering, and curated media—prioritizing feasibility and maintainability over ambitious feature scope.

