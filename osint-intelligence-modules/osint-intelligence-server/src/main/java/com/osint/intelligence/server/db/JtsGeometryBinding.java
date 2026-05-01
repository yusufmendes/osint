package com.osint.intelligence.server.db;

import org.jooq.Binding;
import org.jooq.BindingGetResultSetContext;
import org.jooq.BindingGetSQLInputContext;
import org.jooq.BindingGetStatementContext;
import org.jooq.BindingRegisterContext;
import org.jooq.BindingSQLContext;
import org.jooq.BindingSetSQLOutputContext;
import org.jooq.BindingSetStatementContext;
import org.jooq.Converter;
import org.jooq.impl.DSL;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;

import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Types;
import java.util.Objects;

/**
 * jOOQ {@link Binding} that maps PostGIS {@code geometry} columns to {@link Geometry} (JTS) via WKT.
 *
 * <p>Reads use {@code ST_AsText(?)}, writes use {@code ST_GeomFromText(?, 4326)} so the SRID stays
 * consistent with the schema. The codegen profile points at this class via {@code <forcedType>}.</p>
 */
public class JtsGeometryBinding implements Binding<Object, Geometry> {

    private static final int SRID = 4326;
    private static final WKTReader READER = new WKTReader();

    @Override
    public Converter<Object, Geometry> converter() {
        return new Converter<>() {
            @Override
            public Geometry from(Object t) {
                if (t == null) {
                    return null;
                }
                try {
                    return READER.read(t.toString());
                } catch (ParseException e) {
                    throw new IllegalStateException("Cannot parse WKT geometry: " + t, e);
                }
            }

            @Override
            public Object to(Geometry u) {
                if (u == null) {
                    return null;
                }
                return new WKTWriter().write(u);
            }

            @Override
            public Class<Object> fromType() { return Object.class; }

            @Override
            public Class<Geometry> toType() { return Geometry.class; }
        };
    }

    @Override
    public void sql(BindingSQLContext<Geometry> ctx) {
        if (ctx.value() == null) {
            ctx.render().sql("NULL");
        } else {
            ctx.render()
                    .sql("ST_GeomFromText(")
                    .visit(DSL.val(converter().to(ctx.value())))
                    .sql(", ")
                    .sql(String.valueOf(SRID))
                    .sql(")");
        }
    }

    @Override
    public void register(BindingRegisterContext<Geometry> ctx) throws SQLException {
        ctx.statement().registerOutParameter(ctx.index(), Types.VARCHAR);
    }

    @Override
    public void set(BindingSetStatementContext<Geometry> ctx) throws SQLException {
        if (ctx.value() == null) {
            ctx.statement().setNull(ctx.index(), Types.VARCHAR);
        } else {
            ctx.statement().setString(ctx.index(), Objects.toString(converter().to(ctx.value())));
        }
    }

    @Override
    public void set(BindingSetSQLOutputContext<Geometry> ctx) throws SQLException {
        throw new SQLFeatureNotSupportedException("SQLData not supported for geometry");
    }

    @Override
    public void get(BindingGetResultSetContext<Geometry> ctx) throws SQLException {
        ctx.value(converter().from(ctx.resultSet().getString(ctx.index())));
    }

    @Override
    public void get(BindingGetStatementContext<Geometry> ctx) throws SQLException {
        ctx.value(converter().from(ctx.statement().getString(ctx.index())));
    }

    @Override
    public void get(BindingGetSQLInputContext<Geometry> ctx) throws SQLException {
        throw new SQLFeatureNotSupportedException("SQLData not supported for geometry");
    }
}
