export type Language = 'he' | 'en' | 'ar' | 'zh' | 'hi' | 'fr' | 'ru' | 'ka';

export const languageFlags: Record<Language, string> = {
  he: '🇮🇱',
  en: '🇬🇧',
  ar: '🇸🇦',
  zh: '🇨🇳',
  hi: '🇮🇳',
  fr: '🇫🇷',
  ru: '🇷🇺',
  ka: '🇬🇪'
};

export const languageNames: Record<Language, string> = {
  he: 'עברית',
  en: 'English',
  ar: 'العربية',
  zh: '中文',
  hi: 'हिंदी',
  fr: 'Français',
  ru: 'Русский',
  ka: 'ქართული'
};

export const translations = {
  he: {
    // General
    title: 'המר על מספר',
    balance: 'יתרה',
    logout: 'התנתק',
    hello: 'שלום',
    back: 'חזור',
    close: 'סגור',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    
    // Game
    numberstatistics: 'סטיסטיק', 
    selectNumber: 'בחר מספר',
    range: 'טווח',
    attempts: 'ניסיונות',
    betAmount: 'סכום הימור',
    play: 'המר',
    winChance: 'סיכוי לזכייה',
    payoutRatio: 'יחס תשלום',
    potentialWin: 'זכייה אפשרית',
    win: 'ניצחת!',
    lose: 'לא הפעם',
    yourNumber: 'המספרים שלך',
    systemNumbers: 'המספר שהוגרל',
    tryAgain: 'נסה שוב',
    spinning: 'מסובב...',
    
    // Statistics
    hotNumbers: 'מספרים חמים',
    coldNumbers: 'מספרים קרים',
    recentWins: 'זכיות אחרונות',
    leaderboard: 'טבלת מובילים',
    totalBets: 'סה״כ הימורים',
    totalWins: 'סה״כ זכיות',
    winRate: 'אחוז זכיות',
    totalBetAmount: 'סה״כ הימור',
    totalWinAmount: 'סה״כ זכיות',
    biggestWin: 'הזכייה הגדולה ביותר',
    
    // VIP
    vipStatus: 'סטטוס VIP',
    vipLevel: 'רמת VIP',
    cashback: 'קאשבק',
    dailyBonus: 'בונוס יומי',
    benefits: 'הטבות',
    progressToNext: 'התקדמות לרמה הבאה',
    betsUntilNext: 'הימורים עד הרמה הבאה',
    
    // Referral
    referralProgram: 'תוכנית חבר מביא חבר',
    yourReferralCode: 'קוד ההפניה שלך',
    referralEarnings: 'רווחים מהפניות',
    totalReferrals: 'סה״כ הפניות',
    copyCode: 'העתק קוד',
    inviteFriend: 'הזמן חבר',
    referralBonus: 'בונוס הפניה',
    
    // Admin
    adminPanel: 'פאנל ניהול',
    totalUsers: 'סה״כ משתמשים',
    activeUsers: 'משתמשים פעילים',
    revenue: 'הכנסות',
    houseEdge: 'רווח הבית',
    userManagement: 'ניהול משתמשים',
    statistics: 'סטטיסטיקות',
    recentBets: 'הימורים אחרונים',
    dashboard: 'לוח בקרה',
    users: 'משתמשים',
    bets: 'הימורים',
    backToGame: 'חזרה למשחק',
    weeklyActive: 'פעילים השבוע',
    todayBets: 'הימורים היום',
    editBalance: 'עריכת יתרה',
    updateBalance: 'עדכן יתרה',
    betHistory: 'היסטוריית הימורים',
    userStats: 'סטטיסטיקות משתמש',
    netProfit: 'רווח נקי',
    
    // History
    bettingHistory: 'היסטוריית הימורים',
    date: 'תאריך',
    bet: 'הימור',
    result: 'תוצאה',
    profit: 'רווח',
    
    // Auth
    login: 'התחברות',
    register: 'הרשמה',
    email: 'אימייל',
    password: 'סיסמה',
    username: 'שם משתמש',
    confirmPassword: 'אשר סיסמה',
    welcomeBonus: 'בונוס הרשמה',
    
    // Messages
    insufficientBalance: 'יתרה לא מספקת',
    betPlaced: 'ההימור בוצע',
    welcomeBack: 'ברוך שובך',
    dailyBonusClaimed: 'בונוס יומי נגבה!',
    referralCodeCopied: 'קוד ההפניה הועתק',
    userNotFound: 'משתמש לא נמצא',
    invalidCredentials: 'פרטי התחברות שגויים',
    registrationSuccess: 'ההרשמה הושלמה בהצלחה',
    
    // Time
    seconds: 'שניות',
    minutes: 'דקות',
    hours: 'שעות',
    days: 'ימים',
    ago: 'לפני',
    
    // Actions
    claim: 'גבה',
    copy: 'העתק',
    share: 'שתף',
    view: 'צפה',
    edit: 'ערוך',
    delete: 'מחק',
    save: 'שמור',
    cancel: 'ביטול',
    confirm: 'אשר',
    search: 'חיפוש',
    filter: 'סינון',
    export: 'ייצוא',
    
    // Near-Miss System
    nearMiss: 'כמעט!',
    soClose: 'כל כך קרוב!',
    oneNumberAway: 'מספר אחד בלבד!',
    almostWon: 'כמעט זכית!',
    
    // Multipliers
    anticipationMultiplier: 'מכפיל ציפייה',
    countingDown: 'סופר אחורה...',
    revealingResult: 'חושף תוצאה...',
    currentWinChance: 'סיכוי נוכחי לזכייה'
  },
  
  en: {
    // General
    title: 'Bet on Number',
    balance: 'Balance',
    logout: 'Logout',
    hello: 'Hello',
    back: 'Back',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Game
    selectNumber: 'Select Number',
    range: 'Range',
    attempts: 'Attempts',
    betAmount: 'Bet Amount',
    play: 'Bet',
    winChance: 'Win Chance',
    payoutRatio: 'Payout Ratio',
    potentialWin: 'Potential Win',
    win: 'You Won!',
    lose: 'Not This Time',
    yourNumber: 'Your Numbers',
    systemNumbers: 'Drawn Number',
    tryAgain: 'Try Again',
    spinning: 'Spinning...',
    
    // Statistics
    hotNumbers: 'Hot Numbers',
    coldNumbers: 'Cold Numbers',
    recentWins: 'Recent Wins',
    leaderboard: 'Leaderboard',
    totalBets: 'Total Bets',
    totalWins: 'Total Wins',
    winRate: 'Win Rate',
    totalBetAmount: 'Total Bet Amount',
    totalWinAmount: 'Total Win Amount',
    biggestWin: 'Biggest Win',
    
    // VIP
    vipStatus: 'VIP Status',
    vipLevel: 'VIP Level',
    cashback: 'Cashback',
    dailyBonus: 'Daily Bonus',
    benefits: 'Benefits',
    progressToNext: 'Progress to Next Level',
    betsUntilNext: 'Bets Until Next Level',
    
    // Referral
    referralProgram: 'Referral Program',
    yourReferralCode: 'Your Referral Code',
    referralEarnings: 'Referral Earnings',
    totalReferrals: 'Total Referrals',
    copyCode: 'Copy Code',
    inviteFriend: 'Invite Friend',
    referralBonus: 'Referral Bonus',
    
    // Admin
    adminPanel: 'Admin Panel',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    revenue: 'Revenue',
    houseEdge: 'House Edge',
    userManagement: 'User Management',
    statistics: 'Statistics',
    recentBets: 'Recent Bets',
    dashboard: 'Dashboard',
    users: 'Users',
    bets: 'Bets',
    backToGame: 'Back to Game',
    weeklyActive: 'Active this week',
    todayBets: 'Bets today',
    editBalance: 'Edit Balance',
    updateBalance: 'Update Balance',
    betHistory: 'Bet History',
    userStats: 'User Stats',
    netProfit: 'Net Profit',
    
    // History
    bettingHistory: 'Betting History',
    date: 'Date',
    bet: 'Bet',
    result: 'Result',
    profit: 'Profit',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    confirmPassword: 'Confirm Password',
    welcomeBonus: 'Welcome Bonus',
    
    // Messages
    insufficientBalance: 'Insufficient Balance',
    betPlaced: 'Bet Placed',
    welcomeBack: 'Welcome Back',
    dailyBonusClaimed: 'Daily Bonus Claimed!',
    referralCodeCopied: 'Referral code copied!',
    userNotFound: 'User not found',
    invalidCredentials: 'Invalid credentials',
    registrationSuccess: 'Registration successful',
    
    // Time
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    ago: 'ago',
    
    // Actions
    claim: 'Claim',
    copy: 'Copy',
    share: 'Share',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Near-Miss System
    nearMiss: 'Near Miss!',
    soClose: 'So Close!',
    oneNumberAway: 'One Number Away!',
    almostWon: 'Almost Won!',
    
    // Multipliers
    anticipationMultiplier: 'Anticipation Multiplier',
    countingDown: 'Counting down...',
    revealingResult: 'Revealing result...',
    currentWinChance: 'Current Win Chance'
  },
  
  ar: {
    // General
    title: 'راهن على الرقم',
    balance: 'الرصيد',
    logout: 'تسجيل خروج',
    hello: 'مرحبا',
    back: 'رجوع',
    close: 'إغلاق',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    
    // Game
    selectNumber: 'اختر رقم',
    range: 'النطاق',
    attempts: 'المحاولات',
    betAmount: 'مبلغ الرهان',
    play: 'راهن',
    winChance: 'فرصة الفوز',
    payoutRatio: 'نسبة الدفع',
    potentialWin: 'الربح المحتمل',
    win: 'لقد فزت!',
    lose: 'ليس هذه المرة',
    yourNumber: 'أرقامك',
    systemNumbers: 'الرقم المسحوب',
    tryAgain: 'حاول مرة أخرى',
    spinning: 'يدور...',
    
    // Statistics
    hotNumbers: 'الأرقام الساخنة',
    coldNumbers: 'الأرقام الباردة',
    recentWins: 'الفوز الأخير',
    leaderboard: 'لوحة الصدارة',
    totalBets: 'إجمالي الرهانات',
    totalWins: 'إجمالي الفوز',
    winRate: 'معدل الفوز',
    totalBetAmount: 'إجمالي مبلغ الرهان',
    totalWinAmount: 'إجمالي مبلغ الفوز',
    biggestWin: 'أكبر فوز',
    
    // VIP
    vipStatus: 'حالة VIP',
    vipLevel: 'مستوى VIP',
    cashback: 'استرداد نقدي',
    dailyBonus: 'مكافأة يومية',
    benefits: 'المزايا',
    progressToNext: 'التقدم للمستوى التالي',
    betsUntilNext: 'الرهانات حتى المستوى التالي',
    
    // Referral
    referralProgram: 'برنامج الإحالة',
    yourReferralCode: 'رمز الإحالة الخاص بك',
    referralEarnings: 'أرباح الإحالة',
    totalReferrals: 'إجمالي الإحالات',
    copyCode: 'نسخ الرمز',
    inviteFriend: 'دعوة صديق',
    referralBonus: 'مكافأة الإحالة',
    
    // Admin
    adminPanel: 'لوحة الإدارة',
    totalUsers: 'إجمالي المستخدمين',
    activeUsers: 'المستخدمون النشطون',
    revenue: 'الإيرادات',
    houseEdge: 'ربح البيت',
    userManagement: 'إدارة المستخدمين',
    statistics: 'إحصائيات',
    recentBets: 'الرهانات الأخيرة',
    dashboard: 'لوحة القيادة',
    users: 'المستخدمون',
    bets: 'الرهانات',
    backToGame: 'العودة للعبة',
    weeklyActive: 'نشط هذا الأسبوع',
    todayBets: 'رهانات اليوم',
    editBalance: 'تعديل الرصيد',
    updateBalance: 'تحديث الرصيد',
    betHistory: 'تاريخ الرهانات',
    userStats: 'إحصائيات المستخدم',
    netProfit: 'صافي الربح',
    
    // History
    bettingHistory: 'تاريخ الرهانات',
    date: 'التاريخ',
    bet: 'الرهان',
    result: 'النتيجة',
    profit: 'الربح',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    username: 'اسم المستخدم',
    confirmPassword: 'تأكيد كلمة المرور',
    welcomeBonus: 'مكافأة ترحيبية',
    
    // Messages
    insufficientBalance: 'الرصيد غير كافي',
    betPlaced: 'تم وضع الرهان',
    welcomeBack: 'مرحبا بعودتك',
    dailyBonusClaimed: 'تم الحصول على المكافأة اليومية!',
    referralCodeCopied: 'تم نسخ رمز الإحالة',
    userNotFound: 'المستخدم غير موجود',
    invalidCredentials: 'بيانات الاعتماد غير صحيحة',
    registrationSuccess: 'تم التسجيل بنجاح',
    
    // Time
    seconds: 'ثواني',
    minutes: 'دقائق',
    hours: 'ساعات',
    days: 'أيام',
    ago: 'منذ',
    
    // Actions
    claim: 'احصل',
    copy: 'نسخ',
    share: 'شارك',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    
    // Near-Miss System
    nearMiss: 'كاد!',
    soClose: 'قريب جدا!',
    oneNumberAway: 'رقم واحد فقط!',
    almostWon: 'كدت تفوز!',
    
    // Multipliers
    anticipationMultiplier: 'مضاعف الترقب',
    countingDown: 'العد التنازلي...',
    revealingResult: 'كشف النتيجة...',
    currentWinChance: 'فرصة الفوز الحالية'
  },
  
  zh: {
    // General
    title: '数字投注',
    balance: '余额',
    logout: '登出',
    hello: '你好',
    back: '返回',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    
    // Game
    selectNumber: '选择数字',
    range: '范围',
    attempts: '尝试',
    betAmount: '投注金额',
    play: '投注',
    winChance: '获胜机会',
    payoutRatio: '赔付率',
    potentialWin: '潜在奖金',
    win: '你赢了！',
    lose: '这次没有',
    yourNumber: '你的数字',
    systemNumbers: '开奖号码',
    tryAgain: '再试一次',
    spinning: '旋转中...',
    
    // Statistics
    hotNumbers: '热门数字',
    coldNumbers: '冷门数字',
    recentWins: '最近获胜',
    leaderboard: '排行榜',
    totalBets: '总投注',
    totalWins: '总获胜',
    winRate: '获胜率',
    totalBetAmount: '总投注金额',
    totalWinAmount: '总获胜金额',
    biggestWin: '最大获胜',
    
    // VIP
    vipStatus: 'VIP状态',
    vipLevel: 'VIP等级',
    cashback: '返现',
    dailyBonus: '每日奖金',
    benefits: '福利',
    progressToNext: '升级进度',
    betsUntilNext: '升级所需投注',
    
    // Referral
    referralProgram: '推荐计划',
    yourReferralCode: '您的推荐码',
    referralEarnings: '推荐收益',
    totalReferrals: '总推荐',
    copyCode: '复制代码',
    inviteFriend: '邀请朋友',
    referralBonus: '推荐奖金',
    
    // Admin
    adminPanel: '管理面板',
    totalUsers: '总用户',
    activeUsers: '活跃用户',
    revenue: '收入',
    houseEdge: '庄家优势',
    userManagement: '用户管理',
    statistics: '统计',
    recentBets: '最近投注',
    dashboard: '仪表板',
    users: '用户',
    bets: '投注',
    backToGame: '返回游戏',
    weeklyActive: '本周活跃',
    todayBets: '今日投注',
    editBalance: '编辑余额',
    updateBalance: '更新余额',
    betHistory: '投注历史',
    userStats: '用户统计',
    netProfit: '净利润',
    
    // History
    bettingHistory: '投注历史',
    date: '日期',
    bet: '投注',
    result: '结果',
    profit: '利润',
    
    // Auth
    login: '登录',
    register: '注册',
    email: '电子邮件',
    password: '密码',
    username: '用户名',
    confirmPassword: '确认密码',
    welcomeBonus: '欢迎奖金',
    
    // Messages
    insufficientBalance: '余额不足',
    betPlaced: '投注已下',
    welcomeBack: '欢迎回来',
    dailyBonusClaimed: '每日奖金已领取！',
    referralCodeCopied: '推荐码已复制',
    userNotFound: '用户未找到',
    invalidCredentials: '凭据无效',
    registrationSuccess: '注册成功',
    
    // Time
    seconds: '秒',
    minutes: '分钟',
    hours: '小时',
    days: '天',
    ago: '前',
    
    // Actions
    claim: '领取',
    copy: '复制',
    share: '分享',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    
    // Near-Miss System
    nearMiss: '差一点！',
    soClose: '非常接近！',
    oneNumberAway: '只差一个数字！',
    almostWon: '差点就赢了！',
    
    // Multipliers
    anticipationMultiplier: '期待倍数',
    countingDown: '倒计时...',
    revealingResult: '揭晓结果...',
    currentWinChance: '当前获胜机会'
  },
  
  hi: {
    // General
    title: 'नंबर पर दांव',
    balance: 'शेष राशि',
    logout: 'लॉग आउट',
    hello: 'नमस्ते',
    back: 'वापस',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    
    // Game
    selectNumber: 'नंबर चुनें',
    range: 'सीमा',
    attempts: 'प्रयास',
    betAmount: 'दांव राशि',
    play: 'दांव लगाएं',
    winChance: 'जीत की संभावना',
    payoutRatio: 'भुगतान अनुपात',
    potentialWin: 'संभावित जीत',
    win: 'आप जीत गए!',
    lose: 'इस बार नहीं',
    yourNumber: 'आपके नंबर',
    systemNumbers: 'निकाला गया नंबर',
    tryAgain: 'फिर कोशिश करें',
    spinning: 'घूम रहा है...',
    
    // Statistics
    hotNumbers: 'गर्म नंबर',
    coldNumbers: 'ठंडे नंबर',
    recentWins: 'हाल की जीत',
    leaderboard: 'लीडरबोर्ड',
    totalBets: 'कुल दांव',
    totalWins: 'कुल जीत',
    winRate: 'जीत दर',
    totalBetAmount: 'कुल दांव राशि',
    totalWinAmount: 'कुल जीत राशि',
    biggestWin: 'सबसे बड़ी जीत',
    
    // VIP
    vipStatus: 'VIP स्थिति',
    vipLevel: 'VIP स्तर',
    cashback: 'कैशबैक',
    dailyBonus: 'दैनिक बोनस',
    benefits: 'लाभ',
    progressToNext: 'अगले स्तर की प्रगति',
    betsUntilNext: 'अगले स्तर तक दांव',
    
    // Referral
    referralProgram: 'रेफरल कार्यक्रम',
    yourReferralCode: 'आपका रेफरल कोड',
    referralEarnings: 'रेफरल कमाई',
    totalReferrals: 'कुल रेफरल',
    copyCode: 'कोड कॉपी करें',
    inviteFriend: 'मित्र को आमंत्रित करें',
    referralBonus: 'रेफरल बोनस',
    
    // Admin
    adminPanel: 'एडमिन पैनल',
    totalUsers: 'कुल उपयोगकर्ता',
    activeUsers: 'सक्रिय उपयोगकर्ता',
    revenue: 'राजस्व',
    houseEdge: 'हाउस एज',
    userManagement: 'उपयोगकर्ता प्रबंधन',
    statistics: 'आंकड़े',
    recentBets: 'हाल के दांव',
    dashboard: 'डैशबोर्ड',
    users: 'उपयोगकर्ता',
    bets: 'दांव',
    backToGame: 'गेम पर वापस',
    weeklyActive: 'इस सप्ताह सक्रिय',
    todayBets: 'आज के दांव',
    editBalance: 'शेष राशि संपादित करें',
    updateBalance: 'शेष राशि अपडेट करें',
    betHistory: 'दांव इतिहास',
    userStats: 'उपयोगकर्ता आंकड़े',
    netProfit: 'शुद्ध लाभ',
    
    // History
    bettingHistory: 'दांव इतिहास',
    date: 'दिनांक',
    bet: 'दांव',
    result: 'परिणाम',
    profit: 'लाभ',
    
    // Auth
    login: 'लॉग इन',
    register: 'रजिस्टर',
    email: 'ईमेल',
    password: 'पासवर्ड',
    username: 'उपयोगकर्ता नाम',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    welcomeBonus: 'स्वागत बोनस',
    
    // Messages
    insufficientBalance: 'अपर्याप्त शेष राशि',
    betPlaced: 'दांव लगाया गया',
    welcomeBack: 'वापस स्वागत है',
    dailyBonusClaimed: 'दैनिक बोनस प्राप्त किया!',
    referralCodeCopied: 'रेफरल कोड कॉपी किया गया',
    userNotFound: 'उपयोगकर्ता नहीं मिला',
    invalidCredentials: 'अमान्य प्रमाण पत्र',
    registrationSuccess: 'पंजीकरण सफल',
    
    // Time
    seconds: 'सेकंड',
    minutes: 'मिनट',
    hours: 'घंटे',
    days: 'दिन',
    ago: 'पहले',
    
    // Actions
    claim: 'दावा करें',
    copy: 'कॉपी',
    share: 'शेयर',
    view: 'देखें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    export: 'निर्यात',
    
    // Near-Miss System
    nearMiss: 'लगभग!',
    soClose: 'बहुत करीब!',
    oneNumberAway: 'केवल एक नंबर दूर!',
    almostWon: 'लगभग जीत गए!',
    
    // Multipliers
    anticipationMultiplier: 'प्रत्याशा गुणक',
    countingDown: 'उलटी गिनती...',
    revealingResult: 'परिणाम प्रकट हो रहा है...',
    currentWinChance: 'वर्तमान जीत की संभावना'
  },
  
  fr: {
    // General
    title: 'Pariez sur un Nombre',
    balance: 'Solde',
    logout: 'Déconnexion',
    hello: 'Bonjour',
    back: 'Retour',
    close: 'Fermer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    
    // Game
    selectNumber: 'Sélectionnez un Nombre',
    range: 'Gamme',
    attempts: 'Tentatives',
    betAmount: 'Montant du Pari',
    play: 'Parier',
    winChance: 'Chance de Gagner',
    payoutRatio: 'Ratio de Paiement',
    potentialWin: 'Gain Potentiel',
    win: 'Vous avez Gagné!',
    lose: 'Pas Cette Fois',
    yourNumber: 'Vos Numéros',
    systemNumbers: 'Numéro Tiré',
    tryAgain: 'Réessayer',
    spinning: 'Rotation...',
    
    // Statistics
    hotNumbers: 'Numéros Chauds',
    coldNumbers: 'Numéros Froids',
    recentWins: 'Gains Récents',
    leaderboard: 'Classement',
    totalBets: 'Total des Paris',
    totalWins: 'Total des Gains',
    winRate: 'Taux de Gain',
    totalBetAmount: 'Montant Total des Paris',
    totalWinAmount: 'Montant Total des Gains',
    biggestWin: 'Plus Gros Gain',
    
    // VIP
    vipStatus: 'Statut VIP',
    vipLevel: 'Niveau VIP',
    cashback: 'Cashback',
    dailyBonus: 'Bonus Quotidien',
    benefits: 'Avantages',
    progressToNext: 'Progression au Niveau Suivant',
    betsUntilNext: 'Paris Jusqu\'au Niveau Suivant',
    
    // Referral
    referralProgram: 'Programme de Parrainage',
    yourReferralCode: 'Votre Code de Parrainage',
    referralEarnings: 'Gains de Parrainage',
    totalReferrals: 'Total des Parrainages',
    copyCode: 'Copier le Code',
    inviteFriend: 'Inviter un Ami',
    referralBonus: 'Bonus de Parrainage',
    
    // Admin
    adminPanel: 'Panneau d\'Administration',
    totalUsers: 'Total des Utilisateurs',
    activeUsers: 'Utilisateurs Actifs',
    revenue: 'Revenus',
    houseEdge: 'Avantage de la Maison',
    userManagement: 'Gestion des Utilisateurs',
    statistics: 'Statistiques',
    recentBets: 'Paris Récents',
    dashboard: 'Tableau de Bord',
    users: 'Utilisateurs',
    bets: 'Paris',
    backToGame: 'Retour au Jeu',
    weeklyActive: 'Actifs cette semaine',
    todayBets: 'Paris d\'aujourd\'hui',
    editBalance: 'Modifier le Solde',
    updateBalance: 'Mettre à jour le Solde',
    betHistory: 'Historique des Paris',
    userStats: 'Statistiques Utilisateur',
    netProfit: 'Profit Net',
    
    // History
    bettingHistory: 'Historique des Paris',
    date: 'Date',
    bet: 'Pari',
    result: 'Résultat',
    profit: 'Profit',
    
    // Auth
    login: 'Connexion',
    register: 'S\'inscrire',
    email: 'Email',
    password: 'Mot de Passe',
    username: 'Nom d\'utilisateur',
    confirmPassword: 'Confirmer le Mot de Passe',
    welcomeBonus: 'Bonus de Bienvenue',
    
    // Messages
    insufficientBalance: 'Solde Insuffisant',
    betPlaced: 'Pari Placé',
    welcomeBack: 'Bienvenue',
    dailyBonusClaimed: 'Bonus Quotidien Réclamé!',
    referralCodeCopied: 'Code de parrainage copié',
    userNotFound: 'Utilisateur non trouvé',
    invalidCredentials: 'Identifiants invalides',
    registrationSuccess: 'Inscription réussie',
    
    // Time
    seconds: 'secondes',
    minutes: 'minutes',
    hours: 'heures',
    days: 'jours',
    ago: 'il y a',
    
    // Actions
    claim: 'Réclamer',
    copy: 'Copier',
    share: 'Partager',
    view: 'Voir',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    
    // Near-Miss System
    nearMiss: 'Presque!',
    soClose: 'Si Proche!',
    oneNumberAway: 'À Un Numéro Près!',
    almostWon: 'Presque Gagné!',
    
    // Multipliers
    anticipationMultiplier: 'Multiplicateur d\'Anticipation',
    countingDown: 'Compte à rebours...',
    revealingResult: 'Révélation du résultat...',
    currentWinChance: 'Chance de Gain Actuelle'
  },
  
  ru: {
    // General
    title: 'Ставка на Число',
    balance: 'Баланс',
    logout: 'Выйти',
    hello: 'Привет',
    back: 'Назад',
    close: 'Закрыть',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    
    // Game
    selectNumber: 'Выберите Число',
    range: 'Диапазон',
    attempts: 'Попытки',
    betAmount: 'Сумма Ставки',
    play: 'Ставка',
    winChance: 'Шанс Выигрыша',
    payoutRatio: 'Коэффициент Выплаты',
    potentialWin: 'Потенциальный Выигрыш',
    win: 'Вы Выиграли!',
    lose: 'Не в Этот Раз',
    yourNumber: 'Ваши Числа',
    systemNumbers: 'Выпавшее Число',
    tryAgain: 'Попробуйте Снова',
    spinning: 'Вращение...',
    
    // Statistics
    hotNumbers: 'Горячие Числа',
    coldNumbers: 'Холодные Числа',
    recentWins: 'Недавние Выигрыши',
    leaderboard: 'Таблица Лидеров',
    totalBets: 'Всего Ставок',
    totalWins: 'Всего Выигрышей',
    winRate: 'Процент Выигрыша',
    totalBetAmount: 'Общая Сумма Ставок',
    totalWinAmount: 'Общая Сумма Выигрыша',
    biggestWin: 'Самый Большой Выигрыш',
    
    // VIP
    vipStatus: 'VIP Статус',
    vipLevel: 'VIP Уровень',
    cashback: 'Кэшбэк',
    dailyBonus: 'Ежедневный Бонус',
    benefits: 'Преимущества',
    progressToNext: 'Прогресс до Следующего Уровня',
    betsUntilNext: 'Ставок до Следующего Уровня',
    
    // Referral
    referralProgram: 'Реферальная Программа',
    yourReferralCode: 'Ваш Реферальный Код',
    referralEarnings: 'Реферальный Доход',
    totalReferrals: 'Всего Рефералов',
    copyCode: 'Копировать Код',
    inviteFriend: 'Пригласить Друга',
    referralBonus: 'Реферальный Бонус',
    
    // Admin
    adminPanel: 'Панель Администратора',
    totalUsers: 'Всего Пользователей',
    activeUsers: 'Активные Пользователи',
    revenue: 'Доход',
    houseEdge: 'Преимущество Казино',
    userManagement: 'Управление Пользователями',
    statistics: 'Статистика',
    recentBets: 'Недавние Ставки',
    dashboard: 'Панель Управления',
    users: 'Пользователи',
    bets: 'Ставки',
    backToGame: 'Вернуться к Игре',
    weeklyActive: 'Активны на этой неделе',
    todayBets: 'Ставки сегодня',
    editBalance: 'Изменить Баланс',
    updateBalance: 'Обновить Баланс',
    betHistory: 'История Ставок',
    userStats: 'Статистика Пользователя',
    netProfit: 'Чистая Прибыль',
    
    // History
    bettingHistory: 'История Ставок',
    date: 'Дата',
    bet: 'Ставка',
    result: 'Результат',
    profit: 'Прибыль',
    
    // Auth
    login: 'Войти',
    register: 'Регистрация',
    email: 'Электронная почта',
    password: 'Пароль',
    username: 'Имя пользователя',
    confirmPassword: 'Подтвердите Пароль',
    welcomeBonus: 'Приветственный Бонус',
    
    // Messages
    insufficientBalance: 'Недостаточный Баланс',
    betPlaced: 'Ставка Сделана',
    welcomeBack: 'С Возвращением',
    dailyBonusClaimed: 'Ежедневный Бонус Получен!',
    referralCodeCopied: 'Реферальный код скопирован',
    userNotFound: 'Пользователь не найден',
    invalidCredentials: 'Неверные учетные данные',
    registrationSuccess: 'Регистрация успешна',
    
    // Time
    seconds: 'секунды',
    minutes: 'минуты',
    hours: 'часы',
    days: 'дни',
    ago: 'назад',
    
    // Actions
    claim: 'Получить',
    copy: 'Копировать',
    share: 'Поделиться',
    view: 'Просмотр',
    edit: 'Редактировать',
    delete: 'Удалить',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    search: 'Поиск',
    filter: 'Фильтр',
    export: 'Экспорт',
    
    // Near-Miss System
    nearMiss: 'Почти!',
    soClose: 'Так Близко!',
    oneNumberAway: 'Всего Одно Число!',
    almostWon: 'Почти Выиграли!',
    
    // Multipliers
    anticipationMultiplier: 'Множитель Ожидания',
    countingDown: 'Обратный отсчет...',
    revealingResult: 'Раскрытие результата...',
    currentWinChance: 'Текущий Шанс Выигрыша'
  },
  
  ka: {
    // General
    title: 'რიცხვზე ფსონი',
    balance: 'ბალანსი',
    logout: 'გასვლა',
    hello: 'გამარჯობა',
    back: 'უკან',
    close: 'დახურვა',
    loading: 'იტვირთება...',
    error: 'შეცდომა',
    success: 'წარმატება',
    
    // Game
    selectNumber: 'აირჩიეთ რიცხვი',
    range: 'დიაპაზონი',
    attempts: 'მცდელობები',
    betAmount: 'ფსონის თანხა',
    play: 'ფსონი',
    winChance: 'მოგების შანსი',
    payoutRatio: 'გადახდის კოეფიციენტი',
    potentialWin: 'პოტენციური მოგება',
    win: 'თქვენ მოიგეთ!',
    lose: 'ამჯერად არა',
    yourNumber: 'თქვენი რიცხვები',
    systemNumbers: 'გათამაშებული რიცხვი',
    tryAgain: 'კიდევ სცადეთ',
    spinning: 'ტრიალებს...',
    
    // Statistics
    hotNumbers: 'ცხელი რიცხვები',
    coldNumbers: 'ცივი რიცხვები',
    recentWins: 'ბოლო მოგებები',
    leaderboard: 'ლიდერების დაფა',
    totalBets: 'სულ ფსონები',
    totalWins: 'სულ მოგებები',
    winRate: 'მოგების მაჩვენებელი',
    totalBetAmount: 'ფსონების ჯამური თანხა',
    totalWinAmount: 'მოგებების ჯამური თანხა',
    biggestWin: 'ყველაზე დიდი მოგება',
    
    // VIP
    vipStatus: 'VIP სტატუსი',
    vipLevel: 'VIP დონე',
    cashback: 'ქეშბექი',
    dailyBonus: 'ყოველდღიური ბონუსი',
    benefits: 'უპირატესობები',
    progressToNext: 'პროგრესი შემდეგ დონემდე',
    betsUntilNext: 'ფსონები შემდეგ დონემდე',
    
    // Referral
    referralProgram: 'რეფერალური პროგრამა',
    yourReferralCode: 'თქვენი რეფერალური კოდი',
    referralEarnings: 'რეფერალური შემოსავალი',
    totalReferrals: 'სულ რეფერალები',
    copyCode: 'კოდის კოპირება',
    inviteFriend: 'მეგობრის მოწვევა',
    referralBonus: 'რეფერალური ბონუსი',
    
    // Admin
    adminPanel: 'ადმინ პანელი',
    totalUsers: 'სულ მომხმარებლები',
    activeUsers: 'აქტიური მომხმარებლები',
    revenue: 'შემოსავალი',
    houseEdge: 'სახლის უპირატესობა',
    userManagement: 'მომხმარებლების მართვა',
    statistics: 'სტატისტიკა',
    recentBets: 'ბოლო ფსონები',
    dashboard: 'საინფორმაციო დაფა',
    users: 'მომხმარებლები',
    bets: 'ფსონები',
    backToGame: 'თამაშზე დაბრუნება',
    weeklyActive: 'აქტიური ამ კვირაში',
    todayBets: 'დღევანდელი ფსონები',
    editBalance: 'ბალანსის რედაქტირება',
    updateBalance: 'ბალანსის განახლება',
    betHistory: 'ფსონების ისტორია',
    userStats: 'მომხმარებლის სტატისტიკა',
    netProfit: 'წმინდა მოგება',
    
    // History
    bettingHistory: 'ფსონების ისტორია',
    date: 'თარიღი',
    bet: 'ფსონი',
    result: 'შედეგი',
    profit: 'მოგება',
    
    // Auth
    login: 'შესვლა',
    register: 'რეგისტრაცია',
    email: 'ელ.ფოსტა',
    password: 'პაროლი',
    username: 'მომხმარებლის სახელი',
    confirmPassword: 'პაროლის დადასტურება',
    welcomeBonus: 'მისალმების ბონუსი',
    
    // Messages
    insufficientBalance: 'არასაკმარისი ბალანსი',
    betPlaced: 'ფსონი დადებულია',
    welcomeBack: 'კეთილი იყოს თქვენი დაბრუნება',
    dailyBonusClaimed: 'ყოველდღიური ბონუსი მიღებულია!',
    referralCodeCopied: 'რეფერალური კოდი დაკოპირდა',
    userNotFound: 'მომხმარებელი ვერ მოიძებნა',
    invalidCredentials: 'არასწორი მონაცემები',
    registrationSuccess: 'რეგისტრაცია წარმატებულია',
    
    // Time
    seconds: 'წამი',
    minutes: 'წუთი',
    hours: 'საათი',
    days: 'დღე',
    ago: 'წინ',
    
    // Actions
    claim: 'მიღება',
    copy: 'კოპირება',
    share: 'გაზიარება',
    view: 'ნახვა',
    edit: 'რედაქტირება',
    delete: 'წაშლა',
    save: 'შენახვა',
    cancel: 'გაუქმება',
    confirm: 'დადასტურება',
    search: 'ძებნა',
    filter: 'ფილტრი',
    export: 'ექსპორტი',
    
    // Near-Miss System
    nearMiss: 'თითქმის!',
    soClose: 'ძალიან ახლოს!',
    oneNumberAway: 'მხოლოდ ერთი რიცხვით!',
    almostWon: 'თითქმის მოიგეთ!',
    
    // Multipliers
    anticipationMultiplier: 'მოლოდინის მულტიპლიკატორი',
    countingDown: 'უკუთვლა...',
    revealingResult: 'შედეგის გამოვლენა...',
    currentWinChance: 'მიმდინარე მოგების შანსი'
  }
};