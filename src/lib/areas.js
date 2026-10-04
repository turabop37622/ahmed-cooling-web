// Service areas: the cities and districts we serve, shared by the booking form (app/book/[id]) and the local
// landing pages (/areas, /areas/<city>, /areas/<city>/<district>). Keep the names here in sync with the booking form:
// the booking form stores the English district name, so renaming a district here changes what new bookings store.
// This file is plain data + pure helpers so client and server components can both import it.

export const LOCATION_DATA = {
  jeddah: {
    country: 'SA',
    en: 'Jeddah', ar: 'جدة',
    areas: [
      { en: 'Abhur', ar: 'أبحر' },
      { en: 'Al Ajwad', ar: 'الأجواد' },
      { en: 'Al Andalus', ar: 'الأندلس' },
      { en: 'Al Aziziyah', ar: 'العزيزية' },
      { en: 'Al Balad', ar: 'البلد' },
      { en: 'Al Basateen', ar: 'البساتين' },
      { en: 'Al Bawadi', ar: 'البوادي' },
      { en: 'Al Faisaliyyah', ar: 'الفيصلية' },
      { en: 'Al Hamra', ar: 'الحمراء' },
      { en: 'Al Hamdaniyah', ar: 'الحمدانية' },
      { en: 'Al Khalidiyyah', ar: 'الخالدية' },
      { en: 'Al Manar', ar: 'المنار' },
      { en: 'Al Marwah', ar: 'المروة' },
      { en: 'Al Muhammadiyah', ar: 'المحمدية' },
      { en: 'Al Nahdah', ar: 'النهضة' },
      { en: 'Al Naim', ar: 'النعيم' },
      { en: 'Al Naseem', ar: 'النسيم' },
      { en: 'Al Rabwah', ar: 'الربوة' },
      { en: 'Al Rawdah', ar: 'الروضة' },
      { en: 'Al Rehab', ar: 'الرحاب' },
      { en: 'Al Safa', ar: 'الصفا' },
      { en: 'Al Salamah', ar: 'السلامة' },
      { en: 'Al Samer', ar: 'السامر' },
      { en: 'Al Sharafiyah', ar: 'الشرفية' },
      { en: 'Al Shati', ar: 'الشاطئ' },
      { en: 'Al Thaghr', ar: 'الثغر' },
      { en: 'Al Wurud', ar: 'الورود' },
      { en: 'Al Zahra', ar: 'الزهراء' },
      { en: 'Bryman', ar: 'بريمان' },
    ],
  },
  makkah: {
    country: 'SA',
    en: 'Makkah', ar: 'مكة المكرمة',
    areas: [
      { en: 'Al Adl', ar: 'العدل' },
      { en: 'Al Awali', ar: 'العوالي' },
      { en: 'Al Aziziyah', ar: 'العزيزية' },
      { en: 'Al Buhayrat', ar: 'البحيرات' },
      { en: 'Al Hajlah', ar: 'الحجلة' },
      { en: 'Al Hindawiyyah', ar: 'الهنداوية' },
      { en: 'Al Jamiah', ar: 'الجامعة' },
      { en: 'Al Kakiyyah', ar: 'الكعكية' },
      { en: 'Al Khalidiyyah', ar: 'الخالدية' },
      { en: 'Al Maabdah', ar: 'المعابدة' },
      { en: 'Al Misfalah', ar: 'المسفلة' },
      { en: 'Al Naseem', ar: 'النسيم' },
      { en: 'Al Nuzha', ar: 'النزهة' },
      { en: 'Al Rusayfah', ar: 'الرصيفة' },
      { en: 'Al Shisha', ar: 'الشيشة' },
      { en: 'Al Shoqiyah', ar: 'الشوقية' },
      { en: 'Al Taneem', ar: 'التنعيم' },
      { en: 'Al Utaibiyyah', ar: 'العتيبية' },
      { en: 'Al Zaidi', ar: 'الزايدي' },
      { en: 'Jarwal', ar: 'جرول' },
      { en: 'Kudai', ar: 'كدي' },
    ],
  },
};

