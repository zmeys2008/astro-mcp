#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// @ts-ignore - no types available for this library
import horoscopeLib from "circular-natal-horoscope-js";
const { Origin, Horoscope } = horoscopeLib;
// Create server instance
const server = new McpServer({
    name: "astrology",
    version: "1.0.0",
});
// Zodiac sign information
const ZODIAC_INFO = {
    aries: { element: "Fire", modality: "Cardinal", ruler: "Mars" },
    taurus: { element: "Earth", modality: "Fixed", ruler: "Venus" },
    gemini: { element: "Air", modality: "Mutable", ruler: "Mercury" },
    cancer: { element: "Water", modality: "Cardinal", ruler: "Moon" },
    leo: { element: "Fire", modality: "Fixed", ruler: "Sun" },
    virgo: { element: "Earth", modality: "Mutable", ruler: "Mercury" },
    libra: { element: "Air", modality: "Cardinal", ruler: "Venus" },
    scorpio: { element: "Water", modality: "Fixed", ruler: "Pluto" },
    sagittarius: { element: "Fire", modality: "Mutable", ruler: "Jupiter" },
    capricorn: { element: "Earth", modality: "Cardinal", ruler: "Saturn" },
    aquarius: { element: "Air", modality: "Fixed", ruler: "Uranus" },
    pisces: { element: "Water", modality: "Mutable", ruler: "Neptune" },
};
// House meanings
const HOUSE_MEANINGS = {
    1: "Personality, appearance, first impressions (Ascendant/Rising)",
    2: "Finances, self-esteem, possessions",
    3: "Communication, siblings, local travel",
    4: "Home, family, roots",
    5: "Creativity, romance, children",
    6: "Health, daily habits, work",
    7: "Partnerships, marriage",
    8: "Transformation, shared resources, intimacy",
    9: "Higher education, travel, philosophy",
    10: "Career, reputation, public standing (Midheaven)",
    11: "Friendships, hopes, community",
    12: "Subconscious, secrets, spirituality",
};
// Planet meanings
const PLANET_MEANINGS = {
    sun: "Ego, purpose, core identity",
    moon: "Emotions, nurturing, inner world",
    mercury: "Communication, thought processes",
    venus: "Love, relationships, values",
    mars: "Action, energy, drive",
    jupiter: "Growth, luck, expansion",
    saturn: "Discipline, challenges, structure",
    uranus: "Innovation, rebellion, sudden change",
    neptune: "Dreams, intuition, spirituality",
    pluto: "Transformation, power, rebirth",
    chiron: "Healing, wounds, wisdom",
    sirius: "Ambition, fame, high position",
    northnode: "Life purpose, destiny, spiritual growth direction",
    southnode: "Past life karma, innate talents, comfort zone",
    lilith: "Shadow self, repressed desires, raw feminine energy",
};
// Aspect meanings
const ASPECT_MEANINGS = {
    conjunction: "Fusion of energies, intensity (0°)",
    opposition: "Tension, awareness, balance needed (180°)",
    trine: "Harmony, flow, natural talent (120°)",
    square: "Challenge, friction, growth through conflict (90°)",
    sextile: "Opportunity, cooperation (60°)",
    quincunx: "Adjustment needed, awkward energy (150°)",
    quintile: "Creative talent, special ability (72°)",
    semisextile: "Subtle connection, minor growth (30°)",
    semisquare: "Minor friction, irritation (45°)",
    sesquiquadrate: "Agitation, minor challenge (135°)",
};
function formatCelestialBody(body) {
    const signKey = body.Sign?.key?.toLowerCase() || "unknown";
    const signInfo = ZODIAC_INFO[signKey] || { element: "Unknown", modality: "Unknown", ruler: "Unknown" };
    // Handle special key names (e.g., "north node" -> "northnode")
    const keyNormalized = body.key.toLowerCase().replace(/\s+/g, "");
    const meaning = PLANET_MEANINGS[keyNormalized] || "Celestial influence";
    const retrograde = body.isRetrograde ? " (Retrograde)" : "";
    const houseNum = body.House?.id;
    const houseMeaning = houseNum ? HOUSE_MEANINGS[houseNum] : "";
    // Use the 30-degree format for a more readable position within the sign
    const position = body.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || body.ChartPosition?.Ecliptic?.ArcDegreesFormatted || "Unknown";
    return `${body.label}${retrograde}:
  Sign: ${body.Sign?.label || "Unknown"} (${signInfo.element}, ${signInfo.modality})
  House: ${houseNum || "Unknown"}${houseMeaning ? ` - ${houseMeaning}` : ""}
  Position: ${position} ${body.Sign?.label || ""}
  Meaning: ${meaning}`;
}
function formatAspect(aspect) {
    const aspectKey = aspect.aspectKey?.toLowerCase() || "unknown";
    const meaning = ASPECT_MEANINGS[aspectKey] || "";
    return `${aspect.point1Label || "Unknown"} ${aspect.label || "Unknown"} ${aspect.point2Label || "Unknown"} (orb: ${aspect.orb?.toFixed(2) || "?"}°)
  Meaning: ${meaning}`;
}
function formatHouse(house) {
    const meaning = HOUSE_MEANINGS[house.id] || "";
    const cusp = house.ChartPosition?.StartPosition?.Ecliptic?.ArcDegreesFormatted30 || "";
    return `House ${house.id} (${house.Sign?.label || "Unknown"} ${cusp}): ${meaning}`;
}
function getChartRuler(ascendantSign) {
    const signKey = ascendantSign.toLowerCase();
    const signInfo = ZODIAC_INFO[signKey];
    return signInfo?.ruler || "Unknown";
}
// Register the birth chart tool
server.tool("get_birth_chart", "Calculate a complete natal/birth chart for a person based on their birth date, time, and location. Returns planetary positions, house placements, aspects, and key points like Ascendant and Midheaven.", {
    year: z.number().int().min(1900).max(2100).describe("Birth year (e.g., 1990)"),
    month: z.number().int().min(1).max(12).describe("Birth month (1-12, where 1 is January)"),
    day: z.number().int().min(1).max(31).describe("Birth day of month (1-31)"),
    hour: z.number().int().min(0).max(23).describe("Birth hour in 24-hour format (0-23)"),
    minute: z.number().int().min(0).max(59).describe("Birth minute (0-59)"),
    latitude: z.number().min(-90).max(90).describe("Birth location latitude (-90 to 90)"),
    longitude: z.number().min(-180).max(180).describe("Birth location longitude (-180 to 180)"),
    houseSystem: z
        .enum(["placidus", "koch", "whole-sign", "equal", "campanus", "regiomontanus", "topocentric"])
        .default("placidus")
        .describe("House system to use (default: placidus)"),
    zodiac: z.enum(["tropical", "sidereal"]).default("tropical").describe("Zodiac system to use (default: tropical)"),
}, async ({ year, month, day, hour, minute, latitude, longitude, houseSystem, zodiac }) => {
    try {
        // Create origin (birth data)
        // Note: month is 0-indexed in the library (0 = January)
        const origin = new Origin({
            year,
            month: month - 1,
            date: day,
            hour,
            minute,
            latitude,
            longitude,
        });
        // Calculate horoscope
        const horoscope = new Horoscope({
            origin,
            houseSystem,
            zodiac,
            aspectPoints: ["bodies", "points", "angles"],
            aspectWithPoints: ["bodies", "points", "angles"],
            aspectTypes: ["major", "minor"],
            language: "en",
        });
        // Format planetary positions
        const celestialBodies = horoscope.CelestialBodies?.all || [];
        const celestialPoints = horoscope.CelestialPoints?.all || [];
        const allBodies = [...celestialBodies, ...celestialPoints];
        const planetaryPositions = allBodies.map(formatCelestialBody).join("\n\n");
        // Format aspects
        const aspects = horoscope.Aspects?.all || [];
        const majorAspects = aspects
            .filter((a) => ["conjunction", "opposition", "trine", "square", "sextile"].includes(a.aspectKey?.toLowerCase() || ""))
            .slice(0, 20); // Limit to first 20 major aspects
        const aspectsText = majorAspects.length > 0
            ? majorAspects.map(formatAspect).join("\n\n")
            : "No major aspects found.";
        // Format houses
        const houses = horoscope.Houses || [];
        const housesText = houses.map(formatHouse).join("\n");
        // Get key angles
        const ascendant = horoscope.Angles?.ascendant || horoscope.Angles?.all?.find((a) => a.key === "ascendant");
        const midheaven = horoscope.Angles?.midheaven || horoscope.Angles?.all?.find((a) => a.key === "midheaven");
        // Determine chart ruler
        const ascendantSign = ascendant?.Sign?.label || "Unknown";
        const chartRuler = getChartRuler(ascendantSign);
        // Find Sun and Moon for the Big Three
        const sun = celestialBodies.find((b) => b.key === "sun");
        const moon = celestialBodies.find((b) => b.key === "moon");
        // Build the complete chart report
        const chartReport = `
# Natal Birth Chart

## Birth Data
- Date: ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}
- Time: ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}
- Location: ${latitude}°, ${longitude}°
- House System: ${houseSystem}
- Zodiac: ${zodiac}

## The Big Three
- **Sun Sign**: ${sun?.Sign?.label || "Unknown"} - Core identity and ego
- **Moon Sign**: ${moon?.Sign?.label || "Unknown"} - Emotions and inner world
- **Rising Sign (Ascendant)**: ${ascendantSign} - Outer persona and first impressions

## Critical Points
- **Ascendant (ASC)**: ${ascendant?.Sign?.label || "Unknown"} at ${ascendant?.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || "Unknown"}
  The sign rising on the Eastern horizon at birth, determining personality and appearance.

- **Midheaven (MC)**: ${midheaven?.Sign?.label || "Unknown"} at ${midheaven?.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || "Unknown"}
  The highest point in the chart, representing career and public reputation.

- **Chart Ruler**: ${chartRuler}
  The planet that rules the Ascendant sign, having special significance in the chart.

## Planetary Positions (The Actors)
${planetaryPositions}

## Houses (Life Areas)
${housesText}

## Major Aspects (Planetary Relationships)
${aspectsText}

---
Note: This chart uses the ${zodiac} zodiac and ${houseSystem} house system.
`;
        return {
            content: [
                {
                    type: "text",
                    text: chartReport.trim(),
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            content: [
                {
                    type: "text",
                    text: `Error calculating birth chart: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
// Register a tool to get information about zodiac signs
server.tool("get_zodiac_info", "Get detailed information about a specific zodiac sign including its element, modality, ruling planet, and characteristics.", {
    sign: z
        .enum([
        "aries",
        "taurus",
        "gemini",
        "cancer",
        "leo",
        "virgo",
        "libra",
        "scorpio",
        "sagittarius",
        "capricorn",
        "aquarius",
        "pisces",
    ])
        .describe("The zodiac sign to get information about"),
}, async ({ sign }) => {
    const signInfo = ZODIAC_INFO[sign];
    const signLabel = sign.charAt(0).toUpperCase() + sign.slice(1);
    const info = `
# ${signLabel}

## Basic Information
- **Element**: ${signInfo.element}
- **Modality**: ${signInfo.modality}
- **Ruling Planet**: ${signInfo.ruler}

## Element Meaning (${signInfo.element})
${signInfo.element === "Fire"
        ? "Fire signs are passionate, dynamic, and temperamental. They get angry quickly, but they also forgive easily. They are adventurers with immense energy."
        : signInfo.element === "Earth"
            ? "Earth signs are grounded, practical, and reliable. They are conservative and realistic, but can also be very emotional. They are connected to the material world."
            : signInfo.element === "Air"
                ? "Air signs are rational, social, and love communication and relationships. They are thinkers, friendly, intellectual, and analytical."
                : "Water signs are exceptionally emotional and ultra-sensitive. They are highly intuitive and can be as mysterious as the ocean itself."}

## Modality Meaning (${signInfo.modality})
${signInfo.modality === "Cardinal"
        ? "Cardinal signs are initiators. They lead and take action, starting new projects and pioneering change."
        : signInfo.modality === "Fixed"
            ? "Fixed signs are stabilizers. They are determined, persistent, and resistant to change. They see things through to completion."
            : "Mutable signs are adaptable and flexible. They are comfortable with change and help transitions between seasons."}
`;
    return {
        content: [
            {
                type: "text",
                text: info.trim(),
            },
        ],
    };
});
// Register a tool to explain aspects
server.tool("get_aspect_info", "Get detailed information about astrological aspects (angular relationships between planets).", {
    aspect: z
        .enum(["conjunction", "opposition", "trine", "square", "sextile", "quincunx", "quintile", "semisextile", "semisquare", "sesquiquadrate"])
        .describe("The aspect type to get information about"),
}, async ({ aspect }) => {
    const aspectLabel = aspect.charAt(0).toUpperCase() + aspect.slice(1);
    const meaning = ASPECT_MEANINGS[aspect];
    const aspectDetails = {
        conjunction: {
            angle: 0,
            type: "Major",
            description: "A conjunction occurs when two planets are at the same degree. This is the most powerful aspect, representing a fusion of energies. The planets involved blend their influences, which can be harmonious or challenging depending on the planets involved.",
        },
        opposition: {
            angle: 180,
            type: "Major",
            description: "An opposition occurs when planets are directly across from each other. This aspect represents awareness through contrast, creating tension that can lead to greater understanding. It often manifests as external challenges or relationship dynamics.",
        },
        trine: {
            angle: 120,
            type: "Major",
            description: "A trine is considered the most harmonious aspect. Planets in trine support each other naturally, creating flow and ease. This aspect indicates natural talents and areas where things come easily, though it can sometimes lead to complacency.",
        },
        square: {
            angle: 90,
            type: "Major",
            description: "A square creates dynamic tension between planets. This challenging aspect represents obstacles and friction that ultimately promote growth. Squares are catalysts for action and change, pushing us to overcome limitations.",
        },
        sextile: {
            angle: 60,
            type: "Major",
            description: "A sextile represents opportunity and cooperation between planets. Unlike the trine, which comes naturally, sextiles require some effort to activate. They indicate areas where we can develop talents through conscious effort.",
        },
        quincunx: {
            angle: 150,
            type: "Minor",
            description: "Also called an inconjunct, this aspect creates an awkward energy between planets that don't naturally understand each other. It requires continuous adjustment and can indicate areas of life that need ongoing attention and adaptation.",
        },
        quintile: {
            angle: 72,
            type: "Minor",
            description: "A quintile indicates creative or spiritual gifts. This aspect is associated with special talents, artistic abilities, and the capacity to create something unique. It represents potential for mastery in specific areas.",
        },
        semisextile: {
            angle: 30,
            type: "Minor",
            description: "A semisextile connects adjacent signs, creating a subtle but persistent connection. This aspect indicates areas of minor growth and development, often working in the background of consciousness.",
        },
        semisquare: {
            angle: 45,
            type: "Minor",
            description: "A semisquare creates minor friction and irritation. It represents small challenges and adjustments needed, often manifesting as internal restlessness or minor external obstacles that require attention.",
        },
        sesquiquadrate: {
            angle: 135,
            type: "Minor",
            description: "Also called a sesquisquare, this aspect creates agitation and the need for adjustment. It's similar to a square but less intense, representing ongoing minor tensions that push for resolution.",
        },
    };
    const details = aspectDetails[aspect];
    const info = `
# ${aspectLabel}

## Overview
${meaning}

## Details
- **Angle**: ${details.angle}°
- **Type**: ${details.type} Aspect

## Description
${details.description}
`;
    return {
        content: [
            {
                type: "text",
                text: info.trim(),
            },
        ],
    };
});
// Main function to run the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Astrology MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
