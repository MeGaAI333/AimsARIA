# Google Maps Integration Guide

This document outlines how to add Google Maps API integration to the Fence & Gate Estimator app for location-based features.

## Overview

Google Maps integration will enable:
- Address validation and autocomplete
- Visual project location display on map
- Calculate travel time between jobs
- Estimate distance for material transport costs
- Customer location context in quotes
- Job route optimization

## Implementation Steps

### 1. Google Maps API Setup

#### Step 1.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Fence Estimator"
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API

#### Step 1.2: Create API Keys
1. Go to Credentials
2. Create API key for Web Applications
3. Restrict to:
   - HTTP referrers (your domain)
   - Enabled APIs: Maps JS, Places, Geocoding
4. Create another API key for Backend (Server-side)
   - Restrict to your server IP

#### Step 1.3: Add to Environment
```
# backend/.env
GOOGLE_MAPS_API_KEY_SERVER=your_server_api_key
GOOGLE_MAPS_API_KEY_WEB=your_web_api_key
```

### 2. Backend Implementation

#### Step 2.1: Install Google Maps Package
```bash
npm install @googlemaps/js-client-library
```

#### Step 2.2: Create Location Service
Create `backend/src/services/LocationService.ts`:

```typescript
import { Client } from "@googlemaps/js-client-library";

export class LocationService {
  private client: Client;

  constructor() {
    this.client = new Client({
      key: process.env.GOOGLE_MAPS_API_KEY_SERVER!,
    });
  }

  async validateAddress(address: string): Promise<{ 
    lat: number; 
    lng: number; 
    formatted: string;
  } | null> {
    try {
      const response = await this.client.geocode({
        address: address,
      });

      if (response.results.length === 0) return null;

      const result = response.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      };
    } catch (error) {
      console.error("Geocoding failed:", error);
      return null;
    }
  }

  async getDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: string; duration: string } | null> {
    try {
      const response = await this.client.distancematrix({
        origins: [`${origin.lat},${origin.lng}`],
        destinations: [`${destination.lat},${destination.lng}`],
        mode: "driving",
      });

      if (response.rows.length === 0) return null;

      const element = response.rows[0].elements[0];
      if (element.status !== "OK") return null;

      return {
        distance: element.distance.text,
        duration: element.duration.text,
      };
    } catch (error) {
      console.error("Distance matrix failed:", error);
      return null;
    }
  }
}
```

#### Step 2.3: Create Location Routes
Create `backend/src/routes/locations.ts`:

```typescript
import { Router } from "express";
import { LocationService } from "../services/LocationService";

export function createLocationRoutes() {
  const router = Router();
  const locationService = new LocationService();

  router.post("/validate", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: "Address required" });
      }

      const result = await locationService.validateAddress(address);
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Validation failed" });
    }
  });

  router.post("/distance", async (req, res) => {
    try {
      const { origin, destination } = req.body;
      const result = await locationService.getDistance(origin, destination);

      if (!result) {
        return res.status(404).json({ error: "Distance calculation failed" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Distance calculation failed" });
    }
  });

  return router;
}
```

#### Step 2.4: Update Project Entity
Add location fields to `backend/src/entities/Project.ts`:

```typescript
@Column("decimal", { precision: 10, scale: 8, nullable: true })
latitude: number;

@Column("decimal", { precision: 10, scale: 8, nullable: true })
longitude: number;

@Column({ nullable: true })
validatedAddress: string;

@Column({ nullable: true })
distanceFromOffice: string; // e.g., "5.2 miles"
```

### 3. Frontend Implementation

#### Step 3.1: Install Maps Package
```bash
npm install @react-google-maps/api
```

#### Step 3.2: Create Location Input Component
Create `frontend/src/components/LocationInput.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { Loader } from '@react-google-maps/api';

interface LocationInputProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  apiKey: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  apiKey,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handlePlaceSelect = async (place: any) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    onChange(place.formatted_address, lat, lng);
  };

  if (!isLoaded) {
    return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <Loader apiKey={apiKey} libraries={['places']}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter project address"
      />
    </Loader>
  );
};
```

#### Step 3.3: Create Map Component
Create `frontend/src/components/ProjectMap.tsx`:

