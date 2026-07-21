import { useLanguage } from '../lib/i18n.jsx';

export default function LanguageSwitcher() {
  const { lang, changeLang, t } = useLanguage();

  return (
    <button
      className="lang-switcher"
      onClick={() => changeLang(lang === 'ar' ? 'en' : 'ar')}
      aria-label="Switch language"
    >
      {t('switchTo')}
    </button>
  );
}
