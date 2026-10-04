// Copy for the local landing pages (/areas, /areas/<city>, /areas/<city>/<district>), in Arabic and English.
// Only facts the site already states are used: 10+ years, 4.9 rating, 487 customers, 24/7 emergency service,
// 1.5–2 hour emergency response, 30 SAR visit fee, and the database prices of the services.
// District pages pick their sentences from several variants by the district's index, so no two neighbouring pages
// read the same (see districtContent).
import { VISIT_FEE, isPackage } from './servicesData';
import { buildSlugIndex } from './serviceSlugs';
import { nearbyDistricts } from './areas';

export const PHONE = '+966590192146';
export const PHONE_DISPLAY = { ar: '٠٥٩٠١٩٢١٤٦', en: '+966 59 019 2146' };
export const WHATSAPP_URL = 'https://wa.me/966590192146';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
// Latin digits -> Arabic-Indic in Arabic (decimal point -> ٫, thousands comma -> ٬), like the rest of the site
export const num = (value, lang) => {
  const s = typeof value === 'number' ? value.toLocaleString('en-US') : String(value);
  if (lang !== 'ar') return s;
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[d]).replace(/(?<=[٠-٩])\.(?=[٠-٩])/g, '٫').replace(/(?<=[٠-٩]),(?=[٠-٩])/g, '٬');
};

// Same format as formatPrice() in TranslationContext: "١٥٠ ريال" / "SAR 150"
export const price = (amount, lang) =>
  lang === 'ar' ? `${num(Number(amount || 0), 'ar')} ريال` : `SAR ${Number(amount || 0).toLocaleString('en-US')}`;

// Arabic list "أ، ب و ج" / English "A, B and C"
export const joinList = (items, lang) => {
  if (items.length <= 1) return items.join('');
  const head = items.slice(0, -1).join(lang === 'ar' ? '، ' : ', ');
  return lang === 'ar' ? `${head} و${items[items.length - 1]}` : `${head} and ${items[items.length - 1]}`;
};

export const RESPONSE = { ar: '١٫٥–٢ ساعة', en: '1.5–2 hours' };
export const STATS = (lang) => [
  { value: lang === 'ar' ? `+${num(10, 'ar')}` : '10+', label: lang === 'ar' ? 'سنوات خبرة' : 'Years of experience' },
  { value: num(487, lang), label: lang === 'ar' ? 'عميلاً' : 'Customers served' },
  { value: lang === 'ar' ? `${num(24, 'ar')}/${num(7, 'ar')}` : '24/7', label: lang === 'ar' ? 'طوارئ' : 'Emergency service' },
  { value: num(4.9, lang), label: lang === 'ar' ? 'التقييم' : 'Rating' },
];

// Category order and labels: same ids and labels as the footer and the /services filter
export const CATEGORIES = [
  { id: 'ac', en: 'Air conditioners', ar: 'المكيفات' },
  { id: 'refrigerator', en: 'Refrigerators & freezers', ar: 'الثلاجات والفريزر' },
  { id: 'washing-machine', en: 'Washing machines', ar: 'الغسالات' },
  { id: 'stove', en: 'Stoves, ovens & microwaves', ar: 'الأفران والميكروويف' },
  { id: 'general', en: 'Electrical & general', ar: 'الكهرباء والصيانة العامة' },
];

// Fixed slugs of the services quoted in the copy (they never change, see serviceSlugs.js)
const AC_REPAIR_SLUG = 'ac-repair-jeddah';
const AC_CLEANING_SLUG = 'ac-deep-cleaning-jeddah';

// Regular services (no packages) with their canonical slug, grouped by category, plus the prices quoted in the copy.
// services comes from loadServices() (database list, or the bundled copy when the API is down).
export function areaServices(services) {
  const regular = (services || []).filter((s) => s && !isPackage(s));
  const { idToSlug } = buildSlugIndex(regular);
  const withSlug = regular.map((s) => ({ ...s, slug: idToSlug.get(String(s._id || s.id)) }));
  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: withSlug
      .filter((s) => s.category === c.id)
      .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)) || (a.basePrice ?? 0) - (b.basePrice ?? 0)),
  })).filter((g) => g.items.length);
  const known = new Set(CATEGORIES.map((c) => c.id));
  const other = withSlug.filter((s) => !known.has(s.category));
  if (other.length) groups.push({ id: 'other', en: 'Other services', ar: 'خدمات أخرى', items: other });

  const acRepair = withSlug.find((s) => s.slug === AC_REPAIR_SLUG) || withSlug.find((s) => s.category === 'ac');
  const acCleaning = withSlug.find((s) => s.slug === AC_CLEANING_SLUG);
  return {
    groups,
    count: withSlug.length,
    acRepair,
    acRepairPrice: acRepair?.basePrice ?? 150,
    acCleaningPrice: acCleaning?.basePrice ?? 200,
    // The booking CTA opens the AC repair booking form; without it, the services list
    bookId: acRepair ? String(acRepair._id || acRepair.id) : null,
  };
}

