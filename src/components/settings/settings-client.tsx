'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserProfile } from '@/types';
import { updateUserSettings, deleteAccount } from '@/app/(dashboard)/settings/actions';
import { signOutUser } from '@/lib/firebase/auth';
import { 
  User, 
  MessageCircle, 
  AlertTriangle, 
  LogOut, 
  Globe, 
  Clock, 
  Sparkles, 
  Loader2, 
  Save, 
  Languages, 
  Settings 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/i18n/config';

interface SettingsClientProps {
  userProfile: UserProfile & { [key: string]: any };
}

const COMMON_TIMEZONES = [
  { value: 'Europe/Madrid', label: 'España / Madrid (CET/CEST)' },
  { value: 'Europe/Canary', label: 'España / Islas Canarias (WET/WEST)' },
  { value: 'Europe/London', label: 'Londres (GMT/BST)' },
  { value: 'America/New_York', label: 'Nueva York / Miami (EST/EDT)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
  { value: 'America/Bogota', label: 'Colombia / Bogotá (COT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina / Buenos Aires (ART)' },
  { value: 'America/Santiago', label: 'Chile / Santiago (CLT)' },
];

export function SettingsClient({ userProfile }: SettingsClientProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useTranslation();
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [timezone, setTimezone] = useState(userProfile.timezone || 'Europe/Madrid');
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>((userProfile.locale as SupportedLocale) || locale);
  const [sendTimeStart, setSendTimeStart] = useState(userProfile.defaultSendTimeStart || '09:30');
  const [sendTimeEnd, setSendTimeEnd] = useState(userProfile.defaultSendTimeEnd || '11:45');
  const [aiTone, setAiTone] = useState(userProfile.defaultAiTone || 'casual');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLanguageChange = (code: SupportedLocale) => {
    setSelectedLocale(code);
    setLocale(code); // Instant preview
  };

  const handleSaveSettings = async () => {
    if (!displayName.trim()) {
      toast.error(t('settings.nameEmptyError'));
      return;
    }
    
    setIsSaving(true);
    const res = await updateUserSettings({
      displayName: displayName.trim(),
      timezone,
      locale: selectedLocale,
      defaultSendTimeStart: sendTimeStart,
      defaultSendTimeEnd: sendTimeEnd,
      defaultAiTone: aiTone,
    });

    if (res.success) {
      setLocale(selectedLocale);
      toast.success(t('settings.savedSuccess'));
      router.refresh();
    } else {
      toast.error(res.error || t('common.error'));
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('settings.deleteConfirm'))) {
      return;
    }
    
    setIsDeleting(true);
    const res = await deleteAccount();
    if (res.success) {
      toast.success(t('common.success'));
      await signOutUser();
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/login');
    } else {
      toast.error(res.error || t('common.error'));
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast.success(t('header.logoutSuccess'));
      router.push('/login');
    } catch (error) {
      toast.error(t('header.logoutError'));
    }
  };

  const wsStatus = userProfile.whatsappInstance?.status || 'disconnected';

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      {/* 0. Cabecera Dinámica de Ajustes */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
          <p className="text-slate-500 text-sm">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* 1. Perfil y Cuenta */}
      <div className="bg-white/70 backdrop-blur rounded-3xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 text-violet-700 rounded-2xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('settings.account')}</h2>
              <p className="text-xs text-slate-500">{t('settings.accountSubtitle')}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">{t('settings.nameLabel')}</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">{t('settings.emailLabel')}</label>
              <input 
                type="text" 
                value={userProfile.email} 
                readOnly 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Idioma de la Aplicación */}
      <div className="bg-white/70 backdrop-blur rounded-3xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('settings.language')}</h2>
              <p className="text-xs text-slate-500">{t('settings.languageDesc')}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(SUPPORTED_LOCALES).map((loc) => {
              const isSelected = selectedLocale === loc.code;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleLanguageChange(loc.code)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center group cursor-pointer",
                    isSelected
                      ? "border-violet-600 bg-violet-50/80 text-violet-950 shadow-sm ring-2 ring-violet-200"
                      : "border-slate-200 bg-white/60 hover:bg-white text-slate-700 hover:border-slate-300"
                  )}
                >
                  <span className="text-3xl mb-1.5 transform group-hover:scale-110 transition-transform">{loc.flag}</span>
                  <span className="text-sm font-bold">{loc.nativeName}</span>
                  <span className="text-[11px] text-slate-400">{loc.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 flex justify-end border-t border-slate-100">
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('settings.saveButton')}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Preferencias de Automatización */}
      <div className="bg-white/70 backdrop-blur rounded-3xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100/80 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('settings.automationTitle')}</h2>
            <p className="text-xs text-slate-500">{t('settings.automationSubtitle')}</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">{t('settings.timezone')}</label>
            <select 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{t('settings.scanNotice')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {t('settings.windowLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={sendTimeStart}
                  onChange={(e) => setSendTimeStart(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="time" 
                  value={sendTimeEnd}
                  onChange={(e) => setSendTimeEnd(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                {t('settings.aiToneLabel')}
              </label>
              <select 
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="casual">{t('settings.toneCasual')}</option>
                <option value="divertido">{t('settings.toneFunny')}</option>
                <option value="emotivo">{t('settings.toneEmotional')}</option>
                <option value="formal">{t('settings.toneFormal')}</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('settings.saveButton')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Conexión de WhatsApp */}
      <div className="bg-white/70 backdrop-blur rounded-3xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100/80 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('settings.whatsappCardTitle')}</h2>
            <p className="text-xs text-slate-500">{t('settings.whatsappCardSubtitle')}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${
                  wsStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 
                  wsStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="font-bold text-slate-900 text-sm">
                  {wsStatus === 'connected' ? t('settings.whatsappConnected') : 
                   wsStatus === 'connecting' ? t('settings.whatsappConnecting') : t('settings.whatsappDisconnected')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {userProfile.whatsappInstance?.instanceName || t('settings.noInstance')}
                {userProfile.whatsappInstance?.phoneNumber && ` • +${userProfile.whatsappInstance.phoneNumber}`}
              </p>
            </div>
            <Link 
              href="/whatsapp" 
              className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-xs font-bold"
            >
              {t('settings.whatsappManage')}
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Información & Cerrar Sesión */}
      <div className="flex items-center justify-between pt-2">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-xs shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          {t('settings.logoutButton')}
        </button>

        <span className="text-xs text-slate-400 font-medium">
          {t('settings.versionFooter')}
        </span>
      </div>

      {/* 6. Zona Peligrosa */}
      <div className="bg-red-50/60 backdrop-blur rounded-3xl border border-red-200 shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-red-100 flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-900">{t('settings.dangerZone')}</h2>
            <p className="text-xs text-red-700">{t('settings.dangerZoneSubtitle')}</p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-xs text-red-700 mb-4">
            {t('settings.dangerZoneWarning')}
          </p>
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? t('settings.deletingAccount') : t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
