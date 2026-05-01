package com.osint.intelligence.server.repository;

import com.osint.intelligence.server.db.PostGIS;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static com.osint.intelligence.server.db.Tables.*;

@Repository
public class GeoQueryRepository {

    @SuppressWarnings("unchecked")
    private static final Field<Geometry> LOCATION_GEOM =
            (Field<Geometry>) (Field<?>) DSL.field(DSL.name("intelligence", "location"));

    private final DSLContext dsl;

    public GeoQueryRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Returns ids of active intelligence rows whose primary location lies inside {@code polygon}.
     * If {@code templateId} is non-null, the filter is template-scoped.
     */
    @Transactional(readOnly = true)
    public List<String> withinPolygon(String templateId, Geometry polygon) {
        var step = dsl.select(INTELLIGENCE_ID)
                .from(INTELLIGENCE)
                .where(INTELLIGENCE_DELETED.eq(false))
                .and(PostGIS.stContains(LOCATION_GEOM, polygon));
        if (templateId != null) {
            step = step.and(INTELLIGENCE_TEMPLATE_ID.eq(templateId));
        }
        return step.fetch(INTELLIGENCE_ID);
    }

    /**
     * Returns ids of active intelligence rows within {@code km} kilometres of {@code (lat, lon)}.
     */
    @Transactional(readOnly = true)
    public List<String> nearby(String templateId, double lat, double lon, double km) {
        double meters = km * 1000.0;
        var step = dsl.select(INTELLIGENCE_ID)
                .from(INTELLIGENCE)
                .where(INTELLIGENCE_DELETED.eq(false))
                .and(PostGIS.stDWithin(LOCATION_GEOM, lon, lat, meters));
        if (templateId != null) {
            step = step.and(INTELLIGENCE_TEMPLATE_ID.eq(templateId));
        }
        return step.fetch(INTELLIGENCE_ID);
    }

    /**
     * Returns ids of active intelligence rows whose primary location lies inside {@code polygon}, but as a
     * {@link Set} for fast intersection in combined-search.
     */
    @Transactional(readOnly = true)
    public Set<String> withinPolygonSet(String templateId, Geometry polygon) {
        return Set.copyOf(withinPolygon(templateId, polygon));
    }
}
