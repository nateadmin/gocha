import { DEFAULT_LANGUAGE, type AppLanguageCode } from './languages';

export type StringKey =
  | 'tabs.chats'
  | 'tabs.catchUp'
  | 'tabs.discover'
  | 'tabs.calls'
  | 'tabs.settings'
  | 'settings.title'
  | 'settings.account'
  | 'settings.language'
  | 'settings.chats'
  | 'settings.privacy'
  | 'settings.notifications'
  | 'settings.ai'
  | 'settings.appearance'
  | 'settings.lightMode'
  | 'settings.signOut'
  | 'settings.signOutThis'
  | 'settings.accounts'
  | 'accounts.logo'
  | 'accounts.logoUnread'
  | 'settings.chatProfile'
  | 'settings.username'
  | 'settings.profileCards'
  | 'settings.myListings'
  | 'settings.listBusiness'
  | 'settings.adminReview'
  | 'settings.verified'
  | 'language.title'
  | 'language.subtitle'
  | 'language.saved'
  | 'language.couldNotSave'
  | 'chat.showOriginal'
  | 'chat.showTranslation'
  | 'chat.placeholder'
  | 'auth.tagline'
  | 'auth.signInNote'
  | 'auth.signUp'
  | 'auth.signIn'
  | 'status.myStatus'
  | 'status.add'
  | 'status.post'
  | 'status.text'
  | 'status.photo'
  | 'status.video'
  | 'status.color'
  | 'status.textPlaceholder'
  | 'status.captionPlaceholder'
  | 'status.textRequired'
  | 'status.postFailed'
  | 'status.loadFailed'
  | 'status.delete'
  | 'status.deleteFailed'
  | 'status.seenBy'
  | 'status.viewersFailed'
  | 'status.closeViewers'
  | 'status.noViews'
  | 'status.viewer'
  | 'status.confirmDeleteTitle'
  | 'status.confirmDeleteBody';

type Dictionary = Record<StringKey, string>;

const en: Dictionary = {
  'tabs.chats': 'Chats',
  'tabs.catchUp': 'Catch up',
  'tabs.discover': 'Discover',
  'tabs.calls': 'Calls',
  'tabs.settings': 'Settings',
  'settings.title': 'Settings',
  'settings.account': 'ACCOUNT',
  'settings.language': 'Language',
  'settings.chats': 'CHATS',
  'settings.privacy': 'PRIVACY',
  'settings.notifications': 'NOTIFICATIONS',
  'settings.ai': 'AI SETTINGS',
  'settings.appearance': 'APPEARANCE',
  'settings.lightMode': 'Light mode',
  'settings.signOut': 'Sign out',
  'settings.signOutThis': 'Sign out of this account',
  'settings.accounts': 'Accounts',
  'accounts.logo': 'Switch account',
  'accounts.logoUnread': 'Switch account. Other accounts have new messages.',
  'settings.chatProfile': 'Chat profile',
  'settings.username': 'Username',
  'settings.profileCards': 'Profile cards',
  'settings.myListings': 'My business listings',
  'settings.listBusiness': 'List a new business',
  'settings.adminReview': 'Admin review queue',
  'settings.verified': 'Verified',
  'language.title': 'Language',
  'language.subtitle': 'App language and incoming message translations. New accounts default to the language of your country.',
  'language.saved': 'Language saved.',
  'language.couldNotSave': 'Could not save language.',
  'chat.showOriginal': 'Show original',
  'chat.showTranslation': 'Show translation',
  'chat.placeholder': 'Message',
  'auth.tagline': 'Connect. Catch up. Discover.',
  'auth.signInNote': 'Sign in with email or phone.',
  'auth.signUp': 'Sign up',
  'auth.signIn': 'Sign in',
  'status.myStatus': 'My status',
  'status.add': 'Add status',
  'status.post': 'Post',
  'status.text': 'Text',
  'status.photo': 'Photo',
  'status.video': 'Video',
  'status.color': 'Color',
  'status.textPlaceholder': 'Type a status',
  'status.captionPlaceholder': 'Add a caption',
  'status.textRequired': 'Write something first.',
  'status.postFailed': 'Could not post that status.',
  'status.loadFailed': 'Could not load status.',
  'status.delete': 'Delete',
  'status.deleteFailed': 'Could not delete that status.',
  'status.seenBy': 'Seen by',
  'status.viewersFailed': 'Could not load viewers.',
  'status.closeViewers': 'Close',
  'status.noViews': 'No views yet',
  'status.viewer': 'Status',
  'status.confirmDeleteTitle': 'Delete this status?',
  'status.confirmDeleteBody': 'This status will be removed for everyone.',
};

