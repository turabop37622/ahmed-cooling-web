const SERVICES_META = {
  '1': {
    title: 'AC Repair & Diagnostics in Jeddah & Makkah | صيانة وفحص المكيفات',
    description: 'Certified AC diagnostics and repair for split, window, and central air conditioning in Jeddah & Makkah. Emergency dispatch in 60-90 minutes, and original spare parts.',
    keywords: ['AC repair Jeddah', 'صيانة مكيفات جدة', 'تصليح مكيفات سبليت مكة', 'فني تكييف جدة', 'AC repair expert technician'],
  },
  '2': {
    title: 'AC Installation & Dismantling in Jeddah & Makkah | تركيب وفك مكيفات سبليت',
    description: 'Professional installation and relocation for split and window air conditioners in Jeddah & Makkah. Precision copper piping, vacuum testing, and guaranteed leak-free operation.',
    keywords: ['AC installation Jeddah', 'تركيب مكيفات سبليت جدة', 'فك وتركيب مكيفات مكة', 'AC moving Jeddah'],
  },
  '3': {
    title: 'AC Deep Cleaning & Sanitization in Jeddah | غسيل وتنظيف مكيفات',
    description: 'High-pressure water bag jet wash and antibacterial sanitization for split and window AC coils in Jeddah & Makkah. Eliminates odors and maximizes cooling power.',
    keywords: ['AC deep cleaning Jeddah', 'غسيل مكيفات جدة', 'تنظيف مكيفات سبليت مكة', 'تعقيم التكييف', 'AC pressure wash Jeddah'],
  },
  '4': {
    title: 'Refrigerator & Freezer Repair in Jeddah & Makkah | إصلاح وصيانة الثلاجات',
    description: 'Fast on-site repair for residential refrigerators and freezers in Jeddah & Makkah. Compressor repair, thermostat replacement, defrost heating, and original freon recharge.',
    keywords: ['refrigerator repair Jeddah', 'صيانة ثلاجات جدة', 'تصليح فريزر مكة', 'فني ثلاجات منزلي', 'fridge repair expat Jeddah'],
  },
  '5': {
    title: 'Washing Machine Repair in Jeddah & Makkah | صيانة وإصلاح الغسالات',
    description: 'Expert same-day repair for automatic and semi-automatic washing machines in Jeddah & Makkah. Spin basket, drum bearings, water pumps, drain valves, and control boards.',
    keywords: ['washing machine repair Jeddah', 'صيانة غسالات جدة', 'تصليح غسالات أوتوماتيك مكة', 'فني غسالات منزلي', 'washer repair Jeddah'],
  },
  '6': {
    title: 'AC Gas Refill (R410A / R22) in Jeddah & Makkah | تعبئة غاز فريون',
    description: 'Genuine R410A and R22 freon refill with pressure testing and leak detection for split and window AC units in Jeddah & Makkah.',
    keywords: ['AC gas refill Jeddah', 'تعبئة فريون جدة', 'شحن غاز مكيف مكة', 'freon refill Saudi Arabia'],
  },
};

SERVICES_META['7'] = {
  title: 'Cooking Stove & Oven Repair in Jeddah & Makkah | صيانة الأفران والبوتاجازات',
  description: 'Burner cleaning, ignition fixes, thermostat replacement and gas safety checks for stoves and ovens in Jeddah & Makkah.',
  keywords: ['oven repair Jeddah', 'صيانة أفران جدة', 'تصليح بوتاجاز مكة', 'stove repair Makkah'],
};
SERVICES_META['8'] = {
  title: 'Electrical Wiring & Fault Repair in Jeddah & Makkah | صيانة التمديدات والأعطال الكهربائية',
  description: 'Breaker repairs, short-circuit fixes and socket troubleshooting for homes in Jeddah & Makkah.',
  keywords: ['electrical repair Jeddah', 'اصلاح كهرباء جدة', 'تمديدات كهربائية مكة', 'electrician Makkah'],
};
SERVICES_META['9'] = {
  title: 'Central AC Service in Jeddah & Makkah | خدمة التكييف المركزي',
  description: 'Maintenance and duct cleaning for central and chiller AC systems in homes and buildings across Jeddah & Makkah.',
  keywords: ['central AC Jeddah', 'صيانة تكييف مركزي جدة', 'chiller maintenance Makkah'],
};
SERVICES_META['pkg_villa'] = {
  title: 'Annual Villa Care Maintenance Plan in Jeddah & Makkah | عقد رعاية سنوية للفلل',
  description: 'Four seasonal AC maintenance visits, priority 24/7 support and 20% off spare parts for villas and homes in Jeddah & Makkah.',
  keywords: ['villa maintenance Jeddah', 'عقد صيانة فلل جدة', 'annual AC maintenance contract'],
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const meta = SERVICES_META[id] || {
    title: 'Home Appliance & AC Repair Services | صيانة الأجهزة المنزلية',
    description: 'Professional AC, refrigerator, washing machine, and cooling appliance repair in Jeddah and Makkah.',
    keywords: ['appliance repair Jeddah', 'صيانة أجهزة منزلية جدة', 'ورشة أحمد للتبريد'],
  };

  const canonicalUrl = `https://www.ahmedcoolingworkshop.com/services/${id}`;
  // Made-up ids (for example /services/foo) must not be indexed. Real database ids are 24 hex characters.
  const isKnown = Boolean(SERVICES_META[id]) || /^[a-f0-9]{24}$/i.test(id);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    ...(isKnown ? {} : { robots: { index: false, follow: true } }),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default function ServiceDetailLayout({ children }) {
  return children;
}
