import { useEffect, useMemo, useState } from "react";

export const TIKPAY_LOCALES = ["es", "en", "fr", "it"] as const;
export type TikPayLocale = (typeof TIKPAY_LOCALES)[number];

const STORAGE_KEY = "tikpay:locale:v1";
const LOCALE_EVENT = "tikpay:locale-change";

const es = {
  "locale.es": "ES",
  "locale.en": "EN",
  "locale.fr": "FR",
  "locale.it": "IT",
  "common.terms": "Términos de Uso",
  "common.loading": "Cargando...",
  "common.retry": "Intentar de nuevo",
  "login.tagline": "Tu progreso, siempre contigo",
  "login.badge": "Acceso de miembros",
  "login.title": "Inicia sesión",
  "login.subtitle": "Continúa exactamente donde lo dejaste y conserva tus recompensas.",
  "login.email": "Correo electrónico",
  "login.emailPlaceholder": "tu@email.com",
  "login.password": "Contraseña",
  "login.passwordPlaceholder": "Tu contraseña",
  "login.showPassword": "Mostrar contraseña",
  "login.hidePassword": "Ocultar contraseña",
  "login.submit": "ENTRAR",
  "login.submitting": "Entrando...",
  "login.noAccount": "¿Todavía no tienes una cuenta?",
  "login.createAccount": "CREAR MI CUENTA",
  "login.termsPrefix": "Al acceder continúas sujeto a nuestros",
  "signup.tagline": "Crea tu acceso privado",
  "signup.badge": "Registro inmediato",
  "signup.title": "Crea tu cuenta",
  "signup.subtitle": "Guarda tu saldo y tu progreso diario. No necesitas confirmar tu correo.",
  "signup.benefitImmediate": "Acceso inmediato después del registro",
  "signup.benefitSaved": "Progreso guardado en tu cuenta",
  "signup.name": "Nombre",
  "signup.namePlaceholder": "Tu nombre",
  "signup.email": "Correo electrónico",
  "signup.password": "Contraseña",
  "signup.passwordPlaceholder": "Mínimo 6 caracteres",
  "signup.termsBefore": "He leído y acepto los",
  "signup.termsAfter": ", incluyendo las condiciones del ciclo de 30 días y la caducidad de recompensas pendientes.",
  "signup.termsError": "Debes aceptar los Términos de Uso para crear tu cuenta.",
  "signup.submit": "CREAR CUENTA Y ENTRAR",
  "signup.submitting": "Creando tu cuenta...",
  "signup.haveAccount": "¿Ya tienes una cuenta?",
  "signup.signIn": "Inicia sesión",
  "signup.genericError": "No se pudo crear tu cuenta.",
  "layout.activeAccess": "ACCESO ACTIVO",
  "layout.hello": "Hola, {name}",
  "layout.exclusive": "Área exclusiva para miembros",
  "layout.balance": "Tu saldo",
  "layout.memberArea": "Área de miembros",
  "layout.memberSubtitle": "Tu progreso y tus recompensas quedan guardados en tu cuenta.",
  "layout.dayOf30": "Día {day} de 30",
  "layout.completedDays": "{count} días completados",
  "nav.home": "Inicio",
  "nav.community": "Comunidad",
  "nav.support": "Soporte",
  "nav.profile": "Perfil",
  "motion.kicker": "Tu rutina diaria",
  "motion.title": "Mira vídeos y completa tu recompensa",
  "motion.subtitle": "3 vídeos al día · progreso guardado automáticamente",
  "members.loading": "Cargando tu progreso...",
  "members.error": "No se pudo actualizar tu progreso.",
  "members.planToday": "Tu plan de hoy",
  "members.day": "Día {day}",
  "members.planSubtitle": "Completa los 3 vídeos de hoy y desbloquea tu recompensa.",
  "members.progressToday": "Progreso de hoy",
  "members.videosCount": "{count} / 3 vídeos",
  "members.reward": "Recompensa",
  "members.batchCompleted": "Lote completado",
  "members.startFirst": "Empieza por el primer vídeo",
  "members.remainingOne": "Te falta 1 vídeo",
  "members.remainingMany": "Te faltan {count} vídeos",
  "members.planCompleted": "Plan completado",
  "members.nextBatch": "Próximo lote",
  "members.batchAvailable": "Lote disponible",
  "members.days30Completed": "30 días completados",
  "members.unlocksIn": "Se libera en {time}",
  "members.availableNow": "Disponible ahora",
  "members.watchVideos": "Ver vídeos",
  "members.totalProgress": "Progreso total",
  "members.ofThree": "{count} de 3",
  "members.ofThirty": "{count} de 30",
  "members.progress30": "Tu progreso de 30 días",
  "members.progress30Subtitle": "Los próximos días permanecen bloqueados hasta completar el lote anterior y esperar 24 horas.",
  "members.daysCompleted": "{count} días completados",
  "members.rewardsDay": "Recompensas — Día {day}",
  "members.pendingOne": "1 vídeo pendiente",
  "members.pendingMany": "{count} vídeos pendientes",
  "members.moduleDescription": "Abre el feed, mira los vídeos y completa el lote de hoy.",
  "members.dailyPlanCompleted": "Plan diario completado",
  "members.nextBatchLocked": "Próximo lote bloqueado",
  "members.planDoneDescription": "Ya completaste todo el recorrido de 30 días.",
  "members.lockedDescription": "Se abrirá automáticamente cuando termine el período de 24 horas."
} as const;

