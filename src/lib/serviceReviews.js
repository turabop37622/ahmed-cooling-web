// Customer reviews shown on each service's detail page.
// Every entry is text that already existed on the site (home page reviews and the old detail-page
// reviews). A review is only listed for a service it is actually about; the rest are general reviews
// rotated per service so pages do not all show the same set.
// Replace with real, approved customer reviews (e.g. from the Rate Us flow) when they are available.

export const REVIEW_POOL = [
  {
    "id": "home-0",
    "services": [
      "1"
    ],
    "name": "ناصر الحارثي",
    "nameEn": "Nasser Al-Harbi",
    "city": "جدة (حي الروضة)",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ يوم",
    "dateEn": "1 day ago",
    "comment": "خدمة إصلاح مكيفات ممتازة بجدة! الفني وصل في الموعد لمنطقة الروضة وقام بحل مشكلة التبريد فوراً. احترافية عالية جداً!",
    "commentEn": "Excellent AC repair service! The technician came on time and fixed the AC within an hour. Highly recommended!",
    "likes": 9
  },
  {
    "id": "home-1",
    "services": [
      "1"
    ],
    "name": "أحمد الحربي",
    "nameEn": "Ahmed Al-Harbi",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ يومين",
    "dateEn": "2 days ago",
    "comment": "خدمة إصلاح مكيفات ممتازة! جاء الفني في الوقت المحدد وأصلح المكيف خلال ساعة. أنصح بشدة!",
    "commentEn": "The team was very professional and fixed my split AC quickly. Great service and fair pricing!",
    "likes": 7
  },
  {
    "id": "home-2",
    "services": [
      "pkg_villa"
    ],
    "name": "فيصل الغامدي",
    "nameEn": "Tariq Al-Shehri",
    "city": "مكة المكرمة (حي العوالي)",
    "cityEn": "Makkah",
    "rating": 5,
    "date": "منذ ٣ أيام",
    "dateEn": "3 days ago",
    "comment": "صيانة دورية ممتازة لفيلا في العوالي شملت تنظيف مجاري الهواء (الدكت) والمكيفات. التزام كامل بالمواعيد وعمل متقن وفريق محترف.",
    "commentEn": "Great AC maintenance for our villa. Prompt response, clean work, and very professional team.",
    "likes": 12
  },
  {
    "id": "home-3",
    "services": [
      "2"
    ],
    "name": "فاطمة الزهراني",
    "nameEn": "Fatima Al-Zahrani",
    "city": "مكة",
    "cityEn": "Makkah",
    "rating": 5,
    "date": "منذ ٣ أيام",
    "dateEn": "3 days ago",
    "comment": "خدمة احترافية وسريعة. ركبوا مكيف سبليت جديد بشكل مثالي. سعيدة جداً بالعمل!",
    "commentEn": "Professional and fast service. They installed my new split AC perfectly. Very happy with the work!",
    "likes": 8
  },
  {
    "id": "home-4",
    "services": [
      "4"
    ],
    "name": "محمد الغامدي",
    "nameEn": "Mohammed Al-Ghamdi",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ ٥ أيام",
    "dateEn": "5 days ago",
    "comment": "اتصلت بهم لإصلاح ثلاجة طارئ بالليل. وصل الفني خلال ٣٠ دقيقة. خدمة مذهلة!",
    "commentEn": "Called them for an emergency fridge repair at night. Technician arrived in 30 minutes. Amazing service!",
    "likes": 14
  },
  {
    "id": "home-5",
    "services": [
      "5"
    ],
    "name": "سارة العتيبي",
    "nameEn": "Sara Al-Otaibi",
    "city": "مكة",
    "cityEn": "Makkah",
    "rating": 4,
    "date": "منذ أسبوع",
    "dateEn": "1 week ago",
    "comment": "إصلاح غسالة جيد. الفني كان متخصص وأصلح المشكلة بسرعة. أسعار معقولة.",
    "commentEn": "Good washing machine repair. The technician was knowledgeable and fixed the issue quickly. Fair prices.",
    "likes": 6
  },
  {
    "id": "home-6",
    "services": [
      "3"
    ],
    "name": "خالد الشهري",
    "nameEn": "Khalid Al-Shehri",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ أسبوع",
    "dateEn": "1 week ago",
    "comment": "أفضل خدمة تنظيف مكيفات! المكيف يعمل كالجديد الآن. سأستخدمهم مرة أخرى بالتأكيد.",
    "commentEn": "Best AC deep cleaning service! My AC is running like new now. Will definitely use again.",
    "likes": 11
  },
  {
    "id": "home-7",
    "services": [
      "7"
    ],
    "name": "نورة القحطاني",
    "nameEn": "Noura Al-Qahtani",
    "city": "مكة",
    "cityEn": "Makkah",
    "rating": 5,
    "date": "منذ أسبوعين",
    "dateEn": "2 weeks ago",
    "comment": "شركة موثوقة جداً. أصلحوا الفرن والميكروويف في نفس الزيارة. قيمة ممتازة!",
    "commentEn": "Very reliable company. They repaired my oven and microwave on the same visit. Great value!",
    "likes": 5
  },
  {
    "id": "home-8",
    "services": [
      "pkg_villa"
    ],
    "name": "عمر الدوسري",
    "nameEn": "Omar Al-Dossari",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ أسبوعين",
    "dateEn": "2 weeks ago",
    "comment": "خطة الصيانة السنوية تستحق! يقومون بصيانة جميع الأجهزة بانتظام. فريق ممتاز.",
    "commentEn": "Annual maintenance plan is worth it! They service all appliances regularly. Excellent team.",
    "likes": 13
  },
  {
    "id": "home-9",
    "services": [
      "4"
    ],
    "name": "هدى المالكي",
    "nameEn": "Huda Al-Malki",
    "city": "مكة",
    "cityEn": "Makkah",
    "rating": 4,
    "date": "منذ ٣ أسابيع",
    "dateEn": "3 weeks ago",
    "comment": "الفريزر كان يسرب ماء وأصلحوه في نفس اليوم. الفني كان محترف جداً. أنصح بهم!",
    "commentEn": "Freezer was leaking and they fixed it same day. Technician was very professional. Recommended!",
    "likes": 10
  },
  {
    "id": "home-10",
    "services": [
      "8"
    ],
    "name": "يوسف الرشيدي",
    "nameEn": "Yusuf Al-Rashidi",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ ٣ أسابيع",
    "dateEn": "3 weeks ago",
    "comment": "اتصلت لإصلاح الأسلاك الكهربائية. استجابة سريعة، عمل نظيف، وأسعار معقولة.",
    "commentEn": "Called for electrical wiring fix. Fast response, clean work, and very affordable pricing.",
    "likes": 7
  },
  {
    "id": "home-11",
    "services": [
      "9"
    ],
    "name": "مريم السبيعي",
    "nameEn": "Maryam Al-Subaie",
    "city": "مكة",
    "cityEn": "Makkah",
    "rating": 5,
    "date": "منذ شهر",
    "dateEn": "1 month ago",
    "comment": "أصلحوا نظام التكييف المركزي للمبنى بالكامل. فريق محترف وذو خبرة!",
    "commentEn": "They repaired my central AC system for the entire building. Professional and experienced team!",
    "likes": 9
  },
  {
    "id": "rev-ksa-1",
    "services": [
      "1"
    ],
    "name": "محمد العمري",
    "nameEn": "Mohammed Al-Omari",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ يومين",
    "dateEn": "2 days ago",
    "comment": "خدمة راقية جداً وسريعة في جدة. الفني فحص التكييف بدقة وقام بتغيير القطعة المطلوبة واختبر البرودة بكفاءة عالية.",
    "commentEn": "Excellent service in Jeddah! The technician inspected our AC thoroughly, replaced the faulty component, and verified optimal cooling performance.",
    "likes": 11
  },
  {
    "id": "rev-1",
    "services": [],
    "name": "عبدالله السلمي",
    "nameEn": "Abdullah Al-Sulami",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ ٣ أيام",
    "dateEn": "3 days ago",
    "comment": "ما شاء الله تبارك الله، الفني وصل في الموعد تماماً وكان خلوقاً ومحترفاً جداً. فحص الجهاز وكشف سبب العطل بدقة وصلحه واختبر التبريد قبل أن يغادر. أنصح بالتعامل معهم بشدة.",
    "commentEn": "Excellent service! The technician arrived right on time, diagnosed the issue quickly, and tested everything thoroughly before leaving. Highly recommended.",
    "likes": 12
  },
  {
    "id": "rev-2",
    "services": [],
    "name": "أم فيصل الشريف",
    "nameEn": "Um Faisal Al-Sharif",
    "city": "مكة المكرمة",
    "cityEn": "Makkah",
    "rating": 5,
    "date": "منذ أسبوع",
    "dateEn": "1 week ago",
    "comment": "خدمة سريعة وممتازة وسعرهم واضح من البداية بدون أي رسوم خفية. وتم تسليمي سند ضمان رسمي معتمد على الصيانة.",
    "commentEn": "Fast and reliable service with clear upfront pricing. They provided an official certified warranty receipt for the service.",
    "likes": 8
  },
  {
    "id": "rev-3",
    "services": [],
    "name": "سلطان الحربي",
    "nameEn": "Sultan Al-Harbi",
    "city": "جدة",
    "cityEn": "Jeddah",
    "rating": 5,
    "date": "منذ أسبوعين",
    "dateEn": "2 weeks ago",
    "comment": "تعاملت مع عدة فنيين من قبل لكن ورشة أحمد للتبريد أفضلهم أمانة ودقة في المواعيد. الجهاز شغال ممتاز كأنه جديد.",
    "commentEn": "Best cooling and appliance service team in Jeddah. Repaired the fault on the first visit with great honesty and precision.",
    "likes": 15
  },
  {
    "id": "rev-4",
    "services": [],
    "name": "رنا الغامدي",
    "nameEn": "Rana Al-Ghamdi",
    "city": "مكة المكرمة",
    "cityEn": "Makkah",
    "rating": 4,
    "date": "منذ شهر",
    "dateEn": "1 month ago",
    "comment": "فريق محترم جداً والتزام تام بالمواعيد ونظافة تامة أثناء العمل بعد الانتهاء. شكراً جزيلاً لكم.",
    "commentEn": "Very respectful crew, on-time arrival and clean work throughout. Thank you very much.",
    "likes": 6
  }
];

const GENERAL = REVIEW_POOL.filter((r) => r.services.length === 0);

export function getReviewsForService(serviceId, serviceIndex = 0) {
  const id = String(serviceId);
  const specific = REVIEW_POOL.filter((r) => r.services.includes(id));
  const target = 4;
  const need = Math.max(target - specific.length, 0);
  const general = [];
  for (let n = 0; n < need && GENERAL.length; n += 1) {
    general.push(GENERAL[(serviceIndex + n) % GENERAL.length]);
  }
  return [...specific, ...general];
}