export const BOOKING_STEPS = (lang) =>
  lang === 'ar'
    ? [
        { title: 'اختر الخدمة', text: 'اختر الخدمة من القائمة واطّلع على سعرها، أو راسلنا على واتساب إذا لم تكن متأكداً من العطل.' },
        { title: 'حدّد اليوم والعنوان', text: 'اختر اليوم المناسب وأدخل حيّك وعنوانك في نموذج الحجز. للأعطال الطارئة اتصل بنا مباشرة.' },
        { title: 'يتصل الفني ويزورك', text: 'يتصل بك الفني لتأكيد الوقت، ثم يفحص الجهاز ويوضح التكلفة وقطع الغيار قبل البدء بالعمل.' },
      ]
    : [
        { title: 'Choose a service', text: 'Pick the service from the list and see its price, or message us on WhatsApp if you are not sure what the fault is.' },
        { title: 'Pick a day and address', text: 'Choose a day and enter your district and address in the booking form. For emergencies, call us directly.' },
        { title: 'The technician calls and visits', text: 'The technician calls to confirm the time, inspects the unit and explains the cost and any parts before starting.' },
      ];

// ─── City hubs ──────────────────────────────────────────────────────────────────────────────────────────────────

const CITY_COPY = {
  jeddah: {
    ar: {
      h1: 'صيانة مكيفات جدة',
      title: 'صيانة مكيفات جدة وإصلاح الأجهزة | ورشة أحمد للتبريد',
      description: 'صيانة وغسيل المكيفات وتعبئة الفريون وإصلاح الثلاجات والغسالات في جميع أحياء جدة. طوارئ 24/7 ووصول خلال 1.5–2 ساعة ورسوم زيارة 30 ريال.',
      tagline: 'فنيون متنقلون في شمال جدة ووسطها وشرقها وجنوبها',
      intro: [
        'تقدّم ورشة أحمد للتبريد صيانة المكيفات والأجهزة المنزلية في جدة بخبرة تزيد عن ١٠ سنوات. نصلح المكيفات السبليت والشباك والمركزي، ونغسلها ونعبّئ الفريون، ونصلح الثلاجات والغسالات والأفران في منزلك عن طريق فنيين متنقلين يغطّون أحياء المدينة.',
        'رطوبة جدة الساحلية والغبار يرهقان المكيف طوال العام: تتراكم الأوساخ على الملفات فيضعف التبريد ويرتفع استهلاك الكهرباء. لذلك نقدم الغسيل العميق والفحص الدوري إلى جانب الإصلاح، بأسعار واضحة تبدأ من المبلغ المذكور لكل خدمة ورسوم زيارة ثابتة ٣٠ ريال.',
      ],
    },
    en: {
      h1: 'AC Repair in Jeddah',
      title: 'AC Repair in Jeddah | Ahmed Cooling Workshop',
      description: 'AC repair, deep cleaning and freon refill, plus fridge and washing machine repair across Jeddah. 24/7 emergencies, 1.5–2 hour response, 30 SAR visit fee.',
      tagline: 'Mobile technicians across north, central, east and south Jeddah',
      intro: [
        'Ahmed Cooling Workshop has been repairing air conditioners and home appliances in Jeddah for more than 10 years. We repair split, window and central AC units, deep-clean them and refill freon, and fix refrigerators, washing machines and ovens at your home, with mobile technicians covering districts across the city.',
        'Jeddah’s humid coastal air and dust put a strain on air conditioners all year: dirt builds up on the coils, cooling drops and electricity use rises. That is why we offer deep cleaning and regular check-ups as well as repairs, with clear prices that start from the listed amount for each service plus a fixed 30 SAR visit fee.',
      ],
    },
  },
  makkah: {
    ar: {
      h1: 'صيانة مكيفات مكة المكرمة',
      title: 'صيانة مكيفات مكة المكرمة | ورشة أحمد للتبريد',
      description: 'صيانة وغسيل المكيفات وتعبئة الفريون وإصلاح الثلاجات والغسالات في أحياء مكة المكرمة. طوارئ 24/7 ووصول خلال 1.5–2 ساعة ورسوم زيارة 30 ريال.',
      tagline: 'فنيون متنقلون في أحياء مكة المكرمة',
      intro: [
        'نخدم أحياء مكة المكرمة بفنيين متخصصين في صيانة المكيفات والأجهزة المنزلية، بخبرة تزيد عن ١٠ سنوات. من العزيزية والعوالي إلى الشوقية والرصيفة وكدي، يصل الفني إلى منزلك لتشخيص العطل وإصلاحه في الموقع.',
        'حرارة مكة المرتفعة تجعل المكيف يعمل ساعات طويلة كل يوم، ما يزيد من أعطال الضاغط ونقص الفريون وانسداد الفلاتر. نقدم الإصلاح والغسيل وتعبئة الفريون وصيانة التكييف المركزي، إضافة إلى الثلاجات والغسالات، بأسعار تبدأ من المبلغ المذكور ورسوم زيارة ثابتة ٣٠ ريال.',
      ],
    },
    en: {
      h1: 'AC Repair in Makkah',
      title: 'AC Repair in Makkah | Ahmed Cooling Workshop',
      description: 'AC repair, deep cleaning and freon refill, plus fridge and washing machine repair across Makkah. 24/7 emergencies, 1.5–2 hour response, 30 SAR visit fee.',
      tagline: 'Mobile technicians across the districts of Makkah',
      intro: [
        'We serve the districts of Makkah with technicians who specialise in air conditioners and home appliances, backed by more than 10 years of experience. From Al Aziziyah and Al Awali to Al Shoqiyah, Al Rusayfah and Kudai, the technician comes to your home to diagnose and fix the fault on site.',
        'Makkah’s heat keeps air conditioners running for long hours every day, which leads to more compressor faults, low freon and clogged filters. We handle repairs, deep cleaning, freon refills and central AC maintenance, as well as refrigerators and washing machines, with prices that start from the listed amount plus a fixed 30 SAR visit fee.',
      ],
    },
  },
};

