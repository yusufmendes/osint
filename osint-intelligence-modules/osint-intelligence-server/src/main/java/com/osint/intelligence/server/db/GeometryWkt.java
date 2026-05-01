package com.osint.intelligence.server.db;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;

/**
 * WKT (Well-Known Text) round-trip helpers for JTS {@link Geometry}.
 */
public final class GeometryWkt {

    private GeometryWkt() {}

    public static String toWkt(Geometry geometry) {
        if (geometry == null) {
            return null;
        }
        return new WKTWriter().write(geometry);
    }

    public static Geometry fromWkt(String wkt) {
        if (wkt == null || wkt.isBlank()) {
            return null;
        }
        try {
            return new WKTReader().read(wkt);
        } catch (ParseException e) {
            throw new IllegalStateException("Cannot parse WKT geometry: " + wkt, e);
        }
    }
}
