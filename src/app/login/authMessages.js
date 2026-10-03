// Backend auth messages (English, see backend routes/auth.js and utils/limiters.js) mapped to localized text.
// Used by the login, signup and forgot-password pages. Unknown messages fall back to a generic localized text.
const MESSAGES = [
  [/invalid email or password/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'Invalid email or password.'],
  [/invalid phone number or password/i, 'رقم الجوال أو كلمة المرور غير صحيحة.', 'Invalid phone number or password.'],
  [/verify your email/i, 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من بريدك الوارد.', 'Please verify your email first. Check your inbox.'],
  [/valid email|email is required/i, 'يرجى إدخال بريد إلكتروني صحيح.', 'Please enter a valid email address.'],
  [/password is required/i, 'يرجى إدخال كلمة المرور.', 'Please enter your password.'],
  [/password must be/i, 'يجب أن تتكون كلمة المرور من ٦ أحرف على الأقل.', 'Password must be at least 6 characters.'],
  [/full name is required/i, 'يرجى إدخال الاسم الكامل.', 'Please enter your full name.'],
  [/disposable email/i, 'البريد الإلكتروني المؤقت غير مسموح به. استخدم بريداً دائماً.', 'Temporary email addresses are not allowed. Please use a permanent email.'],
  [/email is already registered|already exists with this email/i, 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.', 'This email is already registered. Please log in instead.'],
  [/phone.*already registered/i, 'رقم الجوال مسجل بالفعل. يرجى تسجيل الدخول.', 'This phone number is already registered. Please log in.'],
  [/only saudi|saudi number|phone number is required/i, 'أدخل رقم جوال سعودي صحيح يبدأ بـ ٥ (٩ أرقام).', 'Enter a valid Saudi mobile number starting with 5 (9 digits).'],
  [/already uses password login/i, 'هذا البريد مسجل بكلمة مرور. سجّل الدخول بالبريد الإلكتروني وكلمة المرور.', 'This email already uses password login. Sign in with your email and password.'],
  [/staff login/i, 'هذا حساب موظف. استخدم بوابة الموظفين لتسجيل الدخول.', 'This is a staff account. Please use the staff login.'],
  [/google email is not verified/i, 'بريد Google غير مؤكد. استخدم حساب Google ببريد مؤكد.', 'Your Google email is not verified. Use a Google account with a verified email.'],
  [/google/i, 'تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.', 'Google sign-in failed. Please try again.'],
  [/invalid or expired (reset )?code/i, 'الرمز غير صحيح أو منتهي الصلاحية.', 'The code is invalid or has expired.'],
  [/could not send the verification code/i, 'تعذر إرسال رمز التحقق. حاول مرة أخرى.', 'Could not send the verification code. Please try again.'],
  [/too many/i, 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.', 'Too many attempts. Please wait a few minutes and try again.'],
  [/account unavailable/i, 'هذا الحساب غير متاح. تواصل معنا للمساعدة.', 'This account is unavailable. Please contact us for help.'],
  [/service starting|database is not ready/i, 'الخادم قيد التشغيل. حاول مرة أخرى بعد لحظات.', 'The server is starting up. Please try again in a moment.'],
];

const NETWORK = ['تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.', 'Could not reach the server. Check your connection and try again.'];

// err: an axios error (or anything); fallback: [arabic, english] used when the message is unknown
export function authErrorMessage(err, language, fallback = ['حدث خطأ. يرجى المحاولة مرة أخرى.', 'Something went wrong. Please try again.']) {
  const pick = (pair) => (language === 'ar' ? pair[0] : pair[1]);
  if (err && err.isAxiosError && !err.response) return pick(NETWORK);
  const msg = String(err?.response?.data?.message || err?.response?.data?.error || err?.message || '');
  for (const [re, ar, en] of MESSAGES) {
    if (re.test(msg)) return language === 'ar' ? ar : en;
  }
  return pick(fallback);
}