function cityFaqs(city, lang, svc) {
  const sample = city.districts.slice(0, 40);
  const pick = (ens) => joinList(ens.map((en) => sample.find((d) => d.en === en)?.[lang]).filter(Boolean), lang);
  const p = price(svc.acRepairPrice, lang);
  const p2 = price(svc.acCleaningPrice, lang);
  const fee = price(VISIT_FEE, lang);
  const isJeddah = city.slug === 'jeddah';
  const examples = isJeddah
    ? pick(['Al Rawdah', 'Al Safa', 'Al Hamra', 'Abhur', 'Al Naim'])
    : pick(['Al Aziziyah', 'Al Awali', 'Al Shoqiyah', 'Kudai', 'Al Naseem']);
  if (lang === 'ar') {
    return [
      {
        q: `ما الأحياء التي تخدمونها في ${city.ar}؟`,
        a: `نغطي ${num(city.districts.length, 'ar')} حياً في ${city.ar} منها ${examples}، والقائمة الكاملة في هذه الصفحة. إذا لم تجد حيّك فراسلنا على واتساب وسنؤكد لك التغطية.`,
      },
      {
        q: `كم يستغرق وصول الفني في الحالات الطارئة في ${city.arShort}؟`,
        a: `خدمة الطوارئ متاحة ٢٤/٧، ويصل فريقنا عادةً خلال ${RESPONSE.ar} لأعطال مثل توقف المكيف في الصيف أو التسريب. أما الحجوزات العادية فتختار فيها اليوم ويتصل بك الفني لتحديد الوقت، وغالباً في نفس اليوم.`,
      },
      {
        q: `كم سعر صيانة المكيف في ${city.arShort}؟`,
        a: `يبدأ إصلاح المكيف من ${p} وغسيل المكيف العميق من ${p2}، وتضاف رسوم زيارة ثابتة ${fee}. الأسعار شاملة الضريبة، وقطع الغيار تُحدد بعد الفحص وبموافقتك.`,
      },
      isJeddah
        ? {
            q: 'كم مرة أحتاج إلى غسيل المكيف في جدة؟',
            a: 'الرطوبة والغبار في جدة يسدّان الفلاتر والملفات بسرعة، لذلك يفضّل كثير من العملاء غسيل المكيف قبل الصيف ومرة أخرى بعده، مع تنظيف الفلاتر بين الزيارات. يخبرك الفني بحالة المكيف بعد الفحص.',
          }
        : {
            q: 'المكيف يعمل طوال اليوم في مكة، متى أحتاج إلى صيانة؟',
            a: 'التشغيل المتواصل في حرارة مكة يجهد الضاغط ويستهلك الفريون، فإذا لاحظت ضعف التبريد أو صوتاً غير معتاد أو تسريب ماء فاحجز فحصاً مبكراً قبل أن يتطور العطل. ويفيد الغسيل الدوري في الحفاظ على كفاءة التبريد.',
          },
      {
        q: `هل تصلحون أجهزة أخرى غير المكيفات في ${city.arShort}؟`,
        a: 'نعم، نصلح الثلاجات والفريزر والغسالات والأفران والميكروويف وموزعات المياه، ونقدم إصلاحات كهربائية وصيانة عامة. أسعار كل خدمة موجودة في القائمة أعلاه.',
      },
      {
        q: 'كيف أحجز موعداً؟',
        a: `احجز من الموقع باختيار الخدمة واليوم والعنوان، أو راسلنا على واتساب، أو اتصل على ${PHONE_DISPLAY.ar}. يتصل بك الفني لتأكيد الموعد قبل الزيارة.`,
      },
    ];
  }
  return [
    {
      q: `Which districts of ${city.en} do you cover?`,
      a: `We cover ${city.districts.length} districts of ${city.en}, including ${examples}; the full list is on this page. If your district is not listed, message us on WhatsApp and we will confirm coverage.`,
    },
    {
      q: `How fast can a technician reach me in an emergency in ${city.en}?`,
      a: `Emergency service runs 24/7 and our team usually arrives within ${RESPONSE.en} for breakdowns such as an AC failing in summer or a leak. For regular bookings you pick the day and the technician calls to agree a time, often the same day.`,
    },
    {
      q: `How much does AC repair cost in ${city.en}?`,
      a: `AC repair starts from ${p} and AC deep cleaning from ${p2}, plus a fixed ${fee} visit fee. Prices include VAT; spare parts are quoted after inspection and only fitted with your approval.`,
    },
    isJeddah
      ? {
          q: 'How often should I clean my AC in Jeddah?',
          a: 'Humidity and dust in Jeddah clog filters and coils quickly, so many customers book a deep clean before summer and again after it, cleaning the filters in between. The technician will tell you the condition of your unit after the inspection.',
        }
      : {
          q: 'My AC runs all day in Makkah. When does it need servicing?',
          a: 'Running non-stop in Makkah’s heat strains the compressor and uses up freon. If you notice weaker cooling, an unusual noise or water leaking, book an inspection early before the fault gets worse. Regular cleaning also helps keep cooling efficient.',
        },
    {
      q: `Do you repair appliances other than AC in ${city.en}?`,
      a: 'Yes. We repair refrigerators, freezers, washing machines, ovens, microwaves and water dispensers, and handle electrical repairs and general maintenance. Every service and its price is in the list above.',
    },
    {
      q: 'How do I book?',
      a: `Book on the website by choosing the service, day and address, message us on WhatsApp, or call ${PHONE_DISPLAY.en}. The technician calls you to confirm the appointment before the visit.`,
    },
  ];
}

