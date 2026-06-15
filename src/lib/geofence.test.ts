import { describe, it, expect } from 'vitest';
import { haversineDistance, VENUE_LAT, VENUE_LNG } from './geofence';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(VENUE_LAT, VENUE_LNG, VENUE_LAT, VENUE_LNG)).toBeCloseTo(0, 1);
  });

  it('returns ~111km for 1 degree of latitude', () => {
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('is symmetric', () => {
    const a = haversineDistance(41.1, 20.0, 41.2, 20.1);
    const b = haversineDistance(41.2, 20.1, 41.1, 20.0);
    expect(a).toBeCloseTo(b, 5);
  });

  it('detects ~50m offset correctly', () => {
    // ~50m north of venue: 50 / 111320 deg latitude
    const offset = 50 / 111320;
    const d = haversineDistance(VENUE_LAT, VENUE_LNG, VENUE_LAT + offset, VENUE_LNG);
    expect(d).toBeGreaterThan(45);
    expect(d).toBeLessThan(55);
  });
});
