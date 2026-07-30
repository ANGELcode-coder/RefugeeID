import React, { useEffect } from 'react';
import { WalletLayout } from '@/components/WalletLayout';
import { useAuth } from '@/lib/auth';
import { useWalletPrefs, FontSize } from '@/lib/wallet-prefs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { ArrowLeft, Moon, Sun, Type, Globe, LogOut, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate: { TranslateElement: new (opts: object, el: string) => void } };
  }
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'so', label: 'Soomaali' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'ti', label: 'ትግርኛ' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'فارسی' },
  { code: 'ur', label: 'اردو' },
  { code: 'es', label: 'Español' },
];

const FONT_OPTIONS: { value: FontSize; label: string; preview: string }[] = [
  { value: 'normal', label: 'Normal', preview: 'Aa' },
  { value: 'large', label: 'Large', preview: 'Aa' },
  { value: 'xlarge', label: 'Extra Large', preview: 'Aa' },
];

export default function WalletSettings() {
  const { signOut } = useAuth();
  const { darkMode, setDarkMode, fontSize, setFontSize, language, setLanguage } = useWalletPrefs();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        new window.google!.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );
      };
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    }
  }, []);

  const handleLanguage = (code: string) => {
    setLanguage(code);
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectEl) {
      selectEl.value = code;
      selectEl.dispatchEvent(new Event('change'));
    }
  };

  const handleEraseData = async () => {
    if (!confirm('This will remove all your credentials from this wallet. You will need your claim code to restore them. Continue?')) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { error } = await supabase
        .from('issued_credentials')
        .update({ subject_user_id: null, claimed_at: null })
        .eq('subject_user_id', user.id);
      if (error) throw error;
      toast({ title: 'Wallet erased', description: 'All credentials removed from this wallet.' });
      await signOut();
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <WalletLayout>
      <header className="bg-white dark:bg-slate-900 px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <Link href="/wallet">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-24">

        {/* Appearance */}
        <section className="px-4 pt-6 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">Appearance</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {/* Dark mode */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-slate-500 dark:text-slate-300" /> : <Sun className="h-5 w-5 text-slate-500" />}
                <div>
                  <Label className="font-medium text-slate-900 dark:text-slate-100 text-sm">Dark Mode</Label>
                  <p className="text-xs text-slate-500">{darkMode ? 'On' : 'Off'}</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            {/* Font size */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Type className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                <Label className="font-medium text-slate-900 dark:text-slate-100 text-sm">Text Size</Label>
              </div>
              <div className="flex gap-2">
                {FONT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-colors ${
                      fontSize === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className={`font-bold leading-none mb-1 ${opt.value === 'normal' ? 'text-base' : opt.value === 'large' ? 'text-lg' : 'text-2xl'}`}>
                      {opt.preview}
                    </span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">Language</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">Select Language</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguage(lang.code)}
                  className={`px-3 py-2 rounded-xl text-sm text-left transition-colors border ${
                    language === lang.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                      : 'border-transparent bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            {/* Hidden Google Translate widget */}
            <div id="google_translate_element" className="hidden" />
          </div>
        </section>

        {/* Account */}
        <section className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">Account</p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-t-2xl"
            >
              <LogOut className="h-5 w-5 text-slate-500" />
              <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">Log Out</span>
            </button>
            <button
              onClick={handleEraseData}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 dark:hover:bg-red-950 transition-colors rounded-b-2xl"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <span className="font-medium text-red-600 text-sm block">Erase All Wallet Data</span>
                <span className="text-xs text-slate-500">Removes all credentials from this wallet</span>
              </div>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400 mt-6 px-4">
          RefugeeID Wallet — W3C Verifiable Credentials
        </p>
      </div>
    </WalletLayout>
  );
}