export function cityContent(city, lang, svc) {
  const copy = CITY_COPY[city.slug][lang];
  return { ...copy, faqs: cityFaqs(city, lang, svc) };
}

// ─── District pages ─────────────────────────────────────────────────────────────────────────────────────────────

// Intro paragraph variants: ({ d, city, near, n }) -> text. d = district name, near = nearby districts as a list.
const INTRO = {
  ar: [
    ({ d, city, near }) => `تقدّم ورشة أحمد للتبريد خدمة صيانة المكيفات وإصلاح الأجهزة المنزلية في حي ${d} ${city.arIn}، من إصلاح أعطال المكيف وغسيله وتعبئة الفريون إلى صيانة الثلاجات والغسالات. يصل فنيونا المتنقلون إلى منزلك في ${d} وفي الأحياء القريبة مثل ${near}.`,
    ({ d, city, near }) => `هل يبرّد مكيفك في حي ${d} بضعف أو يسرّب الماء؟ فنيو ورشة أحمد للتبريد يغطّون ${d} ضمن خدمتنا لأحياء ${city.arShort}، ويعملون على المكيفات السبليت والشباك والمركزي، إضافة إلى الثلاجات والغسالات والأفران. ونخدم كذلك الأحياء القريبة مثل ${near}.`,
    ({ d, city, near }) => `في حي ${d} ${city.arIn} يعمل المكيف ساعات طويلة معظم أيام السنة، لذلك يحتاج إلى صيانة دورية وإصلاح سريع عند العطل. ترسل ورشة أحمد للتبريد فنياً إلى منزلك في ${d} لتشخيص العطل وإصلاحه في الموقع، كما نخدم ${near} وغيرها من أحياء ${city.arShort}.`,
    ({ d, city, near }) => `يمكن لسكان حي ${d} حجز صيانة المكيف أو الثلاجة أو الغسالة من ورشة أحمد للتبريد عبر الموقع أو واتساب أو الاتصال المباشر. نغطي ${d} والأحياء القريبة منه مثل ${near}، بخبرة تزيد عن ١٠ سنوات في صيانة التكييف والأجهزة المنزلية ${city.arIn}.`,
  ],
  en: [
    ({ d, city, near }) => `Ahmed Cooling Workshop provides AC maintenance and home appliance repair in ${d}, ${city.en}, from fixing AC faults, deep cleaning and freon refills to refrigerator and washing machine repairs. Our mobile technicians come to your home in ${d} and in nearby districts such as ${near}.`,
    ({ d, city, near }) => `Is your AC in ${d} cooling weakly or leaking water? Ahmed Cooling Workshop technicians cover ${d} as part of our service across ${city.en}, working on split, window and central AC units as well as refrigerators, washing machines and ovens. We also serve nearby districts such as ${near}.`,
    ({ d, city, near }) => `In ${d}, ${city.en}, air conditioners run for long hours most of the year, so they need regular maintenance and a quick repair when something fails. Ahmed Cooling Workshop sends a technician to your home in ${d} to diagnose and fix the fault on site, and we also serve ${near} and other districts of ${city.en}.`,
    ({ d, city, near }) => `Residents of ${d} can book AC, refrigerator or washing machine repair from Ahmed Cooling Workshop on the website, on WhatsApp or by phone. We cover ${d} and nearby districts such as ${near}, with more than 10 years of experience in AC and home appliance repair in ${city.en}.`,
  ],
};