// Districts grouped by the part of the city they are in, each group ordered so that districts next to each other in
// the list are close on the map. Used only to pick the "nearby districts" mentioned on a district page.
const DISTRICT_GROUPS = {
  jeddah: [
    ['Abhur', 'Al Basateen', 'Al Muhammadiyah', 'Al Shati', 'Al Zahra', 'Al Naim', 'Al Nahdah', 'Al Khalidiyyah', 'Al Rawdah', 'Al Salamah', 'Al Bawadi'],
    ['Al Hamdaniyah', 'Al Ajwad', 'Al Samer', 'Bryman', 'Al Manar', 'Al Marwah', 'Al Safa', 'Al Rabwah', 'Al Naseem', 'Al Rehab'],
    ['Al Hamra', 'Al Andalus', 'Al Faisaliyyah', 'Al Wurud', 'Al Aziziyah', 'Al Sharafiyah', 'Al Balad', 'Al Thaghr'],
  ],
  makkah: [
    ['Jarwal', 'Al Utaibiyyah', 'Al Misfalah', 'Al Hajlah', 'Al Hindawiyyah', 'Kudai'],
    ['Al Taneem', 'Al Zaidi', 'Al Rusayfah', 'Al Khalidiyyah', 'Al Shoqiyah', 'Al Buhayrat', 'Al Kakiyyah'],
    ['Al Maabdah', 'Al Shisha', 'Al Jamiah', 'Al Aziziyah', 'Al Adl', 'Al Naseem', 'Al Nuzha', 'Al Awali'],
  ],
};

// City info for the landing pages. arShort is the short Arabic name used in headings ("صيانة مكيفات حي العوالي مكة").
const CITY_INFO = {
  jeddah: { arShort: 'جدة', arIn: 'في جدة', enRegion: 'Makkah Province' },
  makkah: { arShort: 'مكة', arIn: 'في مكة المكرمة', enRegion: 'Makkah Province' },
};

export const CITY_SLUGS = Object.keys(LOCATION_DATA);

// "Al Faisaliyyah" -> "al-faisaliyyah"
export const areaSlug = (name) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function getCity(citySlug) {
  const c = LOCATION_DATA[citySlug];
  if (!c) return null;
  return {
    slug: citySlug,
    en: c.en,
    ar: c.ar,
    ...CITY_INFO[citySlug],
    districts: c.areas.map((a, index) => ({ ...a, slug: areaSlug(a.en), index })),
  };
}

export function getDistrict(citySlug, districtSlug) {
  const city = getCity(citySlug);
  if (!city) return null;
  const district = city.districts.find((d) => d.slug === districtSlug);
  return district ? { city, district } : null;
}

// Up to `count` districts close to this one (same part of the city, nearest in the group order first).
export function nearbyDistricts(city, district, count = 3) {
  const group = (DISTRICT_GROUPS[city.slug] || []).find((g) => g.includes(district.en)) || [];
  const pos = group.indexOf(district.en);
  const picked = [];
  for (let step = 1; picked.length < count && step < group.length; step++) {
    for (const i of [pos - step, pos + step]) {
      if (picked.length < count && i >= 0 && i < group.length) picked.push(group[i]);
    }
  }
  return picked.map((en) => city.districts.find((d) => d.en === en)).filter(Boolean);
}

// Language-neutral paths (prefix with /en via pathForLang for English)
export const areasPath = () => '/areas';
export const cityPath = (citySlug) => `/areas/${citySlug}`;
export const districtPath = (citySlug, districtSlug) => `/areas/${citySlug}/${districtSlug}`;

// Every area page path (index, city hubs, districts): sitemap and generateStaticParams
export function allAreaPaths() {
  const paths = [areasPath()];
  for (const slug of CITY_SLUGS) {
    const city = getCity(slug);
    paths.push(cityPath(slug));
    for (const d of city.districts) paths.push(districtPath(slug, d.slug));
  }
  return paths;
}
