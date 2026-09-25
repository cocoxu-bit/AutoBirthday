'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Cake, 
  Calendar, 
  CheckCircle2, 
  Heart, 
  Phone, 
  Sparkles, 
  User, 
  ArrowRight,
  PartyPopper
} from 'lucide-react';
import { submitPublicBirthdayAction } from '@/app/u/[username]/actions';
import { recordPageConversionAction } from '@/lib/analytics/traffic-actions';
import { toast } from 'sonner';

interface BirthdayCollectorFormProps {
  host: {
    displayName: string;
    photoURL?: string | null;
    username: string;
  };
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function BirthdayCollectorForm({ host }: BirthdayCollectorFormProps) {
  const [name, setName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+34');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDay, setBirthDay] = useState<number | ''>('');
  const [birthMonth, setBirthMonth] = useState<number | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [honeypot, setHoneypot] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [updatedExisting, setUpdatedExisting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Por favor, dinos tu nombre');
      return;
    }

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 7) {
      toast.error('Introduce un número de teléfono o WhatsApp válido');
      return;
    }

    if (!birthDay || !birthMonth) {
      toast.error('Selecciona el día y mes de tu cumpleaños');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${phonePrefix.replace(/\D/g, '')}${cleanNum}`;
      const res = await submitPublicBirthdayAction({
        username: host.username,
        name: name.trim(),
        phone: fullPhone,
        birthDay: Number(birthDay),
        birthMonth: Number(birthMonth),
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
        honeypot: honeypot || undefined,
      });

      if (res.success) {
        setUpdatedExisting(Boolean(res.updatedExisting));
        setIsSuccess(true);
        if (typeof window !== 'undefined') {
          recordPageConversionAction(window.location.pathname, 'birthday_submitted').catch(() => {});
        }
      } else {
        toast.error(res.error || 'No se pudo guardar la fecha');
      }
    } catch {
      toast.error('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN WITH PRODUCT-LED VIRAL LOOP
  if (isSuccess) {
    const formattedBday = `${birthDay} de ${MONTHS[Number(birthMonth) - 1]}`;

    return (
      <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6 text-center relative overflow-hidden">
          
          {/* Confetti celebration top accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-500 via-rose-500 to-amber-500" />

          {/* Celebratory Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/25 animate-bounce-slow">
            <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {updatedExisting ? '¡Fecha actualizada!' : '¡Cumpleaños guardado! 🎉'}
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              <span className="font-bold text-slate-900">{host.displayName}</span> ya tiene tu fecha registrada (<span className="font-bold text-violet-700">{formattedBday}</span>). ¡No se le escapará tu felicitación!
            </p>
          </div>

          {/* VIRAL CTA BOX (Product-Led Growth Loop) */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1f4742] text-white rounded-3xl shadow-md space-y-4 text-left border border-slate-700/60 relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>¿Y a ti? ¿Se te olvidan los cumpleaños?</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">
                Automatiza tus felicitaciones por WhatsApp con IA
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Crea tu propio AutoBirthday gratis, sincroniza tus contactos en 30 segundos y deja que un bot redacte felicitaciones divertidas y emotivas por ti.
              </p>
            </div>

            <Link
              href={`/register?ref=${encodeURIComponent(host.username)}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-[0.98]"
            >
              <span>Crear mi AutoBirthday Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] text-center text-slate-400">
              100% gratuito · Sin descargas · Vinculación directa con WhatsApp
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Modificar mi fecha o añadir a otra persona
          </button>
        </div>
      </div>
    );
  }

  // PUBLIC FORM
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        
        {/* HOST HEADER */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            {host.photoURL ? (
              <img
                src={host.photoURL}
                alt={host.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover shadow-md ring-4 ring-white border border-slate-200 mx-auto"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-rose-500 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-md ring-4 ring-white mx-auto">
                {host.displayName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-sm">
              <Cake className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              ¿Cuándo es tu cumpleaños, amigo de {host.displayName}? 🎂
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Apunta tu fecha para que {host.displayName} no se olvide de felicitarte como te mereces este año.
            </p>
          </div>
        </div>

        {/* THE FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Honeypot field (hidden for bots) */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* 1. Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-600" />
              <span>Tu Nombre o Apodo *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Carlos, Dani, Marta..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          {/* 2. Phone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tu WhatsApp *</span>
              <span className="text-[10px] text-slate-400 font-normal">(para que te llegue el mensaje)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shrink-0"
              >
                <option value="+34">🇪🇸 +34</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+56">🇨🇱 +56</option>
                <option value="+1">🇺🇸/🇨🇦 +1</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+39">🇮🇹 +39</option>
              </select>
              <input
                type="tel"
                required
                placeholder="600 000 000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* 3. Birthday: Day, Month, Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Fecha de Cumpleaños *</span>
            </label>
            <div className="grid grid-cols-12 gap-2">
              {/* Day */}
              <div className="col-span-4">
                <select
                  required
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">Día</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="col-span-5">
                <select
                  required
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">Mes</option>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year (optional) */}
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Año"
                  min="1920"
                  max={new Date().getFullYear()}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-center"
                  title="Opcional: Si quieres que calcule tu edad"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">El año es opcional. Solo el día y el mes son necesarios.</p>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span>Guardando fecha...</span>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>Guardar mi cumpleaños</span>
              </>
            )}
          </button>
        </form>

        {/* FOOTER BADGE */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>Powered by</span>
            <span className="text-slate-700 font-black">AutoBirthday</span>
            <span>🎂</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
