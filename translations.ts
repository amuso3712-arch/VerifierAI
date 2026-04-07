
export type Language = 'uz' | 'en';

export const translations = {
  en: {
    welcome: "Welcome",
    tagline: "Global Forensic Lab",
    dashboard: "Dashboard",
    auditLab: "Audit Lab",
    certificates: "Certificates",
    archive: "Archive",
    profile: "Profile",
    adminPanel: "Admin Panel",
    signOut: "Sign Out",
    purgeData: "Purge All Data",
    upgradePro: "Upgrade to Pro",
    proStatus: "PRO",
    apiHealth: "API Health",
    initializing: "Initializing Forensic Core",
    login: "Login",
    register: "Register",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    enterName: "Enter your name",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    passwordTooShort: "Password must be at least 6 characters",
    invalidEmail: "Please enter a valid email address",
    connectionError: "Connection error. Please try again.",
    noAccount: "Don't have an account? Register",
    hasAccount: "Already have an account? Login",
    orContinue: "Or continue with",
    demoLogin: "Demo Login",
    selectLanguage: "Select Language",
    continueIn: "In which language would you like to continue?",
    uzbek: "O'zbekcha",
    english: "English",
    getStarted: "Get Started",
    nextStep: "Next Step",
    back: "Back",
    onboarding: [
      {
        title: "Welcome to VerifierAI",
        description: "The most advanced AI-powered certificate forensic engine. Let's show you how to verify documents with 99.9% precision."
      },
      {
        title: "Select Category",
        description: "Choose the type of certificate you want to verify. We support IELTS, TOEFL, and many custom certificates managed by admins."
      },
      {
        title: "Upload & Scan",
        description: "Drag and drop your PDF or image. Our AI will perform a deep forensic scan, checking for pixel manipulation and metadata anomalies."
      },
      {
        title: "Analyze Results",
        description: "Review the risk score and forensic flags. Valid documents get a digital stamp, while suspicious ones are flagged for manual review."
      },
      {
        title: "Go Pro",
        description: "Upgrade to Pro for unlimited daily verifications and access to our deepest forensic analysis models."
      }
    ],
    stats: {
      xp: "XP Progress",
      level: "Level",
      streak: "Day Streak",
      quotaSaved: "Quota Saved",
      history: "Recent Audits"
    },
    profileTabs: {
      info: "Info",
      stats: "Stats",
      security: "Security"
    },
    securityActions: {
      logoutAll: "Logout from all devices",
      restartTutorial: "Restart Tutorial"
    },
    welcomeDesc: "Your global forensic laboratory for certificate verification. Analyze, verify, and secure with neural precision.",
    upgradeToPro: "Upgrade to Pro",
    themeToggle: "Toggle Theme",
    newAudit: "New Audit Lab",
    proTitle: "Unlock Deep Forensic Analysis",
    proDesc: "Get access to pixel-level manipulation detection, metadata forensic audit, and unlimited daily scans.",
    upgradeNow: "Upgrade Now",
    upgradePage: {
      title: "Upgrade to VerifierAI PRO",
      subtitle: "Unlock the full power of our neural forensic engine",
      features: [
        "Unlimited Daily Audits",
        "Deep Pixel Manipulation Detection",
        "Metadata Forensic Audit",
        "Batch Processing (Up to 50 files)",
        "PDF Forensic Reports",
        "Priority AI Processing",
        "Custom Audit Rules Support"
      ],
      price: "$29.99/month",
      payNow: "Pay with Secure Checkout",
      securePayment: "Secure SSL Encrypted Payment",
      processing: "Processing Payment...",
      success: "Payment Successful!",
      successDesc: "Welcome to the PRO community. Your account has been upgraded.",
      backToDashboard: "Back to Dashboard"
    },
    totalAudits: "Total Audits",
    batchSessions: "Batch Sessions",
    auditPoints: "Audit Points",
    quotaSaved: "Quota Saved",
    recentActivity: "Recent Activity",
    verifier: {
      title: "Neural Forensic Lab",
      description: "Upload any certificate for a deep neural forensic scan. Our AI detects pixel-level manipulation with 99.9% accuracy.",
      autoDetect: "Auto-Detect Certificate",
      singleFile: "Single Audit",
      singleFileDesc: "Upload one PDF or Image",
      batchUpload: "Batch Processing",
      batchUploadDesc: "Upload multiple files (PRO)",
      qrScanner: "QR Forensic Scan",
      qrScannerDesc: "Scan QR codes directly",
      processingBatch: "Processing Neural Batch",
      processingDesc: "Our AI is analyzing multiple documents simultaneously..."
    },
    forensic: {
      reportTitle: "VerifierAI Forensic Report",
      candidate: "Candidate",
      certificate: "Certificate",
      status: "Status",
      verified: "VERIFIED",
      invalid: "INVALID",
      riskScore: "Risk Score",
      field: "Field",
      value: "Value",
      identifier: "Identifier",
      testDate: "Test Date",
      overall: "Overall Score",
      expiry: "Expiry Date",
      organization: "Organization",
      flagsTitle: "Forensic Analysis Flags",
      passed: "PASSED",
      failed: "FAILED",
      deepDive: "Deep Forensic Dive",
      tamperEvidence: "Tamper Evidence",
      priorityScan: "Priority Deep Scan",
      deepScan: "Deep Scan",
      riskAssessment: "Risk Assessment",
      analystReport: "Forensic Analyst Report",
      noThreats: "No security threats detected.",
      structure: "Structure",
      validity: "Validity",
      integrity: "Integrity",
      antiForgery: "Anti-Forgery",
      pixelAnalysis: "Pixel Analysis",
      fontAudit: "Font Audit",
      proDeepDive: "PRO: Deep Forensic Dive",
      sourceVerification: "Source Verification",
      technicalMetadata: "Technical Metadata",
      downloadReport: "Download PDF Report",
      awaitingAnalysis: "Awaiting Analysis",
      awaitingDescription: "Upload a document to begin the neural forensic verification process."
    },
    limitedOffer: "Limited Time Offer",
    batch: "Batch",
    filesAudited: "files audited",
    valid: "valid",
    avgRisk: "Avg Risk",
    noData: "No batch reports available. Start an audit to see results here.",
    levelProgress: "Level Progress",
    detectiveQuote: '"Your detective skills are growing every day!"',
    certificateTypes: "Certificate Types",
    certLabels: {
      validity: "Validity",
      organization: "Organization",
      securityFeatures: "Security Features",
      verificationMethod: "Verification Method",
      aiElements: "AI Verification Elements"
    },
    certDetails: {
      ielts: {
        name: "IELTS",
        org: "British Council / IDP / Cambridge",
        validity: "2 years",
        security: "TRF Number, Candidate Number, Test Date, Centre Number, Logo, Passport photo",
        verification: "Official TRF Verification site",
        ai: "OCR TRF, Name match, Score range, Validity, Logo & Design, Fake risk score"
      },
      toefl: {
        name: "TOEFL",
        org: "ETS",
        validity: "2 years",
        security: "Registration Number, ETS logo, PDF/online link, Test type",
        verification: "ETS Verification System",
        ai: "OCR Registration number, Module score, Validity, Name match, Fake detection"
      },
      cambridge: {
        name: "Cambridge English",
        org: "Cambridge Assessment English",
        validity: "Lifetime",
        security: "Candidate ID, Certificate Number, Watermark",
        verification: "Cambridge Results Verification",
        ai: "OCR Certificate number, CEFR level (A1–C2), Name match, Design check"
      },
      pte: {
        name: "PTE",
        org: "Pearson",
        validity: "2 years",
        security: "Candidate ID, Test centre info, Online verification",
        verification: "Pearson PTE Verification",
        ai: "OCR Candidate ID, Score mapping, Validity, Name match"
      },
      duolingo: {
        name: "Duolingo English Test",
        org: "Duolingo",
        validity: "2 years",
        security: "Online verification, QR code",
        verification: "Duolingo platform",
        ai: "OCR / API verification, Score check, Name match"
      },
      goethe: {
        name: "Goethe Zertifikat",
        org: "Goethe Institut",
        validity: "Lifetime",
        security: "QR code, Official stamp, Special print protection",
        verification: "Goethe Institut verification",
        ai: "OCR Certificate ID, Level check (A1–C2), Name match, Logo/design"
      },
      testdaf: {
        name: "TestDaF",
        org: "TestDaF Institute",
        validity: "2 years",
        security: "Certificate Number, Official stamp, Logo",
        verification: "TestDaF verification portal",
        ai: "OCR Number, Level (TDN3–5), Name match, Fake detection"
      },
      dsh: {
        name: "DSH",
        org: "German Universities",
        validity: "2 years",
        security: "Certificate ID, University stamp",
        verification: "University verification",
        ai: "OCR Certificate ID, Name match, Date, Level check"
      },
      delf: {
        name: "DELF",
        org: "France Education",
        validity: "Lifetime",
        security: "Certificate number, Official stamp, Special paper, Logo",
        verification: "France Education database",
        ai: "OCR Certificate number, CEFR level, Name match, Design check"
      },
      dalf: {
        name: "DALF",
        org: "France Education",
        validity: "Lifetime",
        security: "Certificate number, Official stamp, Special paper, Logo",
        verification: "France Education database",
        ai: "OCR Certificate number, CEFR level (C1–C2), Name match, Design check"
      },
      tcf: {
        name: "TCF",
        org: "France Education",
        validity: "2–3 years",
        security: "Certificate number, Logo, Stamp",
        verification: "France Education verification portal",
        ai: "OCR Certificate number, Level, Name match, Date"
      },
      torfl: {
        name: "TORFL",
        org: "Russian State",
        validity: "Lifetime",
        security: "Certificate number, Stamp, Logo",
        verification: "Russian university verification",
        ai: "OCR Certificate number, Level, Name match, Design check"
      },
      hsk: {
        name: "HSK",
        org: "Chinese Test",
        validity: "2 years",
        security: "QR code, Online verification link, Logo",
        verification: "ChineseTest.cn verification",
        ai: "OCR Certificate number, Level (1–6), Name match, Fake detection"
      },
      hskk: {
        name: "HSKK",
        org: "Chinese Test",
        validity: "2 years",
        security: "QR code, Online verification link, Logo",
        verification: "ChineseTest.cn verification",
        ai: "OCR Certificate number, Speaking score, Name match"
      },
      jlpt: {
        name: "JLPT",
        org: "Japan Foundation",
        validity: "Lifetime",
        security: "Registration number, Logo, Stamp",
        verification: "JLPT verification",
        ai: "OCR Registration number, Level (N5–N1), Name match"
      },
      topik: {
        name: "TOPIK",
        org: "South Korea",
        validity: "2 years",
        security: "Candidate number, QR code, Logo",
        verification: "TOPIK official site",
        ai: "OCR Candidate number, Level, Name match, Fake detection"
      },
      dele: {
        name: "DELE",
        org: "Instituto Cervantes",
        validity: "Lifetime",
        security: "Certificate number, Stamp, Logo",
        verification: "Instituto Cervantes verification",
        ai: "OCR Certificate number, Level (A1–C2), Name match, Design check"
      },
      siele: {
        name: "SIELE",
        org: "Instituto Cervantes",
        validity: "3 years",
        security: "QR code, Digital signature, Online link",
        verification: "SIELE online verification",
        ai: "OCR / API verification, Level, Name match, Digital signature check"
      }
    },
    userProfile: "User Profile",
    profileUpdated: "Profile updated successfully!",
    updateError: "Error updating profile",
    newPasswordPlaceholder: "New password (leave blank to keep current)",
    saveChanges: "Save Changes",
    updating: "Updating...",
    security: {
      title: "Security & Access",
      logoutAllDesc: "Sign out from all other active sessions on other devices.",
      restartTutorialDesc: "Reset your onboarding progress and see the guide again.",
      dangerZone: "Danger Zone",
      dangerDesc: "Sign out from all sessions and clear cache.",
      logoutAllBtn: "Logout All Sessions",
      tutorialTitle: "Watch Tutorial Again",
      tutorialDesc: "If you have questions about using the system, you can watch the guide again.",
      startTutorial: "Start Tutorial"
    },
    accountInfo: "Account Information",
    role: "Role",
    plan: "Plan",
    memberSince: "Member Since",
    upgradeNowBtn: "UPGRADE NOW",
    noAudits: "No audits available yet.",
    admin: {
      title: "Admin Panel",
      dashboard: "Dashboard",
      certificates: "Certificates",
      users: "Users",
      totalUsers: "Total Users",
      proUsers: "Pro Users",
      totalCerts: "Total Certificates",
      addCert: "Add New Certificate",
      editCert: "Edit Certificate",
      certName: "Certificate Name",
      organization: "Organization",
      description: "Description",
      icon: "Icon (FontAwesome)",
      auditRules: "Audit Rules (JSON)",
      save: "Save Certificate",
      cancel: "Cancel",
      searchPlaceholder: "Search certificates...",
      deleteConfirm: "Are you sure you want to delete this certificate?",
      userList: "User Management",
      userName: "Name",
      userEmail: "Email",
      userPlan: "Plan",
      actions: "Actions",
      makePro: "Make PRO",
      makeFree: "Make FREE"
    }
  },
  uz: {
    welcome: "Xush kelibsiz",
    tagline: "Global Ekspertiza Laboratoriyasi",
    dashboard: "Boshqaruv paneli",
    auditLab: "Audit laboratoriyasi",
    certificates: "Sertifikatlar",
    archive: "Arxiv",
    profile: "Profil",
    adminPanel: "Admin paneli",
    signOut: "Chiqish",
    purgeData: "Barcha ma'lumotlarni o'chirish",
    upgradePro: "PRO-ga o'tish",
    proStatus: "PRO",
    apiHealth: "API holati",
    initializing: "Ekspertiza yadrosi yuklanmoqda",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    email: "Email manzili",
    password: "Parol",
    fullName: "To'liq ism",
    enterName: "Ismingizni kiriting",
    enterEmail: "Emailingizni kiriting",
    enterPassword: "Parolingizni kiriting",
    passwordTooShort: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    invalidEmail: "Iltimos, to'g'ri email manzilini kiriting",
    connectionError: "Ulanishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
    noAccount: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
    hasAccount: "Hisobingiz bormi? Kirish",
    orContinue: "Yoki davom eting",
    demoLogin: "Demo kirish",
    selectLanguage: "Tilni tanlang",
    continueIn: "Qaysi tilda davom ettirmoqchisiz?",
    uzbek: "O'zbekcha",
    english: "English",
    getStarted: "BOSHLASH",
    nextStep: "KEYINGI QADAM",
    back: "ORQAGA",
    onboarding: [
      {
        title: "VerifierAI-ga xush kelibsiz",
        description: "Eng ilg'or sun'iy intellektga asoslangan sertifikat ekspertiza tizimi. Hujjatlarni 99.9% aniqlikda tekshirishni o'rgatamiz."
      },
      {
        title: "Kategoriyani tanlang",
        description: "Tekshirmoqchi bo'lgan sertifikat turini tanlang. Biz IELTS, TOEFL va ko'plab maxsus sertifikatlarni qo'llab-quvvatlaymiz."
      },
      {
        title: "Yuklash va skanerlash",
        description: "PDF yoki rasmni yuklang. Bizning AI piksel manipulyatsiyasi va metadata anomaliyalarini tekshirib, chuqur tahlil o'tkazadi."
      },
      {
        title: "Natijalarni tahlil qilish",
        description: "Xavf darajasi va ekspertiza belgilarini ko'rib chiqing. Haqiqiy hujjatlar raqamli muhr oladi, shubhali hujjatlar esa belgilanadi."
      },
      {
        title: "PRO-ga o'ting",
        description: "Cheksiz kunlik tekshiruvlar va eng chuqur tahlil modellariga kirish uchun PRO versiyasiga o'ting."
      }
    ],
    stats: {
      xp: "XP darajasi",
      level: "Daraja",
      streak: "Kunlik seriya",
      quotaSaved: "Tejalgan kvota",
      history: "Oxirgi auditlar"
    },
    profileTabs: {
      info: "Ma'lumotlar",
      stats: "Statistika",
      security: "Xavfsizlik"
    },
    securityActions: {
      logoutAll: "Barcha qurilmalardan chiqish",
      restartTutorial: "Qo'llanmani qayta boshlash"
    },
    welcomeDesc: "Sertifikatlarni tekshirish uchun global ekspertiza laboratoriyangiz. Neyron aniqlik bilan tahlil qiling, tekshiring va himoya qiling.",
    upgradeToPro: "PRO-ga o'tish",
    themeToggle: "Mavzuni o'zgartirish",
    newAudit: "Yangi Audit Laboratoriyasi",
    proTitle: "Chuqur Ekspertiza Tahlilini Ochish",
    proDesc: "Piksel darajasidagi manipulyatsiyani aniqlash, metadata ekspertiza auditi va cheksiz kunlik skanerlash imkoniyatiga ega bo'ling.",
    upgradeNow: "Hozir yangilang",
    upgradePage: {
      title: "VerifierAI PRO'ga o'tish",
      subtitle: "Bizning neyronli sud ekspertizasi dvigatelining to'liq quvvatini oching",
      features: [
        "Cheksiz kunlik auditlar",
        "Piksel darajasidagi manipulyatsiyani aniqlash",
        "Metadata sud auditi",
        "To'plamli ishlov berish (50 tagacha fayl)",
        "PDF sud hisobotlari",
        "Ustuvor AI ishlov berish",
        "Maxsus audit qoidalarini qo'llab-quvvatlash"
      ],
      price: "$29.99/oy",
      payNow: "Xavfsiz to'lovni amalga oshirish",
      securePayment: "Xavfsiz SSL shifrlangan to'lov",
      processing: "To'lov amalga oshirilmoqda...",
      success: "To'lov muvaffaqiyatli yakunlandi!",
      successDesc: "PRO hamjamiyatiga xush kelibsiz. Hisobingiz yangilandi.",
      backToDashboard: "Boshqaruv paneliga qaytish"
    },
    totalAudits: "Jami auditlar",
    batchSessions: "To'plam sessiyalari",
    auditPoints: "Audit ballari",
    quotaSaved: "Tejalgan kvota",
    recentActivity: "Oxirgi faoliyat",
    verifier: {
      title: "Neyron Ekspertiza Laboratoriyasi",
      description: "Har qanday sertifikatni chuqur neyron ekspertiza skanerlash uchun yuklang. Bizning AI piksel darajasidagi manipulyatsiyani 99.9% aniqlikda aniqlaydi.",
      autoDetect: "Sertifikatni avtomatik aniqlash",
      singleFile: "Yagona Audit",
      singleFileDesc: "Bitta PDF yoki rasm yuklang",
      batchUpload: "To'plamli ishlov berish",
      batchUploadDesc: "Bir nechta fayllarni yuklang (PRO)",
      qrScanner: "QR Ekspertiza Skaneri",
      qrScannerDesc: "QR kodlarni to'g'ridan-to'g'ri skanerlang",
      processingBatch: "Neyron to'plamga ishlov berilmoqda",
      processingDesc: "Bizning AI bir vaqtning o'zida bir nechta hujjatlarni tahlil qilmoqda..."
    },
    forensic: {
      reportTitle: "VerifierAI Ekspertiza Hisoboti",
      candidate: "Nomzod",
      certificate: "Sertifikat",
      status: "Holat",
      verified: "TASDIQLANDI",
      invalid: "YAROQSIZ",
      riskScore: "Xavf darajasi",
      field: "Maydon",
      value: "Qiymat",
      identifier: "Identifikator",
      testDate: "Sana",
      overall: "Umumiy score",
      expiry: "Amal qilish muddati",
      organization: "Tashkilot",
      flagsTitle: "Ekspertiza tahlili belgilari",
      passed: "O'TDI",
      failed: "O'TMADI",
      deepDive: "Chuqur ekspertiza tahlili",
      tamperEvidence: "Manipulyatsiya belgilari",
      priorityScan: "Ustuvor chuqur skanerlash",
      deepScan: "Chuqur skanerlash",
      riskAssessment: "Xavfni baholash",
      analystReport: "Ekspert tahliliy hisoboti",
      noThreats: "Xavfsizlikka tahdidlar aniqlanmadi.",
      structure: "Tuzilishi",
      validity: "Haqiqiyligi",
      integrity: "Butunligi",
      antiForgery: "Qalbaki hujjatlarga qarshi",
      pixelAnalysis: "Piksel tahlili",
      fontAudit: "Shrift auditi",
      proDeepDive: "PRO: Chuqur ekspertiza tahlili",
      sourceVerification: "Manbani tekshirish",
      technicalMetadata: "Texnik metadata",
      downloadReport: "PDF hisobotni yuklab olish",
      awaitingAnalysis: "Tahlil kutilmoqda",
      awaitingDescription: "Neyron ekspertiza tekshiruvi jarayonini boshlash uchun hujjat yuklang."
    },
    limitedOffer: "Cheklangan vaqtli taklif",
    batch: "To'plam",
    filesAudited: "fayl tekshirildi",
    valid: "haqiqiy",
    avgRisk: "O'rtacha xavf",
    noData: "Hozircha ma'lumot yo'q. Tekshirishni boshlang.",
    levelProgress: "Daraja rivoji",
    detectiveQuote: '"Sizning detektivlik mahoratingiz kundan-kunga oshib bormoqda!"',
    certificateTypes: "Sertifikat turlari",
    certLabels: {
      validity: "Amal qilish muddati",
      organization: "Tashkilot",
      securityFeatures: "Xavfsizlik belgilari",
      verificationMethod: "Tekshirish usuli",
      aiElements: "AI tekshiruv elementlari"
    },
    certDetails: {
      ielts: {
        name: "IELTS",
        org: "British Council / IDP / Cambridge",
        validity: "2 yil",
        security: "TRF raqami, Nomzod raqami, Test sanasi, Markaz raqami, Logo, Pasport rasmi",
        verification: "Rasmiy TRF tekshirish sayti",
        ai: "OCR TRF, Ism-familiya mosligi, Ball diapazoni, Muddat, Logo va dizayn, Qalbaki xavf bali"
      },
      toefl: {
        name: "TOEFL",
        org: "ETS",
        validity: "2 yil",
        security: "Ro'yxatdan o'tish raqami, ETS logotipi, PDF/onlayn havola, Test turi",
        verification: "ETS tekshirish tizimi",
        ai: "OCR Ro'yxatdan o'tish raqami, Modul bali, Muddat, Ism mosligi, Qalbaki aniqlash"
      },
      cambridge: {
        name: "Cambridge English",
        org: "Cambridge Assessment English",
        validity: "Umrbod",
        security: "Nomzod ID, Sertifikat raqami, Suv belgisi",
        verification: "Cambridge natijalarini tekshirish",
        ai: "OCR Sertifikat raqami, CEFR darajasi (A1–C2), Ism mosligi, Dizayn tekshiruvi"
      },
      pte: {
        name: "PTE",
        org: "Pearson",
        validity: "2 yil",
        security: "Nomzod ID, Test markazi ma'lumotlari, Onlayn tekshirish",
        verification: "Pearson PTE tekshiruvi",
        ai: "OCR Nomzod ID, Ballar xaritasi, Muddat, Ism mosligi"
      },
      duolingo: {
        name: "Duolingo English Test",
        org: "Duolingo",
        validity: "2 yil",
        security: "Onlayn tekshirish, QR kod",
        verification: "Duolingo platformasi",
        ai: "OCR / API tekshiruvi, Ball tekshiruvi, Ism mosligi"
      },
      goethe: {
        name: "Goethe Zertifikat",
        org: "Goethe Institut",
        validity: "Umrbod",
        security: "QR kod, Rasmiy muhr, Maxsus bosma himoya",
        verification: "Goethe Institut tekshiruvi",
        ai: "OCR Sertifikat ID, Daraja tekshiruvi (A1–C2), Ism mosligi, Logo/dizayn"
      },
      testdaf: {
        name: "TestDaF",
        org: "TestDaF Institute",
        validity: "2 yil",
        security: "Sertifikat raqami, Rasmiy muhr, Logo",
        verification: "TestDaF tekshirish portali",
        ai: "OCR raqami, Daraja (TDN3–5), Ism mosligi, Qalbaki aniqlash"
      },
      dsh: {
        name: "DSH",
        org: "German Universitetlari",
        validity: "2 yil",
        security: "Sertifikat ID, Universitet muhri",
        verification: "Universitet tekshiruvi",
        ai: "OCR Sertifikat ID, Ism mosligi, Sana, Daraja tekshiruvi"
      },
      delf: {
        name: "DELF",
        org: "France Education",
        validity: "Umrbod",
        security: "Sertifikat raqami, Rasmiy muhr, Maxsus qog'oz, Logo",
        verification: "France Education ma'lumotlar bazasi",
        ai: "OCR Sertifikat raqami, CEFR darajasi, Ism mosligi, Dizayn tekshiruvi"
      },
      dalf: {
        name: "DALF",
        org: "France Education",
        validity: "Umrbod",
        security: "Sertifikat raqami, Rasmiy muhr, Maxsus qog'oz, Logo",
        verification: "France Education ma'lumotlar bazasi",
        ai: "OCR Sertifikat raqami, CEFR darajasi (C1–C2), Ism mosligi, Dizayn tekshiruvi"
      },
      tcf: {
        name: "TCF",
        org: "France Education",
        validity: "2–3 yil",
        security: "Sertifikat raqami, Logo, Muhr",
        verification: "France Education tekshirish portali",
        ai: "OCR Sertifikat raqami, Daraja, Ism mosligi, Sana"
      },
      torfl: {
        name: "TORFL",
        org: "Rossiya Davlat",
        validity: "Umrbod",
        security: "Sertifikat raqami, Muhr, Logo",
        verification: "Rossiya universiteti tekshiruvi",
        ai: "OCR Sertifikat raqami, Daraja, Ism mosligi, Dizayn tekshiruvi"
      },
      hsk: {
        name: "HSK",
        org: "Chinese Test",
        validity: "2 yil",
        security: "QR kod, Onlayn tekshirish havolasi, Logo",
        verification: "ChineseTest.cn tekshiruvi",
        ai: "OCR Sertifikat raqami, Daraja (1–6), Ism mosligi, Qalbaki aniqlash"
      },
      hskk: {
        name: "HSKK",
        org: "Chinese Test",
        validity: "2 yil",
        security: "QR kod, Onlayn tekshirish havolasi, Logo",
        verification: "ChineseTest.cn tekshiruvi",
        ai: "OCR Sertifikat raqami, Gapirish bali, Ism mosligi"
      },
      jlpt: {
        name: "HSK",
        org: "Japan Foundation",
        validity: "Umrbod",
        security: "Ro'yxatdan o'tish raqami, Logo, Muhr",
        verification: "JLPT tekshiruvi",
        ai: "OCR Ro'yxatdan o'tish raqami, Daraja (N5–N1), Ism mosligi"
      },
      topik: {
        name: "TOPIK",
        org: "Janubiy Koreya",
        validity: "2 yil",
        security: "Nomzod raqami, QR kod, Logo",
        verification: "TOPIK rasmiy sayti",
        ai: "OCR Nomzod raqami, Daraja, Ism mosligi, Qalbaki aniqlash"
      },
      dele: {
        name: "DELE",
        org: "Instituto Cervantes",
        validity: "Umrbod",
        security: "Sertifikat raqami, Muhr, Logo",
        verification: "Instituto Cervantes tekshiruvi",
        ai: "OCR Sertifikat raqami, Daraja (A1–C2), Ism mosligi, Dizayn tekshiruvi"
      },
      siele: {
        name: "SIELE",
        org: "Instituto Cervantes",
        validity: "3 yil",
        security: "QR kod, Raqamli imzo, Onlayn havola",
        verification: "SIELE onlayn tekshiruvi",
        ai: "OCR / API tekshiruvi, Daraja, Ism mosligi, Raqamli imzo tekshiruvi"
      }
    },
    userProfile: "Foydalanuvchi profili",
    profileUpdated: "Profil muvaffaqiyatli yangilandi!",
    updateError: "Yangilashda xatolik",
    newPasswordPlaceholder: "Yangi parol (o'zgartirmaslik uchun bo'sh qoldiring)",
    saveChanges: "O'zgarishlarni saqlash",
    updating: "Yangilanmoqda...",
    security: {
      title: "Xavfsizlik va kirish",
      logoutAllDesc: "Boshqa qurilmalardagi barcha faol seanslardan chiqing.",
      restartTutorialDesc: "Onboarding jarayonini qaytadan boshlang va qo'llanmani yana ko'ring.",
      dangerZone: "Xavfli hudud",
      dangerDesc: "Barcha qurilmalardan chiqish va keshni tozalash.",
      logoutAllBtn: "Barcha sessiyalarni yopish",
      tutorialTitle: "Tutorialni qayta ko'rish",
      tutorialDesc: "Agar tizimdan foydalanishda savollaringiz bo'lsa, yo'riqnomani qayta ko'rishingiz mumkin.",
      startTutorial: "Yo'riqnomani boshlash"
    },
    accountInfo: "Hisob ma'lumotlari",
    role: "Rol",
    plan: "Plan",
    memberSince: "A'zo bo'lgan sana",
    upgradeNowBtn: "HOZIR O'TISH",
    noAudits: "Hozircha auditlar mavjud emas.",
    admin: {
      title: "Admin paneli",
      dashboard: "Boshqaruv paneli",
      certificates: "Sertifikatlar",
      users: "Foydalanuvchilar",
      totalUsers: "Jami foydalanuvchilar",
      proUsers: "Pro foydalanuvchilar",
      totalCerts: "Jami sertifikatlar",
      addCert: "Yangi sertifikat qo'shish",
      editCert: "Sertifikatni tahrirlash",
      certName: "Sertifikat nomi",
      organization: "Tashkilot",
      description: "Tavsif",
      icon: "Ikonka (FontAwesome)",
      auditRules: "Audit qoidalari (JSON)",
      save: "Sertifikatni saqlash",
      cancel: "Bekor qilish",
      searchPlaceholder: "Sertifikatlarni qidirish...",
      deleteConfirm: "Haqiqatan ham ushbu sertifikatni o'chirib tashlamoqchimisiz?",
      userList: "Foydalanuvchilarni boshqarish",
      userName: "Ism",
      userEmail: "Email",
      userPlan: "Plan",
      actions: "Harakatlar",
      makePro: "PRO qilish",
      makeFree: "FREE qilish"
    }
  }
};
