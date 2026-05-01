package com.osint.intelligence.model;

/**
 * Declared type of an {@link Attribute}. List variants represent multi-valued storage; multi-select
 * enumeration uses {@link #ENUM_LIST}.
 */
public enum AttributeType {
    STRING,
    NUMBER,
    BOOLEAN,
    DATE,
    ENUM,
    GEOMETRY,
    ENUM_LIST,
    DATE_LIST,
    GEOMETRY_LIST
}