type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  "locale.es": "ES",
  "locale.en": "EN",
  "locale.fr": "FR",
  "locale.it": "IT",
  "common.terms": "Terms of Use",
  "common.loading": "Loading...",
  "common.retry": "Try again",
  "login.tagline": "Your progress, always with you",
  "login.badge": "Member access",
  "login.title": "Sign in",
  "login.subtitle": "Continue exactly where you left off and keep your rewards.",
  "login.email": "Email address",
  "login.emailPlaceholder": "you@email.com",
  "login.password": "Password",
  "login.passwordPlaceholder": "Your password",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",
  "login.submit": "SIGN IN",
  "login.submitting": "Signing in...",
  "login.noAccount": "Don't have an account yet?",
  "login.createAccount": "CREATE MY ACCOUNT",
  "login.termsPrefix": "By signing in, you remain subject to our",
  "signup.tagline": "Create your private access",
  "signup.badge": "Instant registration",
  "signup.title": "Create your account",
  "signup.subtitle": "Keep your balance and daily progress saved. No email confirmation required.",
  "signup.benefitImmediate": "Instant access after registration",
  "signup.benefitSaved": "Progress saved to your account",
  "signup.name": "Name",
  "signup.namePlaceholder": "Your name",
  "signup.email": "Email address",
  "signup.password": "Password",
  "signup.passwordPlaceholder": "At least 6 characters",
  "signup.termsBefore": "I have read and accept the",
  "signup.termsAfter": ", including the 30-day cycle conditions and expiry of pending rewards.",
  "signup.termsError": "You must accept the Terms of Use to create your account.",
  "signup.submit": "CREATE ACCOUNT & SIGN IN",
  "signup.submitting": "Creating your account...",
  "signup.haveAccount": "Already have an account?",
  "signup.signIn": "Sign in",
  "signup.genericError": "We couldn't create your account.",
  "layout.activeAccess": "ACCESS ACTIVE",
  "layout.hello": "Hi, {name}",
  "layout.exclusive": "Members-only area",
  "layout.balance": "Your balance",
  "layout.memberArea": "Member area",
  "layout.memberSubtitle": "Your progress and rewards are saved to your account.",
  "layout.dayOf30": "Day {day} of 30",
  "layout.completedDays": "{count} days completed",
  "nav.home": "Home",
  "nav.community": "Community",
  "nav.support": "Support",
  "nav.profile": "Profile",
  "motion.kicker": "Your daily routine",
  "motion.title": "Watch videos and complete your reward",
  "motion.subtitle": "3 videos a day · progress saved automatically",
  "members.loading": "Loading your progress...",
  "members.error": "We couldn't update your progress.",
  "members.planToday": "Your plan for today",
  "members.day": "Day {day}",
  "members.planSubtitle": "Complete today's 3 videos and unlock your reward.",
  "members.progressToday": "Today's progress",
  "members.videosCount": "{count} / 3 videos",
  "members.reward": "Reward",
  "members.batchCompleted": "Batch completed",
  "members.startFirst": "Start with the first video",
  "members.remainingOne": "1 video left",
  "members.remainingMany": "{count} videos left",
  "members.planCompleted": "Plan completed",
  "members.nextBatch": "Next batch",
  "members.batchAvailable": "Batch available",
  "members.days30Completed": "30 days completed",
  "members.unlocksIn": "Unlocks in {time}",
  "members.availableNow": "Available now",
  "members.watchVideos": "Watch videos",
  "members.totalProgress": "Total progress",
  "members.ofThree": "{count} of 3",
  "members.ofThirty": "{count} of 30",
  "members.progress30": "Your 30-day progress",
  "members.progress30Subtitle": "Upcoming days stay locked until you complete the previous batch and wait 24 hours.",
  "members.daysCompleted": "{count} days completed",
  "members.rewardsDay": "Rewards — Day {day}",
  "members.pendingOne": "1 video pending",
  "members.pendingMany": "{count} videos pending",
  "members.moduleDescription": "Open the feed, watch the videos and complete today's batch.",
  "members.dailyPlanCompleted": "Daily plan completed",
  "members.nextBatchLocked": "Next batch locked",
  "members.planDoneDescription": "You've completed the full 30-day journey.",
  "members.lockedDescription": "It will unlock automatically when the 24-hour period ends."
};