const he: Dictionary = {
  ...en,
  'tabs.chats': 'צ׳אטים',
  'tabs.catchUp': 'קאצ׳ אפ',
  'tabs.discover': 'גלה',
  'tabs.calls': 'שיחות',
  'tabs.settings': 'הגדרות',
  'settings.title': 'הגדרות',
  'settings.account': 'חשבון',
  'settings.language': 'שפה',
  'settings.chats': 'צ׳אטים',
  'settings.privacy': 'פרטיות',
  'settings.notifications': 'התראות',
  'settings.ai': 'הגדרות בינה מלאכותית',
  'settings.appearance': 'מראה',
  'settings.lightMode': 'מצב בהיר',
  'settings.signOut': 'התנתקות',
  'settings.signOutThis': 'התנתקות מהחשבון הזה',
  'settings.accounts': 'חשבונות',
  'accounts.logo': 'החלף חשבון',
  'accounts.logoUnread': 'החלף חשבון. לחשבונות אחרים יש הודעות חדשות.',
  'settings.chatProfile': 'פרופיל צ׳אט',
  'settings.username': 'שם משתמש',
  'settings.profileCards': 'כרטיסי פרופיל',
  'settings.myListings': 'העסק שלי',
  'settings.listBusiness': 'הוסף עסק חדש',
  'settings.adminReview': 'תור בדיקת מנהל',
  'settings.verified': 'מאומת',
  'language.title': 'שפה',
  'language.subtitle': 'שפת האפליקציה ותרגום הודעות נכנסות. חשבונות חדשים מקבלים את שפת מדינת המוצא.',
  'language.saved': 'השפה נשמרה.',
  'language.couldNotSave': 'לא ניתן לשמור את השפה.',
  'chat.showOriginal': 'הצג מקור',
  'chat.showTranslation': 'הצג תרגום',
  'chat.placeholder': 'הודעה',
  'auth.tagline': 'התחברו. תתעדכנו. תגלו.',
  'auth.signInNote': 'התחברות עם אימייל או טלפון.',
  'auth.signUp': 'הרשמה',
  'auth.signIn': 'התחברות',
  'status.myStatus': 'הסטטוס שלי',
  'status.add': 'הוסף סטטוס',
  'status.post': 'פרסם',
  'status.text': 'טקסט',
  'status.photo': 'תמונה',
  'status.video': 'וידאו',
  'status.color': 'צבע',
  'status.textPlaceholder': 'כתוב סטטוס',
  'status.captionPlaceholder': 'הוסף כיתוב',
  'status.textRequired': 'כתוב משהו קודם.',
  'status.postFailed': 'לא ניתן לפרסם את הסטטוס.',
  'status.loadFailed': 'לא ניתן לטעון את הסטטוס.',
  'status.delete': 'מחק',
  'status.deleteFailed': 'לא ניתן למחוק את הסטטוס.',
  'status.seenBy': 'נצפה על ידי',
  'status.viewersFailed': 'לא ניתן לטעון צפיות.',
  'status.closeViewers': 'סגור',
  'status.noViews': 'אין צפיות עדיין',
  'status.viewer': 'סטטוס',
  'status.confirmDeleteTitle': 'למחוק את הסטטוס?',
  'status.confirmDeleteBody': 'הסטטוס יוסר לכולם.',
};

