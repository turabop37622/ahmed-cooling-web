import { Refrigerator, WashingMachine, Snowflake, Wind, Flame, Wrench, Sparkles } from 'lucide-react';

// Outline vector icon for a service, picked from its name/category
export default function ServiceIcon({ service, className = 'w-6 h-6' }) {
  const text = `${service?.name || ''} ${service?.nameAr || ''} ${service?.name_en || ''} ${service?.name_ar || ''} ${service?.category || ''}`.toLowerCase();

  if (text.includes('ref') || text.includes('fridge') || text.includes('freezer') || text.includes('ثلاج') || text.includes('ice')) {
    return <Refrigerator className={className} />;
  }
  if (text.includes('wash') || text.includes('laundry') || text.includes('غسال')) {
    return <WashingMachine className={className} />;
  }
  if (text.includes('clean') || text.includes('jet') || text.includes('sanitiz') || text.includes('غسيل') || text.includes('تنظيف')) {
    return <Sparkles className={className} />;
  }
  if (text.includes('gas') || text.includes('freon') || text.includes('شحن') || text.includes('فريون')) {
    return <Wind className={className} />;
  }
  if (text.includes('stove') || text.includes('oven') || text.includes('cook') || text.includes('فرن') || text.includes('بوتجاز') || text.includes('طباخ')) {
    return <Flame className={className} />;
  }
  if (text.includes('ac') || text.includes('air') || text.includes('cool') || text.includes('مكيف') || text.includes('تبريد') || text.includes('سبليت')) {
    return <Snowflake className={className} />;
  }
  return <Wrench className={className} />;
}
