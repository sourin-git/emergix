# Redis Key Patterns

## Driver Real-time Location
* **Pattern**: `driver:location:{driver_id}`
* **Type**: Hash (or JSON string)
* **TTL**: 30s
* **Payload**: 
  ```json
  {
    "lat": 12.9715987,
    "lng": 77.5945627,
    "speed": 45.2,
    "updated_at": "2026-04-18T12:00:00Z"
  }
  ```
* **Usage**: Extracted constantly by Node.js service via WebSocket tracking events.

## Incident ETA
* **Pattern**: `incident:eta:{incident_id}`
* **Type**: Hash (or JSON string)
* **TTL**: 60s
* **Payload**:
  ```json
  {
    "eta_minutes": 12,
    "updated_at": "2026-04-18T12:00:00Z"
  }
  ```
* **Usage**: Provides quick read-access for patients waiting to see when their assigned ambulance will arrive.

## Session Storage
* **Pattern**: `session:{user_id}`
* **Type**: String
* **TTL**: 24h
* **Payload**: `eyJhbG...` (JWT token)
* **Usage**: Used to quickly validate or invalidate logged-in sessions without performing a DB lookup on every request.