// Second paragraph variants: price, emergency or parts focus
const DETAIL = {
  ar: [
    ({ d, p, fee }) => `الأسعار في ${d} هي نفسها أسعار الموقع: يبدأ إصلاح المكيف من ${p} وتضاف رسوم زيارة ثابتة ${fee}، وتُحدد قطع الغيار بعد الفحص وقبل البدء بالعمل.`,
    ({ d }) => `عند تعطل المكيف في الصيف يصل فريق الطوارئ إلى ${d} عادةً خلال ${RESPONSE.ar}، والخدمة متاحة على مدار الساعة طوال أيام الأسبوع.`,
    ({ d }) => `نحرص في كل زيارة داخل ${d} على استخدام قطع غيار أصلية وتوضيح التكلفة قبل التنفيذ، وتشمل أعمالنا ضماناً تختلف مدته حسب نوع الخدمة.`,
  ],
  en: [
    ({ d, p, fee }) => `Prices in ${d} are the same as on the website: AC repair starts from ${p} plus a fixed ${fee} visit fee, and any spare parts are quoted after the inspection, before work starts.`,
    ({ d }) => `When an AC breaks down in summer, our emergency team usually reaches ${d} within ${RESPONSE.en}, and the service is available around the clock, seven days a week.`,
    ({ d }) => `On every visit in ${d} we use genuine spare parts and explain the cost before starting, and our work comes with a warranty whose length depends on the service.`,
  ],
};

