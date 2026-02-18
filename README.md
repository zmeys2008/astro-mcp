# Astrology MCP Server

An MCP (Model Context Protocol) server that provides astrological birth chart calculations. Given a birth date, time, and location, it calculates planetary positions, house placements, aspects, and key chart points.

## Features

- **Complete Birth Chart Calculation**: Calculates positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, and Lunar Nodes
- **House System Support**: Placidus, Koch, Whole Sign, Equal, Campanus, Regiomontanus, and Topocentric house systems
- **Zodiac Systems**: Both Tropical and Sidereal zodiac support
- **Aspect Calculation**: Major aspects (conjunction, opposition, trine, square, sextile) and minor aspects
- **Key Chart Points**: Ascendant (Rising Sign), Midheaven (MC), and Chart Ruler identification
- **The Big Three**: Highlights Sun Sign, Moon Sign, and Rising Sign

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "astrology": {
      "command": "node",
      "args": ["/path/to/astro-mcp/build/index.js"]
    }
  }
}
```

### Tools Available

#### `get_birth_chart`

Calculate a complete natal birth chart.

**Parameters:**
- `year` (number): Birth year (1900-2100)
- `month` (number): Birth month (1-12)
- `day` (number): Birth day (1-31)
- `hour` (number): Birth hour in 24-hour format (0-23)
- `minute` (number): Birth minute (0-59)
- `latitude` (number): Birth location latitude (-90 to 90)
- `longitude` (number): Birth location longitude (-180 to 180)
- `houseSystem` (string, optional): House system to use (default: "placidus")
- `zodiac` (string, optional): Zodiac system (default: "tropical")

**Example:**
```json
{
  "year": 1990,
  "month": 6,
  "day": 15,
  "hour": 14,
  "minute": 30,
  "latitude": 40.7128,
  "longitude": -74.006
}
```

#### `get_zodiac_info`

Get detailed information about a zodiac sign.

**Parameters:**
- `sign` (string): One of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces

#### `get_aspect_info`

Get detailed information about astrological aspects.

**Parameters:**
- `aspect` (string): One of: conjunction, opposition, trine, square, sextile, quincunx, quintile, semisextile, semisquare, sesquiquadrate

## Chart Components

### Planets/Points (The Actors)
- **Sun**: Core identity, ego, purpose
- **Moon**: Emotions, nurturing, inner world
- **Mercury**: Communication, thought processes
- **Venus**: Love, relationships, values
- **Mars**: Action, energy, drive
- **Jupiter**: Growth, luck, expansion
- **Saturn**: Discipline, challenges, structure
- **Uranus**: Innovation, rebellion, sudden change
- **Neptune**: Dreams, intuition, spirituality
- **Pluto**: Transformation, power, rebirth
- **North Node**: Life purpose, destiny
- **South Node**: Past karma, innate talents
- **Chiron**: Healing, wounds, wisdom

### Houses (Life Areas)
1. Personality, appearance (Ascendant)
2. Finances, self-esteem
3. Communication, siblings
4. Home, family
5. Creativity, romance
6. Health, daily work
7. Partnerships, marriage
8. Transformation, shared resources
9. Higher education, philosophy
10. Career, reputation (Midheaven)
11. Friendships, community
12. Subconscious, spirituality

### Aspects (Planetary Relationships)
- **Conjunction (0°)**: Fusion of energies
- **Opposition (180°)**: Tension, balance needed
- **Trine (120°)**: Harmony, flow
- **Square (90°)**: Challenge, growth through friction
- **Sextile (60°)**: Opportunity, cooperation

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `circular-natal-horoscope-js`: Astrological calculations library
- `zod`: Schema validation

## License

ISC
