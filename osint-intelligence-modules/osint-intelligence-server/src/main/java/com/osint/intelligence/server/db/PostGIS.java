package com.osint.intelligence.server.db;

import org.jooq.Condition;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKTWriter;

/**
 * Type-safe wrappers around the few PostGIS functions we use.
 *
 * <p>All inputs are bound via parameters; nothing is concatenated as raw SQL.</p>
 */
public final class PostGIS {

    public static final int SRID_4326 = 4326;

    private static final WKTWriter WKT = new WKTWriter();

    private PostGIS() {}

    private static String wkt(Geometry g) {
        return WKT.write(g);
    }

    /**
     * {@code ST_Contains(ST_GeomFromText(polygonWkt, 4326), geomColumn)}.
     */
    public static Condition stContains(Field<Geometry> geomColumn, Geometry polygon) {
        return DSL.condition(
                "ST_Contains(ST_GeomFromText({0}, {1}), {2})",
                DSL.val(wkt(polygon)),
                DSL.val(SRID_4326),
                geomColumn);
    }

    /**
     * {@code ST_DWithin(geom::geography, ST_MakePoint(lon, lat)::geography, meters)}.
     */
    public static Condition stDWithin(Field<Geometry> geomColumn, double lon, double lat, double meters) {
        return DSL.condition(
                "ST_DWithin({0}::geography, ST_MakePoint({1}, {2})::geography, {3})",
                geomColumn,
                DSL.val(lon),
                DSL.val(lat),
                DSL.val(meters));
    }

    /**
     * {@code ST_Intersects(ST_GeomFromText(wkt, 4326), geomColumn)}.
     */
    public static Condition stIntersects(Field<Geometry> geomColumn, Geometry geometry) {
        return DSL.condition(
                "ST_Intersects(ST_GeomFromText({0}, {1}), {2})",
                DSL.val(wkt(geometry)),
                DSL.val(SRID_4326),
                geomColumn);
    }
}