// FAQ slots, each with variants: ({ d, city, p, p2, fee }) -> { q, a }
const FAQ_COVERAGE = {
  ar: [
    ({ d, city }) => ({
      q: `هل تقدمون صيانة المكيفات في حي ${d}؟`,
      a: `نعم، حي ${d} من الأحياء التي نخدمها ${city.arIn}. احجز من الموقع واختر اليوم المناسب وسيتصل بك الفني لتحديد الوقت، وغالباً في نفس اليوم.`,
    }),
    ({ d }) => ({
      q: `كم يستغرق وصول الفني إلى حي ${d}؟`,
      a: `في الحجوزات العادية تختار اليوم ويتصل بك الفني لتأكيد الموعد، وغالباً في نفس اليوم. أما الأعطال الطارئة في ${d} فيصل فريقنا عادةً خلال ${RESPONSE.ar}.`,
    }),
  ],
  en: [
    ({ d, city }) => ({
      q: `Do you service air conditioners in ${d}?`,
      a: `Yes, ${d} is one of the districts we serve in ${city.en}. Book on the website, choose a day, and the technician will call you to agree a time, often the same day.`,
    }),
    ({ d }) => ({
      q: `How long does a technician take to reach ${d}?`,
      a: `For regular bookings you choose the day and the technician calls to confirm the time, often the same day. For emergencies in ${d}, our team usually arrives within ${RESPONSE.en}.`,
    }),
  ],
};

const FAQ_PRICE = {
  ar: [
    ({ d, p, fee }) => ({
      q: `كم سعر صيانة المكيف في حي ${d}؟`,
      a: `يبدأ إصلاح المكيف من ${p} مع رسوم زيارة ${fee}. يتحدد السعر النهائي بعد الفحص، وتُحسب قطع الغيار منفصلة وبموافقتك.`,
    }),
    ({ d, city, p, p2, fee }) => ({
      q: `هل تختلف الأسعار في ${d} عن باقي أحياء ${city.arShort}؟`,
      a: `لا، الأسعار نفسها في جميع الأحياء: يبدأ إصلاح المكيف من ${p} وغسيل المكيف من ${p2}، وتضاف رسوم زيارة ثابتة ${fee}.`,
    }),
    ({ d, p2, fee }) => ({
      q: `كم تكلفة غسيل المكيف في حي ${d}؟`,
      a: `يبدأ التنظيف العميق للمكيف من ${p2} مع رسوم زيارة ${fee}، ويشمل الفلاتر والملفات ومجرى التصريف والتعقيم.`,
    }),
  ],
  en: [
    ({ d, p, fee }) => ({
      q: `How much does AC repair cost in ${d}?`,
      a: `AC repair starts from ${p} plus a ${fee} visit fee. The final price is set after the inspection, and spare parts are charged separately with your approval.`,
    }),
    ({ d, city, p, p2, fee }) => ({
      q: `Are prices in ${d} different from the rest of ${city.en}?`,
      a: `No, prices are the same in every district: AC repair starts from ${p} and AC deep cleaning from ${p2}, plus a fixed ${fee} visit fee.`,
    }),
    ({ d, p2, fee }) => ({
      q: `How much does AC cleaning cost in ${d}?`,
      a: `AC deep cleaning starts from ${p2} plus a ${fee} visit fee, and covers the filters, coils, drain line and sanitisation.`,
    }),
  ],
};

const FAQ_OTHER = {
  ar: [
    ({ d }) => ({
      q: `هل تصلحون الثلاجات والغسالات في حي ${d}؟`,
      a: `نعم، إلى جانب المكيفات نصلح الثلاجات والفريزر والغسالات والأفران والميكروويف في ${d}. تجد سعر كل خدمة في القائمة أعلاه.`,
    }),
    ({ d }) => ({
      q: `هل الخدمة متاحة في حي ${d} ليلاً وفي العطلات؟`,
      a: `نعم، خدمة الطوارئ متاحة ٢٤/٧ طوال أيام الأسبوع. تواصل معنا عبر واتساب أو اتصل على ${PHONE_DISPLAY.ar} وسنرسل أقرب فني متاح.`,
    }),
    ({ d }) => ({
      q: `هل يوجد ضمان على الصيانة في حي ${d}؟`,
      a: 'نعم، أعمال الصيانة مشمولة بضمان تختلف مدته حسب نوع الخدمة، ونستخدم قطع غيار أصلية. يوضح لك الفني شروط الضمان عند الزيارة.',
    }),
  ],
  en: [
    ({ d }) => ({
      q: `Do you repair refrigerators and washing machines in ${d}?`,
      a: `Yes. As well as air conditioners, we repair refrigerators, freezers, washing machines, ovens and microwaves in ${d}. Every service and its price is in the list above.`,
    }),
    ({ d }) => ({
      q: `Is service available in ${d} at night and on weekends?`,
      a: `Yes, emergency service runs 24/7, seven days a week. Message us on WhatsApp or call ${PHONE_DISPLAY.en} and we will send the nearest available technician.`,
    }),
    ({ d }) => ({
      q: `Is there a warranty on repairs in ${d}?`,
      a: 'Yes. Our repairs come with a warranty whose length depends on the service, and we use genuine spare parts. The technician explains the warranty terms during the visit.',
    }),
  ],
};

