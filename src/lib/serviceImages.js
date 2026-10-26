/**
 * Authentic real photography service images featuring professional Asian / South Asian
 * technicians performing genuine HVAC, refrigeration, and appliance repairs.
 */
export const SERVICE_IMAGES = {
  // AC Services
  'AC Repair': '/services/ac-repair.webp',
  'AC Installation': '/services/ac-installation.webp',
  'AC Deep Cleaning': '/services/ac-deep-cleaning.webp',
  'AC Gas Refill': '/services/ac-gas-refill.webp',
  'AC Compressor Repair': '/services/ac-compressor-repair.webp',
  'AC PCB Repair': '/services/ac-pcb-repair.webp',
  'AC Shifting': '/services/ac-shifting.webp',
  'Central AC Service': '/services/central-ac-service.webp',
  'Summer AC Prep - Deep Wash + Gas Top-up': '/services/ac-deep-cleaning.webp',

  // Refrigerator & Freezer Services (two photos, alternated so neighbouring cards differ):
  // compressor/gas work at the back of the fridge vs. electrical testing with the door open
  'Refrigerator Repair': '/services/refrigerator-repair.webp',
  'Freezer Repair': '/services/freezer-repair.webp',
  'Fridge Gas Refill': '/services/fridge-gas-refill.webp',
  'Fridge Thermostat Fix': '/services/fridge-thermostat-repair.webp',

  // Washing Machine
  'Washing Machine Repair': '/services/washing-machine-repair.webp',

  // Cooking & Kitchen Appliances
  'Stove & Oven Repair': '/services/oven-stove-repair.webp',
  'Microwave Repair': '/services/microwave-repair.webp',
  'Water Dispenser Repair': '/services/water-dispenser-repair.webp',

  // Electrical & Power
  'Electrical Wiring Fix': '/services/electrical-wiring-repair.webp',
  'UPS & Inverter Repair': '/services/ups-inverter-repair.webp',
  'General Maintenance': '/services/general-maintenance.webp',
  'Annual Villa Care - Full Home Maintenance': '/services/annual-maintenance.webp',
  'Diagnostic Repair Visit': '/services/emergency-repair.webp',
};

export const CATEGORY_FALLBACKS = {
  ac: '/services/ac-repair.webp',
  refrigerator: '/services/refrigerator-repair.webp',
  'washing-machine': '/services/washing-machine-repair.webp',
  washer: '/services/washing-machine-repair.webp',
  stove: '/services/oven-stove-repair.webp',
  general: '/services/general-maintenance.webp',
};

export const DEFAULT_SERVICE_IMAGE = '/services/ac-repair.webp';

export const getServiceImage = (serviceName, category) => {
  if (!serviceName && !category) return DEFAULT_SERVICE_IMAGE;

  // 1. Direct name match in SERVICE_IMAGES dictionary
  if (serviceName && SERVICE_IMAGES[serviceName]) {
    return SERVICE_IMAGES[serviceName];
  }

  // 2. Intelligent keyword & substring match (prioritizing specific appliances)
  if (serviceName) {
    const s = String(serviceName).toLowerCase();

    // Washing Machine (checked before generic "wash")
    if (s.includes('washing') || s.includes('washer') || s.includes('غسال')) {
      return SERVICE_IMAGES['Washing Machine Repair'];
    }

    // Refrigerator & Freezer
    if ((s.includes('freezer') || s.includes('فريزر')) && !s.includes('refrigerator') && !s.includes('ثلاج')) {
      return SERVICE_IMAGES['Freezer Repair'];
    }
    if (s.includes('refrigerator') || s.includes('fridge') || s.includes('ثلاج')) {
      return SERVICE_IMAGES['Refrigerator Repair'];
    }

    // Services that have their own photo
    if (/\bpcb\b|board/.test(s)) return SERVICE_IMAGES['AC PCB Repair'];
    if (s.includes('compressor') || s.includes('كمبروسر')) return SERVICE_IMAGES['AC Compressor Repair'];
    if (s.includes('shift') || s.includes('relocat') || s.includes('نقل')) return SERVICE_IMAGES['AC Shifting'];
    if (s.includes('thermostat') || s.includes('ثرموستات')) return SERVICE_IMAGES['Fridge Thermostat Fix'];
    if (s.includes('microwave') || s.includes('ميكرويف')) return SERVICE_IMAGES['Microwave Repair'];
    if (s.includes('dispenser') || s.includes('مبرد مياه') || s.includes('براد')) return SERVICE_IMAGES['Water Dispenser Repair'];
    if (/\bups\b|inverter|انفرتر|يو بي إس/.test(s)) return SERVICE_IMAGES['UPS & Inverter Repair'];
    if (s.includes('annual') || s.includes('villa') || s.includes('سنوي') || s.includes('فيلا')) return SERVICE_IMAGES['Annual Villa Care - Full Home Maintenance'];
    if (s.includes('general maintenance') || s.includes('صيانة عامة')) return SERVICE_IMAGES['General Maintenance'];
    if (s.includes('diagnostic') || s.includes('emergency') || s.includes('طوارئ') || s.includes('فحص')) return SERVICE_IMAGES['Diagnostic Repair Visit'];

    // Stove & Oven
    if (s.includes('stove') || s.includes('oven') || s.includes('cooker') || s.includes('فرن') || s.includes('بوتاجاز')) {
      return SERVICE_IMAGES['Stove & Oven Repair'];
    }

    // Electrical Wiring & Power
    if (s.includes('wiring') || s.includes('electric') || s.includes('كهرب') || s.includes('قواطع')) {
      return SERVICE_IMAGES['Electrical Wiring Fix'];
    }

    // Central AC / Ducted
    if (s.includes('central') || s.includes('duct') || s.includes('مركزي') || s.includes('دكت')) {
      return SERVICE_IMAGES['Central AC Service'];
    }

    // AC Deep Cleaning / Wash (after washing machine check)
    if (s.includes('cleaning') || s.includes('deep clean') || s.includes('تنظيف') || s.includes('غسيل')) {
      return SERVICE_IMAGES['AC Deep Cleaning'];
    }

    // AC Gas Refill
    if (s.includes('gas') || s.includes('refill') || s.includes('freon') || s.includes('فريون') || s.includes('شحن')) {
      return SERVICE_IMAGES['AC Gas Refill'];
    }

    // AC Installation / Mounting
    if (s.includes('install') || s.includes('mount') || s.includes('تركيب')) {
      return SERVICE_IMAGES['AC Installation'];
    }

    // General AC Repair
    if (s.includes('ac') || s.includes('air cond') || s.includes('تكييف') || s.includes('مكيف')) {
      return SERVICE_IMAGES['AC Repair'];
    }
  }

  // 3. Category Fallback
  if (category) {
    const cat = String(category).toLowerCase();
    if (CATEGORY_FALLBACKS[cat]) return CATEGORY_FALLBACKS[cat];
    if (cat.includes('ac')) return CATEGORY_FALLBACKS.ac;
    if (cat.includes('fridge') || cat.includes('refrigerator')) return CATEGORY_FALLBACKS.refrigerator;
    if (cat.includes('wash')) return CATEGORY_FALLBACKS['washing-machine'];
    if (cat.includes('stove') || cat.includes('oven')) return CATEGORY_FALLBACKS.stove;
  }

  return DEFAULT_SERVICE_IMAGE;
};