const es: Dictionary = {
  ...en,
  'tabs.chats': 'Chats',
  'tabs.catchUp': 'Resumen',
  'tabs.discover': 'Descubrir',
  'tabs.calls': 'Llamadas',
  'tabs.settings': 'Ajustes',
  'settings.title': 'Ajustes',
  'settings.account': 'CUENTA',
  'settings.language': 'Idioma',
  'settings.chats': 'CHATS',
  'settings.privacy': 'PRIVACIDAD',
  'settings.notifications': 'NOTIFICACIONES',
  'settings.ai': 'AJUSTES DE IA',
  'settings.appearance': 'APARIENCIA',
  'settings.lightMode': 'Modo claro',
  'settings.signOut': 'Cerrar sesión',
  'settings.signOutThis': 'Cerrar sesión de esta cuenta',
  'settings.accounts': 'Cuentas',
  'settings.chatProfile': 'Perfil de chat',
  'settings.username': 'Nombre de usuario',
  'settings.profileCards': 'Tarjetas de perfil',
  'settings.myListings': 'Mis negocios',
  'settings.listBusiness': 'Publicar un negocio',
  'settings.adminReview': 'Cola de revisión',
  'settings.verified': 'Verificado',
  'language.title': 'Idioma',
  'language.subtitle': 'Idioma de la app y traducción de mensajes recibidos. Las cuentas nuevas usan el idioma de tu país.',
  'language.saved': 'Idioma guardado.',
  'language.couldNotSave': 'No se pudo guardar el idioma.',
  'chat.showOriginal': 'Ver original',
  'chat.showTranslation': 'Ver traducción',
  'chat.placeholder': 'Mensaje',
  'auth.tagline': 'Conecta. Ponte al día. Descubre.',
  'auth.signInNote': 'Entra con email o teléfono.',
  'auth.signUp': 'Crear cuenta',
  'auth.signIn': 'Iniciar sesión',
};

const fr: Dictionary = {
  ...en,
  'tabs.chats': 'Discussions',
  'tabs.catchUp': 'Résumé',
  'tabs.discover': 'Découvrir',
  'tabs.calls': 'Appels',
  'tabs.settings': 'Réglages',
  'settings.title': 'Réglages',
  'settings.account': 'COMPTE',
  'settings.language': 'Langue',
  'settings.chats': 'DISCUSSIONS',
  'settings.privacy': 'CONFIDENTIALITÉ',
  'settings.notifications': 'NOTIFICATIONS',
  'settings.ai': 'RÉGLAGES IA',
  'settings.appearance': 'APPARENCE',
  'settings.lightMode': 'Mode clair',
  'settings.signOut': 'Se déconnecter',
  'settings.signOutThis': 'Se déconnecter de ce compte',
  'settings.accounts': 'Comptes',
  'settings.chatProfile': 'Profil de discussion',
  'settings.username': 'Nom d’utilisateur',
  'settings.profileCards': 'Cartes de profil',
  'settings.myListings': 'Mes entreprises',
  'settings.listBusiness': 'Ajouter une entreprise',
  'settings.adminReview': 'File d’examen',
  'settings.verified': 'Vérifié',
  'language.title': 'Langue',
  'language.subtitle': 'Langue de l’app et traduction des messages reçus. Les nouveaux comptes utilisent la langue de votre pays.',
  'language.saved': 'Langue enregistrée.',
  'language.couldNotSave': 'Impossible d’enregistrer la langue.',
  'chat.showOriginal': 'Voir l’original',
  'chat.showTranslation': 'Voir la traduction',
  'chat.placeholder': 'Message',
  'auth.tagline': 'Connectez-vous. Rattrapez. Découvrez.',
  'auth.signInNote': 'Connexion par e-mail ou téléphone.',
  'auth.signUp': 'S’inscrire',
  'auth.signIn': 'Se connecter',
};

