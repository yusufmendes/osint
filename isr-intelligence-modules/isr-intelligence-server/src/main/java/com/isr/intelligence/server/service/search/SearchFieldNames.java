package com.isr.intelligence.server.service.search;

import com.isr.intelligence.model.AttributeType;

import java.nio.charset.StandardCharsets;

public final class SearchFieldNames {

    private SearchFieldNames() {}

    public static String attributeSolrField(String attributeId, AttributeType type) {
        return "attr_" + hex(attributeId) + suffixFor(type);
    }

    public static String suffixFor(AttributeType type) {
        return switch (type) {
            case STRING -> "_txt";
            case ENUM -> "_enum";
            case ENUM_LIST -> "_enums";
            case NUMBER -> "_l";
            case BOOLEAN -> "_b";
            case DATE -> "_dt";
            case DATE_LIST -> "_dts";
            case GEOMETRY, GEOMETRY_LIST -> "_srpt";
        };
    }

    public static String hex(String value) {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