const fr: Record<TranslationKey, string> = {
  "locale.es": "ES",
  "locale.en": "EN",
  "locale.fr": "FR",
  "locale.it": "IT",
  "common.terms": "Conditions d'utilisation",
  "common.loading": "Chargement...",
  "common.retry": "Réessayer",
  "login.tagline": "Votre progression, toujours avec vous",
  "login.badge": "Accès membre",
  "login.title": "Connectez-vous",
  "login.subtitle": "Reprenez exactement là où vous vous êtes arrêté et conservez vos récompenses.",
  "login.email": "Adresse e-mail",
  "login.emailPlaceholder": "vous@email.com",
  "login.password": "Mot de passe",
  "login.passwordPlaceholder": "Votre mot de passe",
  "login.showPassword": "Afficher le mot de passe",
  "login.hidePassword": "Masquer le mot de passe",
  "login.submit": "SE CONNECTER",
  "login.submitting": "Connexion...",
  "login.noAccount": "Vous n'avez pas encore de compte ?",
  "login.createAccount": "CRÉER MON COMPTE",
  "login.termsPrefix": "En vous connectant, vous restez soumis à nos",
  "signup.tagline": "Créez votre accès privé",
  "signup.badge": "Inscription immédiate",
  "signup.title": "Créez votre compte",
  "signup.subtitle": "Conservez votre solde et votre progression quotidienne. Aucune confirmation par e-mail n'est requise.",
  "signup.benefitImmediate": "Accès immédiat après l'inscription",
  "signup.benefitSaved": "Progression enregistrée sur votre compte",
  "signup.name": "Nom",
  "signup.namePlaceholder": "Votre nom",
  "signup.email": "Adresse e-mail",
  "signup.password": "Mot de passe",
  "signup.passwordPlaceholder": "6 caractères minimum",
  "signup.termsBefore": "J'ai lu et j'accepte les",
  "signup.termsAfter": ", y compris les conditions du cycle de 30 jours et l'expiration des récompenses en attente.",
  "signup.termsError": "Vous devez accepter les Conditions d'utilisation pour créer votre compte.",
  "signup.submit": "CRÉER LE COMPTE ET ENTRER",
  "signup.submitting": "Création de votre compte...",
  "signup.haveAccount": "Vous avez déjà un compte ?",
  "signup.signIn": "Se connecter",
  "signup.genericError": "Impossible de créer votre compte.",
  "layout.activeAccess": "ACCÈS ACTIF",
  "layout.hello": "Bonjour, {name}",
  "layout.exclusive": "Espace réservé aux membres",
  "layout.balance": "Votre solde",
  "layout.memberArea": "Espace membre",
  "layout.memberSubtitle": "Votre progression et vos récompenses sont enregistrées sur votre compte.",
  "layout.dayOf30": "Jour {day} sur 30",
  "layout.completedDays": "{count} jours terminés",
  "nav.home": "Accueil",
  "nav.community": "Communauté",
  "nav.support": "Assistance",
  "nav.profile": "Profil",
  "motion.kicker": "Votre routine quotidienne",
  "motion.title": "Regardez des vidéos et complétez votre récompense",
  "motion.subtitle": "3 vidéos par jour · progression enregistrée automatiquement",
  "members.loading": "Chargement de votre progression...",
  "members.error": "Impossible de mettre à jour votre progression.",
  "members.planToday": "Votre programme du jour",
  "members.day": "Jour {day}",
  "members.planSubtitle": "Regardez les 3 vidéos du jour et débloquez votre récompense.",
  "members.progressToday": "Progression du jour",
  "members.videosCount": "{count} / 3 vidéos",
  "members.reward": "Récompense",
  "members.batchCompleted": "Lot terminé",
  "members.startFirst": "Commencez par la première vidéo",
  "members.remainingOne": "Il vous reste 1 vidéo",
  "members.remainingMany": "Il vous reste {count} vidéos",
  "members.planCompleted": "Programme terminé",
  "members.nextBatch": "Prochain lot",
  "members.batchAvailable": "Lot disponible",
  "members.days30Completed": "30 jours terminés",
  "members.unlocksIn": "Disponible dans {time}",
  "members.availableNow": "Disponible maintenant",
  "members.watchVideos": "Voir les vidéos",
  "members.totalProgress": "Progression totale",
  "members.ofThree": "{count} sur 3",
  "members.ofThirty": "{count} sur 30",
  "members.progress30": "Votre progression sur 30 jours",
  "members.progress30Subtitle": "Les prochains jours restent verrouillés jusqu'à la fin du lot précédent et après 24 heures d'attente.",
  "members.daysCompleted": "{count} jours terminés",
  "members.rewardsDay": "Récompenses — Jour {day}",
  "members.pendingOne": "1 vidéo en attente",
  "members.pendingMany": "{count} vidéos en attente",
  "members.moduleDescription": "Ouvrez le fil, regardez les vidéos et terminez le lot du jour.",
  "members.dailyPlanCompleted": "Programme quotidien terminé",
  "members.nextBatchLocked": "Prochain lot verrouillé",
  "members.planDoneDescription": "Vous avez terminé l'intégralité du parcours de 30 jours.",
  "members.lockedDescription": "Il se débloquera automatiquement à la fin de la période de 24 heures."
};

