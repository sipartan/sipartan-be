/**
       * Calculate area using PostGIS
       * ST_Area returns area in square meters, divide by 10000 to get hectares
       * ST_GeomFromGeoJSON converts GeoJSON to PostGIS geometry
       * ::geography casts the geometry to geography for accurate area calculation
       * :geoJson (Placeholder for GeoJSON Input)
       * ::geography (Casting Geometry to Geography) -> Converts it into a geographic format (instead of planar geometry)
       * PostGIS has two types:
       * Geometry: Uses a Cartesian coordinate system (flat-plane calculations).
       * Geography: Uses a spherical coordinate system (accounts for Earth's curvature).
       * ::geography converts the geometry into a geography, ensuring that area calculations are accurate for large-scale regions.
       */
const areaQuery = `SELECT ST_Area(ST_GeomFromGeoJSON(:geoJson)::geography) / 10000 AS area_in_hectares`;

module.exports = { areaQuery };