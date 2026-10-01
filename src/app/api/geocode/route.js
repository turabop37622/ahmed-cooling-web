import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatNominatim(data, lang) {
  if (!data) return null;
  const a = data.address || {};
  const isAr = lang === 'ar';
  const sep = isAr ? '، ' : ', ';

  const house = a.house_number || a.building || '';
  const road = a.road || a.pedestrian || a.street || a.residential || '';
  const block = a.block || a.subdistrict || '';
  const district = a.neighbourhood || a.suburb || a.quarter || a.city_district || '';
  const city = a.city || a.town || a.municipality || a.county || '';
  const state = a.state || a.province || '';
  const country = a.country || '';

  const parts = [];
  if (house) parts.push(house);
  if (road) parts.push(road);
  if (block && block !== district) parts.push(block);
  if (district) parts.push(district);
  if (city && city !== district) parts.push(city);
  if (state && state !== city && state !== district) parts.push(state);
  if (country) parts.push(country);

  if (parts.length >= 2) {
    return parts.join(sep);
  }

  if (data.display_name) {
    return data.display_name
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !/^\d{4,6}$/.test(s))
      .slice(0, 5)
      .join(sep);
  }
  return null;
}

// Public proxy to third-party geocoders: keep it from being used as a free bulk lookup service.
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map(); // ip -> { count, resetAt }
const cache = new Map(); // "lat,lng,lang" (rounded) -> { body, expires }
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

function isRateLimited(ip) {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [key, v] of hits) if (v.resetAt < now) hits.delete(key);
  }
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function GET(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again in a minute' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const q = new URL(request.url).searchParams;
  const keyLat = Number.parseFloat(q.get('lat'));
  const keyLng = Number.parseFloat(q.get('lng'));
  const keyLang = q.get('lang') === 'ar' ? 'ar' : 'en';
  const cacheKey = Number.isFinite(keyLat) && Number.isFinite(keyLng) ? `${keyLat.toFixed(3)},${keyLng.toFixed(3)},${keyLang}` : null;

  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) {
      return NextResponse.json({ ...hit.body, coordinates: { latitude: keyLat, longitude: keyLng }, cached: true });
    }
  }

  const response = await lookup(request);
  if (cacheKey && response.status === 200) {
    try {
      const body = await response.clone().json();
      if (body?.success && body.provider !== 'fallback') {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { body, expires: Date.now() + CACHE_TTL_MS });
      }
    } catch {
      // not cacheable
    }
  }
  return response;
}

async function lookup(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const lang = searchParams.get('lang') || 'en';

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, message: 'lat and lng parameters are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json(
        { success: false, message: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    // 1. Primary Source: OpenStreetMap Nominatim with custom User-Agent
    try {
      const osmLang = lang === 'ar' ? 'ar' : 'en';
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${osmLang}`,
        {
          headers: {
            'User-Agent': 'AhmedCoolingWorkshop/2.0 (ahmedcoolingworkshop@gmail.com)',
          },
          signal: AbortSignal.timeout(4500),
        }
      );

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const formatted = formatNominatim(osmData, lang);
        if (formatted) {
          return NextResponse.json({
            success: true,
            address: formatted,
            coordinates: { latitude: lat, longitude: lng },
            provider: 'nominatim',
          });
        }
      }
    } catch (osmErr) {
      console.warn('Nominatim reverse geocoding failed:', osmErr?.message);
    }

    // 2. Secondary Source: BigDataCloud Reverse Geocoding
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${lang === 'ar' ? 'ar' : 'en'}`,
        { signal: AbortSignal.timeout(4500) }
      );

      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const sep = lang === 'ar' ? '، ' : ', ';
        const parts = [
          bdcData.locality,
          bdcData.city !== bdcData.locality ? bdcData.city : null,
          bdcData.principalSubdivision,
          bdcData.countryName,
        ].filter(Boolean);

        if (parts.length > 0) {
          return NextResponse.json({
            success: true,
            address: parts.join(sep),
            coordinates: { latitude: lat, longitude: lng },
            provider: 'bigdatacloud',
          });
        }
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud reverse geocoding failed:', bdcErr?.message);
    }

    // 3. Tertiary Source: Photon by Komoot
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
        { signal: AbortSignal.timeout(4500) }
      );
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        const feat = photonData.features?.[0]?.properties;
        if (feat) {
          const sep = lang === 'ar' ? '، ' : ', ';
          const parts = [
            feat.name,
            feat.street,
            feat.district,
            feat.city,
            feat.country,
          ].filter(Boolean);
          if (parts.length > 0) {
            return NextResponse.json({
              success: true,
              address: parts.join(sep),
              coordinates: { latitude: lat, longitude: lng },
              provider: 'photon',
            });
          }
        }
      }
    } catch (photonErr) {
      console.warn('Photon reverse geocoding failed:', photonErr?.message);
    }

    // 4. Clean GPS Fallback without hardcoding any city
    return NextResponse.json({
      success: true,
      address:
        lang === 'ar'
          ? `موقع GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          : `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      coordinates: { latitude: lat, longitude: lng },
      provider: 'fallback',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || 'Geocoding failed' },
      { status: 500 }
    );
  }
}