const ar: Dictionary = {
  ...en,
  'tabs.chats': 'الدردشات',
  'tabs.catchUp': 'الملخص',
  'tabs.discover': 'اكتشف',
  'tabs.calls': 'المكالمات',
  'tabs.settings': 'الإعدادات',
  'settings.title': 'الإعدادات',
  'settings.account': 'الحساب',
  'settings.language': 'اللغة',
  'settings.chats': 'الدردشات',
  'settings.privacy': 'الخصوصية',
  'settings.notifications': 'الإشعارات',
  'settings.ai': 'إعدادات الذكاء الاصطناعي',
  'settings.appearance': 'المظهر',
  'settings.lightMode': 'الوضع الفاتح',
  'settings.signOut': 'تسجيل الخروج',
  'settings.signOutThis': 'تسجيل الخروج من هذا الحساب',
  'settings.accounts': 'الحسابات',
  'settings.chatProfile': 'ملف الدردشة',
  'settings.username': 'اسم المستخدم',
  'settings.profileCards': 'بطاقات الملف',
  'settings.myListings': 'أعمالي',
  'settings.listBusiness': 'إضافة عمل جديد',
  'settings.adminReview': 'قائمة مراجعة المشرف',
  'settings.verified': 'موثّق',
  'language.title': 'اللغة',
  'language.subtitle': 'لغة التطبيق وترجمة الرسائل الواردة. الحسابات الجديدة تستخدم لغة بلدك.',
  'language.saved': 'تم حفظ اللغة.',
  'language.couldNotSave': 'تعذر حفظ اللغة.',
  'chat.showOriginal': 'عرض الأصل',
  'chat.showTranslation': 'عرض الترجمة',
  'chat.placeholder': 'رسالة',
  'auth.tagline': 'تواصل. تابع. اكتشف.',
  'auth.signInNote': 'تسجيل الدخول بالبريد أو الهاتف.',
  'auth.signUp': 'إنشاء حساب',
  'auth.signIn': 'تسجيل الدخول',
};

const ru: Dictionary = {
  ...en,
  'tabs.chats': 'Чаты',
  'tabs.catchUp': 'Сводка',
  'tabs.discover': 'Обзор',
  'tabs.calls': 'Звонки',
  'tabs.settings': 'Настройки',
  'settings.title': 'Настройки',
  'settings.account': 'АККАУНТ',
  'settings.language': 'Язык',
  'settings.chats': 'ЧАТЫ',
  'settings.privacy': 'КОНФИДЕНЦИАЛЬНОСТЬ',
  'settings.notifications': 'УВЕДОМЛЕНИЯ',
  'settings.ai': 'НАСТРОЙКИ ИИ',
  'settings.appearance': 'ОФОРМЛЕНИЕ',
  'settings.lightMode': 'Светлая тема',
  'settings.signOut': 'Выйти',
  'settings.signOutThis': 'Выйти из этого аккаунта',
  'settings.accounts': 'Аккаунты',
  'settings.chatProfile': 'Профиль чата',
  'settings.username': 'Имя пользователя',
  'settings.profileCards': 'Карточки профиля',
  'settings.myListings': 'Мои компании',
  'settings.listBusiness': 'Добавить компанию',
  'settings.adminReview': 'Очередь проверки',
  'settings.verified': 'Подтверждён',
  'language.title': 'Язык',
  'language.subtitle': 'Язык приложения и перевод входящих сообщений. Новые аккаунты получают язык вашей страны.',
  'language.saved': 'Язык сохранён.',
  'language.couldNotSave': 'Не удалось сохранить язык.',
  'chat.showOriginal': 'Показать оригинал',
  'chat.showTranslation': 'Показать перевод',
  'chat.placeholder': 'Сообщение',
  'auth.tagline': 'Общайтесь. Будьте в курсе. Открывайте.',
  'auth.signInNote': 'Вход по почте или телефону.',
  'auth.signUp': 'Регистрация',
  'auth.signIn': 'Войти',
};