```typescript
import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface ProjectMapProps {
  lat: number;
  lng: number;
  apiKey: string;
}

export const ProjectMap: React.FC<ProjectMapProps> = ({ lat, lng, apiKey }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const center = { lat, lng };

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={15}>
      <Marker position={center} />
    </GoogleMap>
  );
};
```

#### Step 3.4: Update Admin Dashboard
Add location validation to project form:

```typescript
const handleAddressChange = async (address: string) => {
  setFormData({ ...formData, address });

  // Validate address
  try {
    const response = await fetch('/api/locations/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    const data = await response.json();
    // Store lat/lng in project
  } catch (error) {
    console.error('Address validation failed');
  }
};
```

### 4. Database Updates

#### Step 4.1: Create Migration
```bash
npm run typeorm migration:create src/migrations/AddLocationToProject
```

```typescript
// migration file
async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.addColumn(
    'projects',
    new TableColumn({
      name: 'latitude',
      type: 'decimal',
      precision: 10,
      scale: 8,
      isNullable: true,
    })
  );
  
  await queryRunner.addColumn(
    'projects',
    new TableColumn({
      name: 'longitude',
      type: 'decimal',
      precision: 10,
      scale: 8,
      isNullable: true,
    })
  );
  
  await queryRunner.addColumn(
    'projects',
    new TableColumn({
      name: 'validatedAddress',
      type: 'varchar',
      isNullable: true,
    })
  );
}
```

### 5. Environment Setup

Update `.env.example`:
```
# Google Maps
GOOGLE_MAPS_API_KEY_SERVER=your_server_key
GOOGLE_MAPS_API_KEY_WEB=your_web_key
GOOGLE_MAPS_ENABLED=true
```

## Advanced Features (Future)

### Distance-Based Pricing
```typescript
// Add to PricingService
async calculateWithDistance(
  specification: FenceSpecification,
  projectLocation: { lat: number; lng: number },
  companyLocation: { lat: number; lng: number }
): Promise<PricingBreakdown> {
  const distance = await locationService.getDistance(
    companyLocation,
    projectLocation
  );
  
  // Add travel/fuel cost based on distance
  // e.g., $0.50 per mile
  const travelCost = extractMiles(distance.distance) * 0.5;
  
  return {
    ...basePricing,
    travelCost,
  };
}
```

### Job Route Optimization
```typescript
// Use Google Maps Directions API to plan daily routes
async optimizeRoutes(projects: Project[]): Promise<Route[]> {
  // Calculate most efficient route between all projects
  // Show on map with turn-by-turn directions
}
```

### Service Area Mapping
```typescript
// Visualize service area and highlight out-of-area projects
async checkServiceArea(location: { lat: number; lng: number }): Promise<boolean> {
  const distance = await getDistance(companyHQ, location);
  return distance.miles <= SERVICE_RADIUS;
}
```

## Security Considerations

1. **API Key Restrictions**
   - Use separate keys for frontend and backend
   - Restrict frontend key to specific domains
   - Restrict backend key to server IP

2. **Rate Limiting**
   - Implement rate limiting for location requests
   - Cache geocoding results
   - Batch distance matrix requests

3. **Data Privacy**
   - Don't store full address in logs
   - Encrypt lat/lng in database if needed
   - GDPR compliance for customer locations

## Testing

```typescript
// Test location validation
it('should validate address correctly', async () => {
  const result = await locationService.validateAddress(
    '123 Main St, New York, NY 10001'
  );
  
  expect(result).toBeDefined();
  expect(result?.lat).toBeCloseTo(40.7128, 2);
  expect(result?.lng).toBeCloseTo(-74.0060, 2);
});
```

## Deployment Notes

- Store API keys in environment variables
- Use Cloud IAM roles to restrict key usage
- Monitor API usage in Google Cloud Console
- Set up billing alerts

## Estimated Implementation Time

- Backend integration: 4-6 hours
- Frontend integration: 3-4 hours
- Testing & debugging: 2-3 hours
- **Total: 9-13 hours**

## References

- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [React Google Maps Documentation](https://react-google-maps-api-docs.netlify.app/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
