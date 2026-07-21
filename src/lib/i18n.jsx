import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'lang';
const DEFAULT_LANG = 'ar';

export const translations = {
  ar: {
    // Language switcher
    switchTo: 'English',

    // Login
    login_title: 'منصة كريم التعليمية',
    login_subtitle: 'اكتب رقم موبايلك المسجل عندنا عشان تدخل',
    login_phonePlaceholder: 'رقم الموبايل',
    login_notRegistered: 'الرقم ده مش مسجل عندنا. لازم تسجل حساب جديد الأول.',
    login_notApproved: 'حسابك لسه محتاج موافقة المعلم. استنى شوية وحاول تاني.',
    login_registerLink: 'سجّل حساب جديد',
    login_submit: 'دخول',
    login_checking: 'جاري التحقق...',
    login_noAccount: 'لسه معملتش حساب؟',
    login_registerHere: 'سجّل من هنا',

    // Register
    register_title: 'تسجيل حساب جديد',
    register_subtitle: 'املأ بياناتك عشان تقدر تدخل المنصة',
    register_fullNamePlaceholder: 'الاسم بالكامل',
    register_phonePlaceholder: 'رقم موبايلك',
    register_parentPhonePlaceholder: 'رقم موبايل ولي الأمر',
    register_gradePlaceholder: 'الصف الدراسي',
    register_exists: 'الرقم ده مسجل بالفعل، سجل دخول من صفحة الدخول مباشرة',
    register_error: 'حصل خطأ أثناء التسجيل، حاول تاني',
    register_success: 'تم التسجيل بنجاح! دلوقتي سجل دخول برقمك',
    register_submit: 'سجّل حساب',
    register_loading: 'جاري التسجيل...',
    register_haveAccount: 'عندك حساب بالفعل؟',
    register_loginHere: 'سجل دخول من هنا',

    // Lessons
    lessons_welcome: 'أهلاً',
    lessons_section: 'الدروس',
    lessons_watchVideo: '▶ شاهد الفيديو',
    lessons_attachment: '📎 ملحق',
    lessons_examsSection: 'الامتحانات المتاحة',
    lessons_duration: 'المدة',
    lessons_minutes: 'دقيقة',
    lessons_startExam: 'ابدأ الامتحان',

    // Exam
    exam_loading: 'جاري تحميل الامتحان...',
    exam_timeLeft: '⏱ الوقت المتبقي',
    exam_submit: 'سلّم الامتحان',
    exam_submitting: 'جاري التسليم...',
    exam_true: 'صح',
    exam_false: 'خطأ',

    // Result
    result_grading: 'جاري تصحيح الامتحان...',
    result_title: 'نتيجتك',
    result_sentToParent: 'تم إرسال النتيجة لولي الأمر تلقائيًا 📩',
    result_error: 'حصل خطأ في تحميل النتيجة، جرب تاني',
    result_backToLessons: 'الرجوع للدروس',
  },

  en: {
    // Language switcher
    switchTo: 'العربية',

    // Login
    login_title: 'Karim Educational Platform',
    login_subtitle: 'Enter your registered phone number to log in',
    login_phonePlaceholder: 'Phone number',
    login_notRegistered: 'This number is not registered. You need to create an account first.',
    login_notApproved: 'Your account is still pending teacher approval. Please try again later.',
    login_registerLink: 'Create an account',
    login_submit: 'Log in',
    login_checking: 'Verifying...',
    login_noAccount: "Don't have an account?",
    login_registerHere: 'Register here',

    // Register
    register_title: 'Create a new account',
    register_subtitle: 'Fill in your details to access the platform',
    register_fullNamePlaceholder: 'Full name',
    register_phonePlaceholder: 'Your phone number',
    register_parentPhonePlaceholder: "Parent's phone number",
    register_gradePlaceholder: 'Grade level',
    register_exists: 'This number is already registered. Log in from the login page',
    register_error: 'An error occurred during registration. Please try again',
    register_success: 'Registration successful! Now log in with your number',
    register_submit: 'Register',
    register_loading: 'Registering...',
    register_haveAccount: 'Already have an account?',
    register_loginHere: 'Log in here',

    // Lessons
    lessons_welcome: 'Welcome',
    lessons_section: 'Lessons',
    lessons_watchVideo: '▶ Watch video',
    lessons_attachment: '📎 Attachment',
    lessons_examsSection: 'Available exams',
    lessons_duration: 'Duration',
    lessons_minutes: 'min',
    lessons_startExam: 'Start exam',

    // Exam
    exam_loading: 'Loading exam...',
    exam_timeLeft: '⏱ Time left',
    exam_submit: 'Submit exam',
    exam_submitting: 'Submitting...',
    exam_true: 'True',
    exam_false: 'False',

    // Result
    result_grading: 'Grading your exam...',
    result_title: 'Your result',
    result_sentToParent: 'The result has been sent to your parent automatically 📩',
    result_error: 'An error occurred while loading the result. Please try again',
    result_backToLessons: 'Back to lessons',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && translations[stored] ? stored : DEFAULT_LANG;
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const changeLang = useCallback((newLang) => {
    if (translations[newLang]) setLang(newLang);
  }, []);

  const t = useCallback(
    (key) => {
      const dict = translations[lang] || {};
      return dict[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, dir }}>
      <div dir={dir}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