const it: Record<TranslationKey, string> = {
  "locale.es": "ES",
  "locale.en": "EN",
  "locale.fr": "FR",
  "locale.it": "IT",
  "common.terms": "Termini di utilizzo",
  "common.loading": "Caricamento...",
  "common.retry": "Riprova",
  "login.tagline": "I tuoi progressi, sempre con te",
  "login.badge": "Accesso membri",
  "login.title": "Accedi",
  "login.subtitle": "Riprendi esattamente da dove avevi lasciato e conserva le tue ricompense.",
  "login.email": "Indirizzo e-mail",
  "login.emailPlaceholder": "tu@email.com",
  "login.password": "Password",
  "login.passwordPlaceholder": "La tua password",
  "login.showPassword": "Mostra password",
  "login.hidePassword": "Nascondi password",
  "login.submit": "ACCEDI",
  "login.submitting": "Accesso in corso...",
  "login.noAccount": "Non hai ancora un account?",
  "login.createAccount": "CREA IL MIO ACCOUNT",
  "login.termsPrefix": "Accedendo continui ad essere soggetto ai nostri",
  "signup.tagline": "Crea il tuo accesso privato",
  "signup.badge": "Registrazione immediata",
  "signup.title": "Crea il tuo account",
  "signup.subtitle": "Salva il tuo saldo e i progressi giornalieri. Non è richiesta la conferma via e-mail.",
  "signup.benefitImmediate": "Accesso immediato dopo la registrazione",
  "signup.benefitSaved": "Progressi salvati nel tuo account",
  "signup.name": "Nome",
  "signup.namePlaceholder": "Il tuo nome",
  "signup.email": "Indirizzo e-mail",
  "signup.password": "Password",
  "signup.passwordPlaceholder": "Almeno 6 caratteri",
  "signup.termsBefore": "Ho letto e accetto i",
  "signup.termsAfter": ", incluse le condizioni del ciclo di 30 giorni e la scadenza delle ricompense in sospeso.",
  "signup.termsError": "Devi accettare i Termini di utilizzo per creare il tuo account.",
  "signup.submit": "CREA ACCOUNT E ACCEDI",
  "signup.submitting": "Creazione account...",
  "signup.haveAccount": "Hai già un account?",
  "signup.signIn": "Accedi",
  "signup.genericError": "Non è stato possibile creare il tuo account.",
  "layout.activeAccess": "ACCESSO ATTIVO",
  "layout.hello": "Ciao, {name}",
  "layout.exclusive": "Area riservata ai membri",
  "layout.balance": "Il tuo saldo",
  "layout.memberArea": "Area membri",
  "layout.memberSubtitle": "I tuoi progressi e le tue ricompense vengono salvati nel tuo account.",
  "layout.dayOf30": "Giorno {day} di 30",
  "layout.completedDays": "{count} giorni completati",
  "nav.home": "Home",
  "nav.community": "Community",
  "nav.support": "Supporto",
  "nav.profile": "Profilo",
  "motion.kicker": "La tua routine quotidiana",
  "motion.title": "Guarda i video e completa la tua ricompensa",
  "motion.subtitle": "3 video al giorno · progressi salvati automaticamente",
  "members.loading": "Caricamento dei progressi...",
  "members.error": "Non è stato possibile aggiornare i tuoi progressi.",
  "members.planToday": "Il tuo piano di oggi",
  "members.day": "Giorno {day}",
  "members.planSubtitle": "Completa i 3 video di oggi e sblocca la tua ricompensa.",
  "members.progressToday": "Progressi di oggi",
  "members.videosCount": "{count} / 3 video",
  "members.reward": "Ricompensa",
  "members.batchCompleted": "Lotto completato",
  "members.startFirst": "Inizia dal primo video",
  "members.remainingOne": "Ti resta 1 video",
  "members.remainingMany": "Ti restano {count} video",
  "members.planCompleted": "Piano completato",
  "members.nextBatch": "Prossimo lotto",
  "members.batchAvailable": "Lotto disponibile",
  "members.days30Completed": "30 giorni completati",
  "members.unlocksIn": "Si sblocca tra {time}",
  "members.availableNow": "Disponibile ora",
  "members.watchVideos": "Guarda i video",
  "members.totalProgress": "Progressi totali",
  "members.ofThree": "{count} di 3",
  "members.ofThirty": "{count} di 30",
  "members.progress30": "I tuoi progressi di 30 giorni",
  "members.progress30Subtitle": "I giorni successivi restano bloccati finché non completi il lotto precedente e attendi 24 ore.",
  "members.daysCompleted": "{count} giorni completati",
  "members.rewardsDay": "Ricompense — Giorno {day}",
  "members.pendingOne": "1 video in sospeso",
  "members.pendingMany": "{count} video in sospeso",
  "members.moduleDescription": "Apri il feed, guarda i video e completa il lotto di oggi.",
  "members.dailyPlanCompleted": "Piano giornaliero completato",
  "members.nextBatchLocked": "Prossimo lotto bloccato",
  "members.planDoneDescription": "Hai completato l'intero percorso di 30 giorni.",
  "members.lockedDescription": "Si sbloccherà automaticamente al termine del periodo di 24 ore."
};