const de: Dictionary = {
  ...en,
  'tabs.chats': 'Chats',
  'tabs.catchUp': 'Überblick',
  'tabs.discover': 'Entdecken',
  'tabs.calls': 'Anrufe',
  'tabs.settings': 'Einstellungen',
  'settings.title': 'Einstellungen',
  'settings.account': 'KONTO',
  'settings.language': 'Sprache',
  'settings.chats': 'CHATS',
  'settings.privacy': 'DATENSCHUTZ',
  'settings.notifications': 'BENACHRICHTIGUNGEN',
  'settings.ai': 'KI-EINSTELLUNGEN',
  'settings.appearance': 'DARSTELLUNG',
  'settings.lightMode': 'Heller Modus',
  'settings.signOut': 'Abmelden',
  'settings.signOutThis': 'Von diesem Konto abmelden',
  'settings.accounts': 'Konten',
  'settings.chatProfile': 'Chat-Profil',
  'settings.username': 'Benutzername',
  'settings.profileCards': 'Profilkarten',
  'settings.myListings': 'Meine Unternehmen',
  'settings.listBusiness': 'Unternehmen eintragen',
  'settings.adminReview': 'Admin-Prüfung',
  'settings.verified': 'Verifiziert',
  'language.title': 'Sprache',
  'language.subtitle': 'App-Sprache und Übersetzung eingehender Nachrichten. Neue Konten nutzen die Sprache deines Landes.',
  'language.saved': 'Sprache gespeichert.',
  'language.couldNotSave': 'Sprache konnte nicht gespeichert werden.',
  'chat.showOriginal': 'Original anzeigen',
  'chat.showTranslation': 'Übersetzung anzeigen',
  'chat.placeholder': 'Nachricht',
  'auth.tagline': 'Verbinden. Aufholen. Entdecken.',
  'auth.signInNote': 'Mit E-Mail oder Telefon anmelden.',
  'auth.signUp': 'Registrieren',
  'auth.signIn': 'Anmelden',
};

const pt: Dictionary = {
  ...en,
  'tabs.chats': 'Chats',
  'tabs.catchUp': 'Resumo',
  'tabs.discover': 'Descobrir',
  'tabs.calls': 'Chamadas',
  'tabs.settings': 'Ajustes',
  'settings.title': 'Ajustes',
  'settings.account': 'CONTA',
  'settings.language': 'Idioma',
  'settings.chats': 'CHATS',
  'settings.privacy': 'PRIVACIDADE',
  'settings.notifications': 'NOTIFICAÇÕES',
  'settings.ai': 'AJUSTES DE IA',
  'settings.appearance': 'APARÊNCIA',
  'settings.lightMode': 'Modo claro',
  'settings.signOut': 'Sair',
  'settings.signOutThis': 'Sair desta conta',
  'settings.accounts': 'Contas',
  'settings.chatProfile': 'Perfil do chat',
  'settings.username': 'Nome de usuário',
  'settings.profileCards': 'Cartões de perfil',
  'settings.myListings': 'Meus negócios',
  'settings.listBusiness': 'Cadastrar negócio',
  'settings.adminReview': 'Fila de revisão',
  'settings.verified': 'Verificado',
  'language.title': 'Idioma',
  'language.subtitle': 'Idioma do app e tradução das mensagens recebidas. Novas contas usam o idioma do seu país.',
  'language.saved': 'Idioma salvo.',
  'language.couldNotSave': 'Não foi possível salvar o idioma.',
  'chat.showOriginal': 'Ver original',
  'chat.showTranslation': 'Ver tradução',
  'chat.placeholder': 'Mensagem',
  'auth.tagline': 'Conecte. Atualize. Descubra.',
  'auth.signInNote': 'Entre com e-mail ou telefone.',
  'auth.signUp': 'Criar conta',
  'auth.signIn': 'Entrar',
};

const DICTIONARIES: Partial<Record<AppLanguageCode, Dictionary>> = {
  en,
  he,
  es,
  fr,
  ar,
  ru,
  de,
  pt,
};

export function translate(language: string, key: StringKey): string {
  const dict = DICTIONARIES[language as AppLanguageCode] ?? en;
  return dict[key] ?? en[key] ?? key;
}

export { DEFAULT_LANGUAGE };