// Title with the brand, kept within 60 characters (falls back to a shorter brand, then no brand)
const fitTitle = (main, lang) => {
  const brands = lang === 'ar' ? ['ورشة أحمد للتبريد'] : ['Ahmed Cooling Workshop', 'Ahmed Cooling'];
  for (const b of brands) {
    const t = `${main} | ${b}`;
    if (t.length <= 60) return t;
  }
  return main;
};

export function districtContent(city, district, lang, svc) {
  const i = district.index;
  const d = district[lang];
  const near = nearbyDistricts(city, district, 3);
  const vars = {
    d,
    city,
    near: joinList(near.map((n) => n[lang]), lang),
    p: price(svc.acRepairPrice, lang),
    p2: price(svc.acCleaningPrice, lang),
    fee: price(VISIT_FEE, lang),
  };
  const h1 = lang === 'ar' ? `صيانة مكيفات حي ${d} ${city.arShort}` : `AC Repair in ${d}, ${city.en}`;
  const title = fitTitle(lang === 'ar' ? `صيانة مكيفات حي ${d} ${city.arShort}` : `AC Repair in ${d}, ${city.en}`, lang);
  const description =
    lang === 'ar'
      ? [
          `صيانة وإصلاح وغسيل المكيفات وتعبئة الفريون في حي ${d} ${city.arIn}. فنيون متنقلون، طوارئ 24/7 ووصول خلال 1.5–2 ساعة، ورسوم زيارة 30 ريال.`,
          `فني مكيفات في حي ${d} ${city.arIn}: إصلاح وغسيل المكيفات والثلاجات والغسالات بأسعار واضحة ورسوم زيارة 30 ريال. احجز أونلاين أو عبر واتساب.`,
          `ورشة أحمد للتبريد تخدم حي ${d} ${city.arIn}: صيانة المكيفات السبليت والمركزي وتعبئة الفريون وإصلاح الأجهزة المنزلية مع ضمان وطوارئ 24/7.`,
        ][i % 3]
      : [
          `AC repair, deep cleaning and freon refill in ${d}, ${city.en}. Mobile technicians, 24/7 emergencies with a 1.5–2 hour response and a 30 SAR visit fee.`,
          `AC technician in ${d}, ${city.en}: AC, fridge and washing machine repair with clear prices and a 30 SAR visit fee. Book online or on WhatsApp.`,
          `Ahmed Cooling Workshop serves ${d}, ${city.en}: split and central AC repair, freon refill and home appliance repair, with warranty and 24/7 emergencies.`,
        ][i % 3];

  const faqs = [
    FAQ_COVERAGE[lang][i % 2](vars),
    FAQ_PRICE[lang][i % 3](vars),
    FAQ_OTHER[lang][(i + 1) % 3](vars),
  ];
  // Rotate the question order too, so the pages do not all open with the same question
  const shift = Math.floor(i / 2) % 3;
  const orderedFaqs = [...faqs.slice(shift), ...faqs.slice(0, shift)];

  return {
    h1,
    title,
    description,
    intro: [INTRO[lang][i % 4](vars), DETAIL[lang][i % 3](vars)],
    faqs: orderedFaqs,
    near,
  };
}

// ─── JSON-LD helpers ────────────────────────────────────────────────────────────────────────────────────────────

export const breadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, idx) => ({ '@type': 'ListItem', position: idx + 1, name: it.name, item: it.url })),
});

export const faqJsonLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
