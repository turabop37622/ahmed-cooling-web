// Saudi mobile numbers: the 9-digit national number that starts with 5 (e.g. 5X XXX XXXX).
// Accepts what people actually type or paste: Arabic-Indic / Persian digits, spaces, dashes,
// a leading 0 (05...), or the country code (966..., +966..., 00966..., +966 05...).

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

export const toLatinDigits = (value) =>
  String(value ?? '').replace(/[٠-٩۰-۹]/g, (ch) => {
    const i = ARABIC_INDIC.indexOf(ch);
    return String(i >= 0 ? i : PERSIAN.indexOf(ch));
  });

export function normalizeSaudiMobile(raw) {
  let digits = toLatinDigits(raw).replace(/\D/g, '');
  digits = digits.replace(/^0+/, ''); // 05..., 00966...
  if (digits.startsWith('966') && digits.length > 3) digits = digits.slice(3).replace(/^0+/, '');
  return digits.slice(0, 9);
}

export const isValidSaudiMobile = (number) => /^5\d{8}$/.test(number);
