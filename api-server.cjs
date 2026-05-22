#!/usr/bin/env node
/**
 * Astro-MCP HTTP API Server
 * Обёртка вокруг circular-natal-horoscope-js для Python-бота
 * Порт 8111, эндпоинт GET /birth-chart
 */

const http = require('http');
const horoscopeLib = require('circular-natal-horoscope-js');
const { Origin, Horoscope } = horoscopeLib;

const PORT = 8111;

const ZODIAC_INFO = {
  aries: { element: 'Fire', modality: 'Cardinal', ruler: 'Mars', name_ru: 'Овен' },
  taurus: { element: 'Earth', modality: 'Fixed', ruler: 'Venus', name_ru: 'Телец' },
  gemini: { element: 'Air', modality: 'Mutable', ruler: 'Mercury', name_ru: 'Близнецы' },
  cancer: { element: 'Water', modality: 'Cardinal', ruler: 'Moon', name_ru: 'Рак' },
  leo: { element: 'Fire', modality: 'Fixed', ruler: 'Sun', name_ru: 'Лев' },
  virgo: { element: 'Earth', modality: 'Mutable', ruler: 'Mercury', name_ru: 'Дева' },
  libra: { element: 'Air', modality: 'Cardinal', ruler: 'Venus', name_ru: 'Весы' },
  scorpio: { element: 'Water', modality: 'Fixed', ruler: 'Pluto', name_ru: 'Скорпион' },
  sagittarius: { element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', name_ru: 'Стрелец' },
  capricorn: { element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', name_ru: 'Козерог' },
  aquarius: { element: 'Air', modality: 'Fixed', ruler: 'Uranus', name_ru: 'Водолей' },
  pisces: { element: 'Water', modality: 'Mutable', ruler: 'Neptune', name_ru: 'Рыбы' },
};

const PLANET_NAMES_RU = {
  sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера',
  mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран',
  neptune: 'Нептун', pluto: 'Плутон', chiron: 'Хирон',
  northnode: 'Северный узел', southnode: 'Южный узел', lilith: 'Лилит',
  sirius: 'Сириус',
};

const ASPECT_NAMES_RU = {
  conjunction: 'Соединение', opposition: 'Оппозиция', trine: 'Трин',
  square: 'Квадратура', sextile: 'Секстиль', quincunx: 'Квинкункс',
  quintile: 'Квинтиль', semisextile: 'Полусекстиль',
  semisquare: 'Полуквадратура', sesquiquadrate: 'Сесквиквадратура',
};

const HOUSE_MEANINGS_RU = {
  1: 'Личность, внешность, первый впечатления',
  2: 'Финансы, самооценка, имущество',
  3: 'Общение, братья/сёстры, ближние поездки',
  4: 'Дом, семья, корни',
  5: 'Творчество, романтика, дети',
  6: 'Здоровье, повседневные дела, работа',
  7: 'Партнёрство, брак',
  8: 'Трансформация, совместные ресурсы',
  9: 'Высшее образование, путешествия, философия',
  10: 'Карьера, репутация (MC)',
  11: 'Дружба, надежды, сообщество',
  12: 'Подсознание, секреты, духовность',
};

const HOUSE_SYSTEMS = {
  placidus: 'Placidus',
  koch: 'Koch',
  wholeSign: 'Whole Sign',
  equal: 'Equal',
  campanus: 'Campanus',
  regiomontanus: 'Regiomontanus',
  topocentric: 'Topocentric',
};

function calculateBirthChart(params) {
  const { year, month, day, hour, minute, latitude, longitude, houseSystem = 'placidus', zodiac = 'tropical' } = params;

  const origin = new Origin({
    year, month, date: day, hour, minute, latitude, longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: houseSystem.charAt(0).toUpperCase() + houseSystem.slice(1),
    zodiac,
  });

  // Extract celestial bodies
  const planets = [];
  for (const body of horoscope.CelestialBodies.all) {
    const signKey = body.Sign?.key?.toLowerCase() || 'unknown';
    const signInfo = ZODIAC_INFO[signKey] || {};
    planets.push({
      name: body.key,
      name_ru: PLANET_NAMES_RU[body.key.toLowerCase().replace(/\s+/g, '')] || body.label,
      sign: signKey,
      sign_ru: signInfo.name_ru || signKey,
      sign_degree: body.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      sign_degree_formatted: body.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || '',
      house: body.House?.id || null,
      element: signInfo.element || '',
      modality: signInfo.modality || '',
      retrograde: body.isRetrograde || false,
    });
  }

  // Extract celestial points (North/South Node, Lilith, etc.)
  const points = [];
  for (const point of horoscope.CelestialPoints.all) {
    const signKey = point.Sign?.key?.toLowerCase() || 'unknown';
    const signInfo = ZODIAC_INFO[signKey] || {};
    points.push({
      name: point.key,
      name_ru: PLANET_NAMES_RU[point.key.toLowerCase().replace(/\s+/g, '')] || point.label,
      sign: signKey,
      sign_ru: signInfo.name_ru || signKey,
      sign_degree: point.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      house: point.House?.id || null,
    });
  }

  // Extract houses with cusps
  const houses = [];
  for (const house of horoscope.Houses) {
    const signKey = house.Sign?.key?.toLowerCase() || 'unknown';
    houses.push({
      id: house.id,
      sign: signKey,
      sign_ru: ZODIAC_INFO[signKey]?.name_ru || signKey,
      meaning_ru: HOUSE_MEANINGS_RU[house.id] || '',
      cusp_degree: house.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees || 0,
      cusp_formatted: house.ChartPosition?.StartPosition?.Ecliptic?.ArcDegreesFormatted30 || '',
    });
  }

  // Extract aspects
  const aspects = [];
  for (const aspect of horoscope.Aspects.all) {
    aspects.push({
      planet1: aspect.point1Key,
      planet1_ru: PLANET_NAMES_RU[aspect.point1Key?.toLowerCase()?.replace(/\s+/g, '')] || aspect.point1Label,
      planet2: aspect.point2Key,
      planet2_ru: PLANET_NAMES_RU[aspect.point2Key?.toLowerCase()?.replace(/\s+/g, '')] || aspect.point2Label,
      aspect: aspect.aspectKey,
      aspect_ru: ASPECT_NAMES_RU[aspect.aspectKey] || aspect.aspectKey,
      orb: aspect.orb,
      level: aspect.aspectLevel,
    });
  }

  // Extract angles (Ascendant, MC)
  const angles = {};
  if (horoscope.Angles?.ascendant) {
    const asc = horoscope.Angles.ascendant;
    const ascSign = asc.Sign?.key?.toLowerCase() || 'unknown';
    angles.ascendant = {
      sign: ascSign,
      sign_ru: ZODIAC_INFO[ascSign]?.name_ru || ascSign,
      degree: asc.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      degree_formatted: asc.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || '',
    };
  }
  if (horoscope.Angles?.midheaven) {
    const mc = horoscope.Angles.midheaven;
    const mcSign = mc.Sign?.key?.toLowerCase() || 'unknown';
    angles.midheaven = {
      sign: mcSign,
      sign_ru: ZODIAC_INFO[mcSign]?.name_ru || mcSign,
      degree: mc.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      degree_formatted: mc.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 || '',
    };
  }

  // Chart ruler (ruler of Ascendant sign)
  const ascSign = angles.ascendant?.sign || planets.find(p => p.name === 'Sun')?.sign || 'aries';
  const chartRuler = ZODIAC_INFO[ascSign]?.ruler || 'Sun';

  // The Big Three
  const sunPlanet = planets.find(p => p.name === 'Sun');
  const moonPlanet = planets.find(p => p.name === 'Moon');

  return {
    big_three: {
      sun_sign: sunPlanet?.sign || 'unknown',
      sun_sign_ru: sunPlanet?.sign_ru || '',
      moon_sign: moonPlanet?.sign || 'unknown',
      moon_sign_ru: moonPlanet?.sign_ru || '',
      rising_sign: angles.ascendant?.sign || 'unknown',
      rising_sign_ru: angles.ascendant?.sign_ru || '',
    },
    angles,
    chart_ruler: chartRuler,
    chart_ruler_ru: PLANET_NAMES_RU[chartRuler.toLowerCase()] || chartRuler,
    planets,
    points,
    houses,
    aspects,
  };
}

// HTTP server
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', service: 'astro-mcp-api', version: '1.0.0' }));
    return;
  }

  // Birth chart endpoint
  if (req.url?.startsWith('/birth-chart')) {
    try {
      const urlObj = new URL(req.url, `http://localhost:${PORT}`);
      // Note: circular-natal-horoscope-js uses 0-based month (Jan=0)
      const rawMonth = parseInt(urlObj.searchParams.get('month') || '1');
      const params = {
        year: parseInt(urlObj.searchParams.get('year') || '1990'),
        month: rawMonth - 1,  // 0-based: January = 0
        day: parseInt(urlObj.searchParams.get('day') || '1'),
        hour: parseInt(urlObj.searchParams.get('hour') || '12'),
        minute: parseInt(urlObj.searchParams.get('minute') || '0'),
        latitude: parseFloat(urlObj.searchParams.get('latitude') || '55.7558'),
        longitude: parseFloat(urlObj.searchParams.get('longitude') || '37.6173'),
        houseSystem: urlObj.searchParams.get('houseSystem') || 'placidus',
        zodiac: urlObj.searchParams.get('zodiac') || 'tropical',
      };

      const result = calculateBirthChart(params);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message, stack: err.stack }));
    }
    return;
  }

  // Zodiac info endpoint
  if (req.url?.startsWith('/zodiac-info')) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const sign = (urlObj.searchParams.get('sign') || 'aries').toLowerCase();
    const info = ZODIAC_INFO[sign];
    if (info) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ sign, ...info }, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Unknown sign: ${sign}` }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found. Use /birth-chart or /zodiac-info' }));
});

server.listen(PORT, () => {
  console.log(`🔮 Astro-MCP API server running on http://localhost:${PORT}`);
  console.log(`   GET /birth-chart?year=&month=&day=&hour=&minute=&latitude=&longitude=&houseSystem=&zodiac=`);
  console.log(`   GET /zodiac-info?sign=aries`);
  console.log(`   GET /health`);
});