const dictionaries: Record<TikPayLocale, Record<TranslationKey, string>> = {
  es,
  en,
  fr,
  it,
};

function isLocale(value: string | null | undefined): value is TikPayLocale {
  return Boolean(value && TIKPAY_LOCALES.includes(value as TikPayLocale));
}

export function detectTikPayLocale(): TikPayLocale {
  if (typeof window === "undefined") return "es";

  const pathLocale = window.location.pathname.split("/").filter(Boolean)[0];
  if (isLocale(pathLocale)) return pathLocale;

  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (isLocale(queryLocale)) return queryLocale;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Continue with browser language.
  }

  const browser = (navigator.language || "").toLowerCase().split("-")[0];
  return isLocale(browser) ? browser : "es";
}

export function setTikPayLocale(locale: TikPayLocale) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The UI can still update for the current session.
  }

  document.documentElement.lang = locale;
  window.dispatchEvent(
    new CustomEvent(LOCALE_EVENT, {
      detail: { locale },
    }),
  );
}

function translate(
  locale: TikPayLocale,
  key: TranslationKey,
  variables?: Record<string, string | number>,
) {
  let text = dictionaries[locale]?.[key] ?? dictionaries.es[key] ?? key;

  if (variables) {
    Object.entries(variables).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
  }

  return text;
}

export function useTikPayI18n() {
  const [locale, setLocaleState] = useState<TikPayLocale>("es");

  useEffect(() => {
    const initial = detectTikPayLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial;

    const onLocale = (event: Event) => {
      const custom = event as CustomEvent<{ locale?: TikPayLocale }>;
      const next = custom.detail?.locale ?? detectTikPayLocale();
      setLocaleState(next);
      document.documentElement.lang = next;
    };

    window.addEventListener(LOCALE_EVENT, onLocale);
    window.addEventListener("storage", onLocale);

    return () => {
      window.removeEventListener(LOCALE_EVENT, onLocale);
      window.removeEventListener("storage", onLocale);
    };
  }, []);

  const t = useMemo(
    () =>
      (key: TranslationKey, variables?: Record<string, string | number>) =>
        translate(locale, key, variables),
    [locale],
  );

  const setLocale = (next: TikPayLocale) => {
    setLocaleState(next);
    setTikPayLocale(next);
  };

  return { locale, setLocale, t };
}
