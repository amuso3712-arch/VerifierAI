
import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  processCertificate, 
  fileToBase64, 
  compressImage, 
  generateBatchSummary,
  getFileFingerprint,
  checkCache,
  saveToCache
} from './services/geminiService';
import { VerificationResult, ProcessingStep, ProcessItem, UserStats, CertificateType, BatchReport, User, Certificate } from './types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { translations, Language } from './translations';
import { auth, db, googleProvider, microsoftProvider, appleProvider } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, increment, deleteDoc } from 'firebase/firestore';

const INITIAL_STATS: UserStats = { 
  xp: 0, 
  hearts: 5, 
  streak: 0, 
  level: 1, 
  lastActive: '', 
  unlockedUnits: ['unit-1'], 
  history: [], 
  batchReports: [],
  quotaSaved: 0,
  isPro: false,
  plan: 'free',
  dailyUsage: 0
};

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path d="M50 10L15 25V50C15 70 50 90 50 90C50 90 85 70 85 50V25L50 10Z" fill="url(#logo-grad)" />
    {/* Globe/Neural Network Pattern */}
    <circle cx="50" cy="45" r="20" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
    <ellipse cx="50" cy="45" rx="20" ry="8" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
    <ellipse cx="50" cy="45" rx="8" ry="20" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
    {/* Central Intelligence Node */}
    <circle cx="50" cy="45" r="4" fill="white" />
    <circle cx="35" cy="35" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="65" cy="35" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="50" cy="25" r="2" fill="white" fillOpacity="0.6" />
    {/* Verification Check */}
    <path d="M40 70L47 77L65 59" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OnboardingGuide: React.FC<{ onComplete: () => void; lang: Language }> = ({ onComplete, lang }) => {
  const [step, setStep] = useState(0);
  const t = translations[lang];
  const steps = [
    {
      title: t.onboarding[0].title,
      description: t.onboarding[0].description,
      icon: "fa-hand-wave",
      color: "indigo"
    },
    {
      title: t.onboarding[1].title,
      description: t.onboarding[1].description,
      icon: "fa-list-check",
      color: "amber"
    },
    {
      title: t.onboarding[2].title,
      description: t.onboarding[2].description,
      icon: "fa-cloud-arrow-up",
      color: "emerald"
    },
    {
      title: t.onboarding[3].title,
      description: t.onboarding[3].description,
      icon: "fa-magnifying-glass-chart",
      color: "rose"
    },
    {
      title: t.onboarding[4].title,
      description: t.onboarding[4].description,
      icon: "fa-crown",
      color: "violet"
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="max-w-md w-full glass p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 bg-slate-100`}>
          <div 
            className="h-full bg-indigo-600 transition-all duration-500" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="mt-4 flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl bg-${steps[step].color}-50 flex items-center justify-center mb-8 animate-bounce`}>
            <i className={`fa-solid ${steps[step].icon} text-3xl text-${steps[step].color}-600`}></i>
          </div>
          
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 mb-4 leading-none">
            {steps[step].title}
          </h2>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            {steps[step].description}
          </p>
          
          <div className="flex items-center gap-4 w-full">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all"
              >
                {t.back}
              </button>
            )}
            <button 
              onClick={nextStep}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
            >
              {step === steps.length - 1 ? t.getStarted : t.nextStep}
            </button>
          </div>
          
          <div className="mt-8 flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-600' : 'bg-slate-200'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LanguageSelector: React.FC<{ onSelect: (lang: Language) => void }> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 dark:bg-black flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full glass p-10 rounded-[3rem] shadow-2xl text-center">
        <div className="w-20 h-20 bg-white dark:bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-slate-200 dark:border-white/10">
          <i className="fa-solid fa-language text-3xl text-indigo-500 dark:text-indigo-400"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Select Language</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">Qaysi tilda davom ettirmoqchisiz?<br/>In which language would you like to continue?</p>
        
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onSelect('uz')}
            className="group relative py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between px-8 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🇺🇿</span>
              <span className="font-black text-slate-900 dark:text-white tracking-tight">O'zbekcha</span>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          </button>
          
          <button 
            onClick={() => onSelect('en')}
            className="group relative py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between px-8 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🇺🇸</span>
              <span className="font-black text-slate-900 dark:text-white tracking-tight">English</span>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Language>('uz');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verifier' | 'history' | 'certificates' | 'profile' | 'admin' | 'upgrade'>('dashboard');
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [processingItems, setProcessingItems] = useState<ProcessItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const isProcessingRef = useRef(false);
  const selectedCategoryRef = useRef<CertificateType | 'AUTO'>('IELTS');

  const apiFetch = useCallback(async (url: string, options: any = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : undefined,
      'Content-Type': options.body ? 'application/json' : undefined,
    };
    
    // Remove undefined headers
    Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key]);

    const res = await fetch(url, { ...options, headers });
    return res;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user document in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData;
          if (userDoc.exists()) {
            userData = userDoc.data();
            // Upgrade to admin if email matches but role is not admin
            if (firebaseUser.email === 'amuso3712@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' });
            }
          } else {
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.email === 'amuso3712@gmail.com' ? 'admin' : 'user',
              plan: 'free',
              language: lang,
              hasSeenTutorial: false,
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, userData);
          }
          
          setUser({
            ...userData,
            name: userData.displayName, // Mapping for existing code
          });
          
          if (userData.language) setLang(userData.language as Language);
          if (!userData.hasSeenTutorial) setShowTutorial(true);
          
        } catch (err: any) {
          console.error("Error fetching user data from Firestore", err);
          setAuthError(err.message || translations[lang].connectionError);
        }
      } else {
        setUser(null);
      }
      setIsAppLoading(false);
    });

    const fetchCerts = async () => {
      try {
        const certsCol = collection(db, 'certificates');
        const certsSnapshot = await getDocs(certsCol);
        const certsList = certsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate));
        
        if (certsList.length > 0) {
          setCertificates(certsList);
        } else {
          // Fallback to API if Firestore is empty (initial migration)
          const res = await apiFetch('/api/certificates');
          if (res.ok) {
            const data = await res.json();
            setCertificates(data.certificates);
          }
        }
      } catch (err: any) { 
        console.error("Fetch certs failed:", err.message || err); 
        if (err.message && err.message.includes("permission")) {
          console.warn("Firestore permission denied for certificates. Check security rules.");
        }
      }
    };

    const saved = localStorage.getItem('verifier_ai_stats_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats({
          ...parsed,
          batchReports: parsed.batchReports || [],
          quotaSaved: parsed.quotaSaved || 0,
          isPro: parsed.isPro || false
        });
      } catch (e) { console.error("Storage error", e); }
    }
    
    fetchCerts();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setUser(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async (provider: string, credentials?: any, modeOverride?: 'login' | 'register') => {
    setAuthError(null);
    try {
      if (provider === 'google') {
        await signInWithPopup(auth, googleProvider);
      } else if (provider === 'microsoft') {
        await signInWithPopup(auth, microsoftProvider);
      } else if (provider === 'apple') {
        await signInWithPopup(auth, appleProvider);
      } else if (provider === 'email') {
        const mode = modeOverride || authMode;
        if (mode === 'register') {
          const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
          if (credentials.name) {
            await updateProfile(userCredential.user, { displayName: credentials.name });
          }
        } else {
          await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        }
      } else if (provider === 'demo') {
        // Keep demo for testing if needed, or remove
        const res = await fetch('/api/auth/demo', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      }
    } catch (err: any) {
      console.error("Auth error", err);
      setAuthError(err.message || translations[lang].connectionError);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleLanguageSelect = async (selectedLang: Language) => {
    setLang(selectedLang);
    if (user && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { language: selectedLang });
        setUser({ ...user, language: selectedLang });
      } catch (err) { console.error(err); }
    }
  };

  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem('verifier_ai_stats_v8', JSON.stringify(newStats));
  };

  const clearAppCache = async () => {
    const confirmed = window.confirm("Barcha audit tarixi, keshlar va sessiya ma'lumotlari butunlay o'chirib tashlanadi. Tasdiqlaysizmi?");
    if (!confirmed) return;

    try {
      // Stop any further processing
      isProcessingRef.current = true;

      // 1. Logout from server
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

      // 2. Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Cleanup object URLs
      processingItems.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      // 4. Reset local state
      setStats({...INITIAL_STATS});
      setProcessingItems([]);
      setActiveBatchId(null);
      setUser(null);

      alert("Tizim to'liq tozalandi!");
      
      // 5. Hard reload to origin
      window.location.href = window.location.origin;
    } catch (err) {
      console.error("Purge error:", err);
      // Fallback: still try to reload
      localStorage.clear();
      window.location.reload();
    }
  };

  const finalizeBatch = useCallback(async (batchId: string) => {
    const batchItems = processingItems.filter(i => i.batchId === batchId && i.step === ProcessingStep.COMPLETED);
    if (batchItems.length === 0) { setActiveBatchId(null); return; }

    const results = batchItems.map(i => i.result!).filter(Boolean);
    const validCount = results.filter(r => r.status === 'VALID').length;
    const invalidCount = results.length - validCount;
    const avgRisk = results.reduce((acc, r) => acc + r.riskScore, 0) / (results.length || 1);

    try {
      const summary = await generateBatchSummary(results);
      const newReport: BatchReport = {
        id: batchId,
        totalItems: results.length,
        validCount,
        invalidCount,
        avgRiskScore: Math.round(avgRisk),
        summary,
        timestamp: new Date().toISOString()
      };
      saveStats({ ...stats, batchReports: [newReport, ...(stats.batchReports || [])].slice(0, 20) });
    } catch (err) { console.error("Batch summary error", err); } 
    finally { setActiveBatchId(null); }
  }, [processingItems, stats]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message && (event.message.includes("The string did not match the expected pattern") || event.message.includes("atob"))) {
        console.error("Caught atob error globally:", event.error || event.message);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const processNextInQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    const nextItem = processingItems.find(i => i.step === ProcessingStep.QUEUED);
    
    if (!nextItem) {
      if (activeBatchId && !processingItems.some(i => i.batchId === activeBatchId && (i.step === ProcessingStep.QUEUED || i.step === ProcessingStep.DEEP_ANALYSIS))) {
        finalizeBatch(activeBatchId);
      }
      return;
    }

    isProcessingRef.current = true;
    const category = selectedCategoryRef.current;
    const fingerprint = getFileFingerprint(nextItem.file);
    const cachedResult = checkCache(fingerprint);

    if (cachedResult) {
      setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, result: cachedResult, step: ProcessingStep.COMPLETED, isCached: true } : i));
      saveStats({ ...stats, quotaSaved: (stats.quotaSaved || 0) + 1 });
      isProcessingRef.current = false;
      return;
    }

    setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, step: ProcessingStep.DEEP_ANALYSIS } : i));

    // Check usage limit on server
    try {
      // Update Firestore usage
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          'usage.count': increment(1),
          'usage.lastReset': new Date().toISOString()
        });
      }
      
      const usageRes = await apiFetch('/api/usage/increment', { method: 'POST' });
      if (!usageRes.ok) {
        let errorMsg = "Usage check failed";
        try {
          const usageData = await usageRes.json();
          errorMsg = usageData.error || errorMsg;
        } catch (e) {
          // If not JSON, use status text or generic message
          errorMsg = `Server error: ${usageRes.status} ${usageRes.statusText}`;
        }
        
        setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, step: ProcessingStep.ERROR, error: errorMsg } : i));
        isProcessingRef.current = false;
        return;
      }
    } catch (err) {
      console.error("Usage check failed", err);
      setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, step: ProcessingStep.ERROR, error: "Connection error during usage check" } : i));
      isProcessingRef.current = false;
      return;
    }

    // Pro users must have an API key selected for pro models
    if (user?.plan === 'pro') {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
          // After opening, we should probably wait or just let the next attempt handle it
          // but the docs say "proceed to the app"
        }
      } catch (e) {
        console.error("API Key selection error", e);
      }
    }

    try {
      const rawB64 = await fileToBase64(nextItem.file);
      let finalB64 = rawB64;
      let mimeType = nextItem.file.type;
      
      if (!mimeType) {
        const name = nextItem.file.name.toLowerCase();
        if (name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (name.endsWith('.txt')) mimeType = 'text/plain';
        else if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) mimeType = 'image/jpeg';
        else mimeType = 'application/octet-stream';
      }

      if (mimeType.startsWith('image/')) {
        try {
          finalB64 = await compressImage(rawB64);
        } catch (e) {
          console.error("Compression failed, using raw base64", e);
          finalB64 = rawB64;
        }
      }
      
      const customCert = certificates.find(c => c.name === category);
      const customRules = customCert?.auditRules;

      const res = await processCertificate(finalB64, mimeType, category, user?.plan === 'pro', customRules);
      saveToCache(fingerprint, res);
      
      setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, result: res, step: ProcessingStep.COMPLETED } : i));
      
      const newHistory = [{ date: new Date().toISOString(), type: res.certificateType, score: res.riskScore }, ...stats.history].slice(0, 50);
      saveStats({ ...stats, xp: stats.xp + 200, history: newHistory });
      
      if (activeBatchId) await new Promise(r => setTimeout(r, 2000));
    } catch (err: any) {
      let errorMsg = err.message || 'Xatolik yuz berdi';
      const errStr = JSON.stringify(err);
      
      if (errStr.includes("429")) {
        errorMsg = "API Limit (429). Biroz kuting yoki PRO versiyaga o'ting.";
      } else if (errStr.includes("API key not valid") || errStr.includes("400")) {
        errorMsg = "API kaliti xato yoki topilmadi. Iltimos, sahifani yangilang yoki PRO bo'lsangiz kalitni qayta tanlang.";
        // If it's an API key error and we are pro, maybe reset key selection
        if (stats.isPro) {
          try { (window as any).aistudio.openSelectKey(); } catch(e) {}
        }
      }
      
      setProcessingItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, step: ProcessingStep.ERROR, error: errorMsg } : i));
    } finally {
      isProcessingRef.current = false;
    }
  }, [processingItems, stats, activeBatchId, finalizeBatch]);

  useEffect(() => {
    if (processingItems.some(i => i.step === ProcessingStep.QUEUED) && !isProcessingRef.current) {
      processNextInQueue();
    }
  }, [processingItems, processNextInQueue]);

  const handleUpload = (files: File[], category: CertificateType | 'AUTO', isBatch: boolean = false) => {
    if (isBatch && files.length > 3 && !stats.isPro) {
      alert("PRO versiyasiz bir vaqtning o'zida faqat 3 tagacha faylni tekshira olasiz. Iltimos, PRO'ga o'ting yoki fayllar sonini kamaytiring.");
      return;
    }
    selectedCategoryRef.current = category;
    const batchId = isBatch ? Math.random().toString(36).substr(2, 6) : undefined;
    if (isBatch) setActiveBatchId(batchId!);

    const newItems = files.map(f => ({ 
      id: Math.random().toString(36).substr(2, 9), 
      file: f, 
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '', 
      step: ProcessingStep.QUEUED,
      batchId
    }));
    setProcessingItems(prev => [...newItems, ...prev]);
    setActiveTab('verifier');
  };

  const handleUpgrade = async () => {
    if (activeTab !== 'upgrade') {
      setActiveTab('upgrade');
      return;
    }
    
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { plan: 'pro' });
        if (user) setUser({ ...user, plan: 'pro' });
        saveStats({ ...stats, isPro: true, plan: 'pro' });
      }
      
      const res = await apiFetch('/api/user/upgrade', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        saveStats({ ...stats, isPro: true, plan: 'pro' });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Upgrade failed");
      }
    } catch (err) {
      console.error("Upgrade error", err);
      throw err;
    }
  };

  const downloadPDFReport = (item: ProcessItem) => {
    if (!item.result) return;
    const res = item.result;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('VerifierAI Forensic Report', 20, 25);
    
    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Candidate: ${res.extractedData.candidateName}`, 20, 55);
    doc.text(`Certificate: ${res.certificateType}`, 20, 65);
    doc.text(`Status: ${res.status}`, 20, 75);
    doc.text(`Risk Score: ${res.riskScore}/100`, 20, 85);
    
    // Table
    (doc as any).autoTable({
      startY: 95,
      head: [['Field', 'Value']],
      body: [
        ['Identifier', res.extractedData.identifier],
        ['Test Date', res.extractedData.testDate],
        ['Overall Score', res.extractedData.overall],
        ['Expiry Date', res.extractedData.expiryDate || 'N/A'],
        ['Organization', res.extractedData.organization]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Forensic Flags
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Forensic Analysis Flags', 20, finalY);
    doc.setFontSize(10);
    let flagY = finalY + 10;
    Object.entries(res.forensicFlags).forEach(([key, val]) => {
      doc.text(`${key}: ${val ? 'PASSED' : 'FAILED'}`, 25, flagY);
      flagY += 7;
    });

    if (res.deepForensicAnalysis) {
      doc.setFontSize(14);
      doc.text('Deep Forensic Dive', 20, flagY + 10);
      doc.setFontSize(10);
      doc.text(`Tamper Evidence: ${res.deepForensicAnalysis.tamperEvidence}`, 20, flagY + 20, { maxWidth: 170 });
    }
    
    doc.save(`VerifierAI_Report_${res.extractedData.candidateName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleTutorialComplete = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { hasSeenTutorial: true });
        setUser({ ...user, hasSeenTutorial: true });
        setShowTutorial(false);
      } catch (err) { console.error(err); }
    }
  };

  if (isAppLoading) return <LoadingScreen lang={lang} />;
  if (!user) return <AuthView onLogin={handleLogin} error={authError} mode={authMode} setMode={setAuthMode} lang={lang} />;
  if (!user.language) return <LanguageSelector onSelect={handleLanguageSelect} />;

  const t = translations[lang];

  return (
    <div className="min-h-screen flex bg-mesh selection:bg-indigo-100 selection:text-indigo-900">
      {showTutorial && <OnboardingGuide onComplete={handleTutorialComplete} lang={lang} />}
      <style>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(500%); opacity: 0; } }
        .animate-scan { animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        @keyframes pulse-emerald {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-emerald { animation: pulse-emerald 2s infinite; }

        @keyframes shake-subtle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake-subtle { animation: shake-subtle 0.4s ease-in-out 3; }

        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .shadow-soft { box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05); }
        .shadow-glow-indigo { box-shadow: 0 0 40px rgba(99, 102, 241, 0.15); }
        .stamp-valid { transform: rotate(-5deg); filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.3)); }
        .stamp-invalid { transform: rotate(8deg); filter: drop-shadow(0 4px 10px rgba(225, 29, 72, 0.3)); }
      `}</style>

      <aside className="hidden lg:flex w-80 bg-slate-50 dark:bg-black flex-col p-8 fixed h-full z-40 text-slate-600 dark:text-white border-r border-slate-200 dark:border-white/10 transition-colors duration-300">
        <div className="flex items-center gap-4 mb-14 px-2">
          <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-200 dark:border-slate-800 p-2">
            <Logo className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter leading-none">Verifier<span className="text-indigo-500 dark:text-indigo-400">AI</span></h2>
              {stats.isPro && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[8px] font-black text-white rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">PRO</span>
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-[0.2em]">Global Forensic Lab</p>
          </div>
        </div>
        
        <nav className="space-y-3 flex-1">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-house" label={t.dashboard} />
          <SidebarLink active={activeTab === 'verifier'} onClick={() => setActiveTab('verifier')} icon="fa-microscope" label={t.auditLab} />
          <SidebarLink active={activeTab === 'certificates'} onClick={() => setActiveTab('certificates')} icon="fa-certificate" label={t.certificates} />
          {!stats.isPro && <SidebarLink active={activeTab === 'upgrade'} onClick={() => setActiveTab('upgrade')} icon="fa-crown" label={t.upgradeToPro} />}
          <SidebarLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="fa-clock-rotate-left" label={t.archive} />
          <SidebarLink active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="fa-user" label={t.profile} />
          {user?.role === 'admin' && (
            <SidebarLink active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon="fa-user-shield" label={t.adminPanel} />
          )}
        </nav>
        
        <div className="space-y-6 pt-10 border-t border-slate-200 dark:border-slate-800">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-sm hover:shadow-md"
           >
             <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
             {t.themeToggle}
           </button>
           <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{lang === 'uz' ? 'API Holati' : 'API Health'}</span>
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-full"></div>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-slate-200 dark:hover:border-white/10">
            <i className="fa-solid fa-right-from-bracket"></i>
            {t.logout}
          </button>
           <button onClick={clearAppCache} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest">
            <i className="fa-solid fa-trash-can"></i>
            {t.purgeData}
          </button>

          {user?.provider === 'guest' && (
            <button 
              onClick={() => saveStats({ ...stats, isPro: !stats.isPro })} 
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${stats.isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-slate-500'}`}
            >
              <i className="fa-solid fa-toggle-on"></i>
              {stats.isPro ? 'Disable Pro (Demo)' : 'Enable Pro (Demo)'}
            </button>
          )}
        </div>
      </aside>
      
      <header className="lg:hidden fixed top-0 left-0 right-0 glass z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1.5 shadow-xl border border-slate-200 dark:border-slate-800">
            <Logo className="w-full h-full" />
          </div>
          <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tighter">Verifier<span className="text-indigo-500">AI</span></h2>
        </div>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 shadow-soft"
        >
          <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>
      </header>

      <main className="flex-1 lg:ml-80 p-6 md:p-14 pt-24 lg:pt-14 pb-28 lg:pb-14 transition-all overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView user={user} stats={stats} onNavigate={() => setActiveTab('verifier')} onUpgrade={handleUpgrade} lang={lang} />}
          {activeTab === 'verifier' && <VerifierView items={processingItems} onUpload={handleUpload} activeBatchId={activeBatchId} stats={stats} certificates={certificates} lang={lang} />}
          {activeTab === 'certificates' && <CertificateTypesView certificates={certificates} lang={lang} />}
          {activeTab === 'upgrade' && <UpgradeView onUpgrade={handleUpgrade} lang={lang} stats={stats} />}
          {activeTab === 'history' && <HistoryView stats={stats} onClear={clearAppCache} lang={lang} />}
          {activeTab === 'profile' && <ProfileView user={user} onUpdate={setUser} onRestartTutorial={() => setShowTutorial(true)} stats={stats} apiFetch={apiFetch} lang={lang} onNavigate={setActiveTab} />}
          {activeTab === 'admin' && <AdminPanelView apiFetch={apiFetch} lang={lang} />}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-6 left-6 right-6 glass p-4 rounded-[2rem] z-50 flex justify-around items-center shadow-2xl border border-slate-200 dark:border-white/50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-house" />
        <MobileNavItem active={activeTab === 'verifier'} onClick={() => setActiveTab('verifier')} icon="fa-microscope" />
        <MobileNavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="fa-clock-rotate-left" />
      </nav>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/5' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'}`}>
    <i className={`fa-solid ${icon} text-lg transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}></i>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: string }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-110' : 'text-slate-400 dark:text-slate-500'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
  </button>
);

const LoadingScreen: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-black flex flex-col items-center justify-center overflow-hidden transition-colors duration-300">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
      
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse"></div>
        <div className="absolute -inset-8 border border-indigo-500/10 rounded-full animate-pulse-ring"></div>
        <div className="absolute -inset-16 border border-indigo-500/5 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="relative w-32 h-32 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-float">
          <Logo className="w-full h-full" />
        </div>
      </div>
      
      <div className="text-center z-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Verifier<span className="text-indigo-500 dark:text-indigo-400">AI</span></h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-6 uppercase tracking-[0.3em]">{t.initializing}</p>
      </div>
      
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-1/2 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
};

const AuthView: React.FC<{ onLogin: (p: string, creds?: any, mode?: 'login' | 'register') => Promise<void>; error: string | null; mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; lang: Language }> = ({ onLogin, error, mode, setMode, lang }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setFormError(null);

    if (mode === 'register' && !formData.name) return setFormError(t.enterName);
    if (!formData.email.includes('@')) return setFormError(t.invalidEmail);
    if (formData.password.length < 6) return setFormError(t.passwordTooShort);

    setLoading(true);
    try {
      await onLogin('email', formData, mode);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onLogin('demo');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await onLogin(provider);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full glass p-10 md:p-12 rounded-[3rem] shadow-2xl relative z-10">
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-slate-200 dark:border-slate-700 p-4 mx-auto mb-8">
          <Logo className="w-full h-full" />
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">VerifierAI</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{mode === 'login' ? t.login : t.register}</p>
        </div>

        {(error || formError) && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 dark:text-rose-400 text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {mode === 'register' && (
            <input 
              type="text" 
              placeholder={t.fullName} 
              required
              className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
              value={formData.name}
              disabled={loading}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          )}
          <input 
            type="email" 
            placeholder={t.email} 
            required
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
            value={formData.email}
            disabled={loading}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" 
            placeholder={t.password} 
            required
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
            value={formData.password}
            disabled={loading}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
            {mode === 'login' ? t.login.toUpperCase() : t.register.toUpperCase()}
          </button>
        </form>

        <div className="text-center mb-8">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
            disabled={loading}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {mode === 'login' ? t.noAccount : t.hasAccount}
          </button>
        </div>

        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500 bg-white dark:bg-slate-900 px-4 tracking-[0.2em] transition-colors">{t.orContinue}</div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={handleDemo} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 rounded-2xl font-black text-xs transition-all bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
            {t.demoLogin.toUpperCase()}
          </button>
          <div className="grid grid-cols-3 gap-3">
            <AuthButton onClick={() => handleOAuth('google')} icon="fa-google" label="" color="bg-white text-slate-900" disabled={loading} />
            <AuthButton onClick={() => handleOAuth('microsoft')} icon="fa-microsoft" label="" color="bg-[#00a4ef] text-white" disabled={loading} />
            <AuthButton onClick={() => handleOAuth('apple')} icon="fa-apple" label="" color="bg-black text-white" disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthButton: React.FC<{ onClick: () => void; icon: string; label: string; color: string; disabled?: boolean }> = ({ onClick, icon, label, color, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`w-full flex items-center justify-center gap-4 py-4 px-6 rounded-2xl font-black text-sm transition-all hover:-translate-y-1 active:scale-95 shadow-xl disabled:opacity-50 disabled:transform-none ${color}`}
  >
    <i className={`fa-brands ${icon} text-lg`}></i>
    {label}
  </button>
);

const DashboardView: React.FC<{ user: any, stats: UserStats, onNavigate: () => void, onUpgrade: () => void, lang: Language }> = ({ user, stats, onNavigate, onUpgrade, lang }) => {
  const t = translations[lang];
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">{t.welcome}, {user?.name || (lang === 'uz' ? 'Foydalanuvchi' : 'User')}!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md leading-relaxed">{t.welcomeDesc}</p>
        </div>
        <div className="flex gap-4">
          {stats.isPro ? (
            <div className="px-8 py-5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-orange-500/20">
              <i className="fa-solid fa-crown"></i>
              {t.proStatus} ACTIVE
            </div>
          ) : (
            <button onClick={onUpgrade} className="px-8 py-5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-3">
              <i className="fa-solid fa-crown"></i>
              {t.upgradeToPro}
            </button>
          )}
          <button onClick={onNavigate} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95">{t.newAudit}</button>
        </div>
      </div>

      {stats.isPro ? (
        <div className="glass p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl relative overflow-hidden group border-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <i className="fa-solid fa-crown"></i>
                {t.proStatus} MEMBER
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none text-black">{t.proTitle}</h2>
              <p className="text-indigo-100 font-medium text-lg leading-relaxed">{t.proDesc}</p>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl">
              <i className="fa-solid fa-shield-check"></i>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass p-10 rounded-[3rem] bg-white text-slate-900 shadow-2xl relative overflow-hidden group border border-slate-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <i className="fa-solid fa-sparkles"></i>
                {t.limitedOffer}
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none text-black">{t.proTitle}</h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">{t.proDesc}</p>
            </div>
            <button onClick={onUpgrade} className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">{t.upgradeNow}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.totalAudits} value={stats.history.length} icon="fa-shield-halved" color="indigo" />
        <StatCard label={t.batchSessions} value={stats.batchReports?.length || 0} icon="fa-layer-group" color="amber" />
        <StatCard label={t.auditPoints} value={stats.xp} icon="fa-bolt" color="emerald" />
        <StatCard label={t.quotaSaved} value={stats.quotaSaved} icon="fa-leaf" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[3rem] shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
               <i className="fa-solid fa-chart-line text-indigo-500"></i>
               {t.recentActivity}
            </h2>
          </div>
          <div className="space-y-6">
            {stats.batchReports?.length ? stats.batchReports.slice(0, 3).map((r, i) => (
               <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all group">
                  <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm group-hover:shadow-md transition-all text-slate-900 dark:text-white">#{r.id.toUpperCase()}</div>
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-900 dark:text-white">{new Date(r.timestamp).toLocaleDateString()} {t.batch}</h4>
                     <p className="text-xs text-slate-900 dark:text-slate-400 font-medium">{r.totalItems} {t.filesAudited} • {r.validCount} {t.valid}</p>
                  </div>
                  <div className="text-right">
                     <div className="text-lg font-black text-slate-900 dark:text-white">{r.avgRiskScore}%</div>
                     <div className="text-[10px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-widest">{t.avgRisk}</div>
                  </div>
               </div>
            )) : <div className="py-20 text-center text-slate-900 dark:text-slate-400 italic font-medium">{t.noData}</div>}
          </div>
        </div>
        
        <div className="glass p-10 rounded-[3rem] shadow-soft bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
           <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <i className="fas fa-star text-indigo-300"></i>
              {t.levelProgress}
           </h2>
           <div className="flex flex-col items-center text-center py-6">
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (stats.xp % 1000 / 1000))} className="text-indigo-300" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <i className="fa-solid fa-award text-indigo-300/40 text-xl mb-1"></i>
                    <span className="text-4xl font-black tracking-tighter">Lvl {Math.floor(stats.xp / 1000) + 1}</span>
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{stats.xp % 1000} / 1000 XP</span>
                 </div>
              </div>
              <p className="text-sm font-medium text-indigo-100 italic">{t.detectiveQuote}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: any; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const colors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
  };
  return (
    <div className="glass p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 hover:shadow-glow-indigo hover:-translate-y-1 transition-all group">
      <div className={`w-14 h-14 ${colors[color]} rounded-full flex items-center justify-center mb-6 text-xl transition-transform group-hover:scale-110 shadow-sm`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  );
};

const VerifierView: React.FC<{ items: ProcessItem[], onUpload: (files: File[], category: CertificateType | 'AUTO', isBatch?: boolean) => void, activeBatchId: string | null, stats: UserStats, certificates: Certificate[], lang: Language }> = ({ items, onUpload, activeBatchId, stats, certificates, lang }) => {
  const [cat, setCat] = useState<CertificateType | 'AUTO'>('IELTS');
  const [showQR, setShowQR] = useState(false);
  const t = translations[lang];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {showQR && <QRScanner onScan={(text) => {
        setShowQR(false);
        onUpload([new File([new Blob([text], { type: 'text/plain' })], "qr_scan.txt", { type: 'text/plain' })], cat);
      }} onClose={() => setShowQR(false)} />}
      
      <div className="bg-slate-900 dark:bg-slate-900 p-12 md:p-16 rounded-[4rem] text-white flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="z-10 text-center lg:text-left max-w-xl">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
            <h1 className="text-5xl font-black tracking-tighter">{t.verifier.title}</h1>
            {stats.isPro && (
              <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-black text-white rounded-full uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30">{t.proStatus} ACTIVE</span>
            )}
          </div>
          <p className="text-slate-900 dark:text-slate-400 text-lg leading-relaxed font-medium">{t.verifier.description}</p>
        </div>
        <div className="z-10 w-full lg:w-auto">
          <div className="relative group">
            <select 
              value={cat} 
              onChange={e => setCat(e.target.value as any)} 
              className="w-full lg:w-80 bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl font-black outline-none cursor-pointer text-sm hover:border-indigo-500 transition-all appearance-none text-white"
            >
              <option value="AUTO">{t.verifier.autoDetect} 🤖</option>
              <option value="IELTS">IELTS (Official)</option>
              <option value="TOEFL">TOEFL iBT</option>
              <option value="ITEP">iTEP / iTEP Canada</option>
              <option value="MILLIY_NEW">UZB Milliy (New)</option>
              <option value="TYS">TYS (Turkish)</option>
              <option value="TOPIK">TOPIK (Korean)</option>
              {certificates.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <UploadCard title={t.verifier.singleFile} sub={t.verifier.singleFileDesc} icon="fa-upload" onFileSelect={f => onUpload([f], cat)} />
        <div className="relative">
          <UploadCard title={t.verifier.batchUpload} sub={t.verifier.batchUploadDesc} icon="fa-files" onFileSelect={fs => onUpload(Array.from(fs), cat, true)} multiple color="indigo" />
          {!stats.isPro && (
            <div className="absolute top-6 right-6 px-3 py-1 bg-amber-400 text-[8px] font-black text-white rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20 z-20">PRO</div>
          )}
        </div>
        <div onClick={() => setShowQR(true)} className="glass p-12 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:shadow-glow-indigo transition-all group hover:-translate-y-1">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-3xl flex items-center justify-center text-3xl group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all"><i className="fa-solid fa-qrcode"></i></div>
          <div className="text-center">
             <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t.verifier.qrScanner}</h3>
             <p className="text-[10px] font-bold text-slate-900 dark:text-slate-400 mt-1">{t.verifier.qrScannerDesc}</p>
          </div>
        </div>
      </div>

      {activeBatchId && (
        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex items-center gap-8 shadow-2xl animate-pulse">
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-microchip"></i></div>
           <div>
             <h3 className="text-2xl font-black tracking-tight">{t.verifier.processingBatch}</h3>
             <p className="text-sm font-medium opacity-80">{t.verifier.processingDesc}</p>
           </div>
        </div>
      )}

      <div className="space-y-14">
        {items.map(item => <ForensicCard key={item.id} item={item} stats={stats} lang={lang} />)}
      </div>
    </div>
  );
};

const UploadCard: React.FC<{ title: string; sub: string; icon: string; onFileSelect: (f: any) => void; multiple?: boolean; color?: string }> = ({ title, sub, icon, onFileSelect, multiple, color }) => (
  <div className={`relative group glass p-12 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:shadow-glow-indigo transition-all hover:-translate-y-1 ${color === 'indigo' ? 'bg-indigo-50/20 dark:bg-indigo-500/10' : ''}`}>
    <div className={`w-16 h-16 ${color === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'} rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110`}><i className={`fa-solid ${icon}`}></i></div>
    <div className="text-center">
       <h3 className={`font-black uppercase tracking-widest text-xs ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
       <p className="text-[10px] font-bold text-slate-900 dark:text-slate-400 mt-1">{sub}</p>
    </div>
    <input type="file" multiple={multiple} accept=".pdf,image/*" onChange={e => e.target.files && onFileSelect(multiple ? e.target.files : e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
  </div>
);

const ForensicCard: React.FC<{ item: ProcessItem; stats: UserStats; lang: Language }> = ({ item, stats, lang }) => {
  const t = translations[lang];
  const res = item.result;
  const isProcessing = item.step !== ProcessingStep.COMPLETED && item.step !== ProcessingStep.ERROR;
  const isInvalid = res && (res.status === 'INVALID' || res.riskScore > 50);
  const isValid = res && res.status === 'VALID' && res.riskScore <= 50;

  const downloadPDFReport = () => {
    if (!res) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(t.forensic.reportTitle, 20, 25);
    
    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`${t.forensic.candidate}: ${res.extractedData.candidateName}`, 20, 55);
    doc.text(`${t.forensic.certificate}: ${res.certificateType}`, 20, 65);
    doc.text(`${t.forensic.status}: ${res.status === 'VALID' ? t.forensic.verified : t.forensic.invalid}`, 20, 75);
    doc.text(`${t.forensic.riskScore}: ${res.riskScore}/100`, 20, 85);
    
    // Table
    (doc as any).autoTable({
      startY: 95,
      head: [[t.forensic.field, t.forensic.value]],
      body: [
        [t.forensic.identifier, res.extractedData.identifier],
        [t.forensic.testDate, res.extractedData.testDate],
        [t.forensic.overall, res.extractedData.overall],
        [t.forensic.expiry, res.extractedData.expiryDate || 'N/A'],
        [t.forensic.organization, res.extractedData.organization]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Forensic Flags
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text(t.forensic.flagsTitle, 20, finalY);
    doc.setFontSize(10);
    let flagY = finalY + 10;
    Object.entries(res.forensicFlags).forEach(([key, val]) => {
      doc.text(`${key}: ${val ? t.forensic.passed : t.forensic.failed}`, 25, flagY);
      flagY += 7;
    });

    if (res.deepForensicAnalysis) {
      doc.setFontSize(14);
      doc.text(t.forensic.deepDive, 20, flagY + 10);
      doc.setFontSize(10);
      doc.text(`${t.forensic.tamperEvidence}: ${res.deepForensicAnalysis.tamperEvidence}`, 20, flagY + 20, { maxWidth: 170 });
    }
    
    doc.save(`VerifierAI_Report_${res.extractedData.candidateName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className={`group glass rounded-[4rem] p-10 md:p-14 shadow-soft border-2 transition-all duration-500 overflow-hidden relative ${isInvalid ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-500/5 animate-shake-subtle' : isValid ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/5 dark:bg-emerald-500/5 animate-pulse-emerald' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start relative z-10">
        
        <div className="lg:col-span-4 space-y-10">
           <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl flex items-center justify-center">
              {item.file.type === 'application/pdf' ? (
                <div className="text-center p-8"><i className="fas fa-file-pdf text-8xl text-rose-500 mb-4"></i><p className="text-[10px] font-black uppercase text-slate-900 dark:text-slate-400 truncate w-40">{item.file.name}</p></div>
              ) : item.previewUrl ? (
                <img src={item.previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
              ) : <i className="fas fa-file-invoice text-7xl text-slate-200 dark:text-slate-700"></i>}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center">
                   <div className="w-full h-2 bg-indigo-500 absolute top-0 animate-scan"></div>
                   <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                   <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">
                     {stats.isPro ? t.forensic.priorityScan : t.forensic.deepScan}
                   </span>
                   {stats.isPro && (
                     <div className="mt-4 px-3 py-1 bg-amber-400 text-[8px] font-black text-white rounded-full uppercase tracking-widest">Turbo AI</div>
                   )}
                </div>
              )}
           </div>

           {res && (
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-400">{t.forensic.riskAssessment}</span>
                   <span className={`text-lg font-black ${res.riskScore < 30 ? 'text-emerald-500' : 'text-rose-500'}`}>{res.riskScore}%</span>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                   <div className={`h-full rounded-full transition-all duration-1000 ${res.riskScore < 30 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${res.riskScore}%` }}></div>
                </div>
             </div>
           )}
        </div>

        <div className="lg:col-span-8 space-y-12">
           {res ? (
             <div className="animate-in fade-in slide-in-from-right-10 duration-700">
                <header className="mb-12 border-b border-slate-100 dark:border-white/5 pb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                   <div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{res.certificateType}</span>
                        {item.isCached && <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Cached Result</span>}
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">{res.extractedData.candidateName}</h2>
                      <p className="font-mono text-sm text-slate-900 dark:text-slate-400 flex items-center gap-2">
                         <i className="fas fa-tag"></i> {res.extractedData.identifier}
                      </p>
                   </div>
                   
                   <div className="relative pt-4 pr-4">
                      <div className={`px-8 py-4 border-4 rounded-3xl font-black text-xl flex items-center gap-3 uppercase tracking-tighter ${res.status === 'VALID' ? 'stamp-valid border-emerald-500 text-emerald-500 bg-emerald-50/50' : 'stamp-invalid border-rose-600 text-rose-600 bg-rose-50/50'}`}>
                         <i className={`fas ${res.status === 'VALID' ? 'fa-check-double' : 'fa-skull-crossbones'}`}></i>
                         {res.status === 'VALID' ? t.forensic.verified : t.forensic.invalid}
                      </div>
                   </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                   <DataCell label={t.forensic.testDate.toUpperCase()} value={res.extractedData.testDate} />
                   <DataCell label={t.forensic.overall.toUpperCase()} value={res.extractedData.overall} hero />
                   <DataCell label={t.forensic.expiry.toUpperCase()} value={res.extractedData.expiryDate || 'N/A'} danger={!res.forensicFlags.expiryCheck} />
                   <DataCell label={t.forensic.organization.toUpperCase()} value={res.extractedData.organization} />
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                   <h3 className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <i className="fas fa-search-plus"></i> {t.forensic.analystReport}
                   </h3>
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         {res.analysisNotes.map((n, i) => (
                           <div key={i} className="flex gap-4 items-start text-slate-300 text-xs leading-relaxed">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span>
                              {n}
                           </div>
                         ))}
                      </div>
                      <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-8 md:pt-0 md:pl-8">
                         {res.warnings.map((w, i) => (
                           <div key={i} className="flex gap-4 items-start text-rose-400 text-xs font-bold leading-relaxed">
                              <i className="fas fa-exclamation-triangle mt-0.5 shrink-0"></i>
                              {w}
                           </div>
                         ))}
                         {res.warnings.length === 0 && <p className="text-emerald-400 text-xs font-bold"><i className="fas fa-shield-check mr-2"></i> {t.forensic.noThreats}</p>}
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-12">
                   <Flag active={res.forensicFlags.formatCheck} label={t.forensic.structure} />
                   <Flag active={res.forensicFlags.expiryCheck} label={t.forensic.validity} />
                   <Flag active={res.forensicFlags.imageIntegrity} label={t.forensic.integrity} />
                   <Flag active={res.forensicFlags.securityFeatures} label={t.forensic.antiForgery} />
                   {res.forensicFlags.pixelManipulation !== undefined && <Flag active={!res.forensicFlags.pixelManipulation} label={t.forensic.pixelAnalysis} />}
                   {res.forensicFlags.fontConsistency !== undefined && <Flag active={res.forensicFlags.fontConsistency} label={t.forensic.fontAudit} />}
                </div>

                {stats.isPro && res.deepForensicAnalysis && (
                  <div className="mt-12 p-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] border border-indigo-500/20 shadow-2xl">
                     <h3 className="text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <i className="fas fa-microchip"></i> {t.forensic.proDeepDive}
                     </h3>
                     <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.forensic.tamperEvidence}</p>
                           <p className="text-slate-300 text-xs leading-relaxed">{res.deepForensicAnalysis.tamperEvidence}</p>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.forensic.sourceVerification}</p>
                           <p className="text-slate-300 text-xs leading-relaxed">{res.deepForensicAnalysis.sourceVerification}</p>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.forensic.technicalMetadata}</p>
                           <p className="text-slate-300 text-xs leading-relaxed">{res.deepForensicAnalysis.technicalDetails}</p>
                        </div>
                     </div>
                  </div>
                )}

                {stats.isPro && (
                  <div className="flex flex-wrap gap-4 mt-12">
                     <button 
                       onClick={downloadPDFReport}
                       className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-3"
                     >
                       <i className="fas fa-file-pdf"></i>
                       {t.forensic.downloadReport}
                     </button>
                  </div>
                )}
             </div>
           ) : item.error ? (
             <div className="h-full flex flex-col items-center justify-center p-14 bg-rose-50 rounded-[3.5rem] border-2 border-rose-100 text-center">
                <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center text-4xl mb-8 animate-bounce"><i className="fas fa-times"></i></div>
                <h3 className="text-3xl font-black text-rose-900 mb-4">Verification Aborted</h3>
                <p className="text-rose-600 font-medium max-w-sm mb-10">{item.error}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200">Restart Lab</button>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                   <i className="fas fa-microscope text-4xl text-slate-200"></i>
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.forensic.awaitingAnalysis}</h3>
                   <p className="text-slate-900 dark:text-slate-400 text-sm max-w-xs mx-auto">{t.forensic.awaitingDescription}</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const DataCell: React.FC<{ label: string; value: string; hero?: boolean; danger?: boolean }> = ({ label, value, hero, danger }) => (
  <div className={`p-6 rounded-3xl border transition-all ${danger ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20' : hero ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}>
     <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${danger ? 'text-rose-400 dark:text-rose-500' : 'text-slate-900 dark:text-slate-300'}`}>{label}</p>
     <p className={`font-black truncate ${hero ? 'text-2xl text-indigo-600 dark:text-indigo-400' : danger ? 'text-rose-600 dark:text-rose-400 text-sm' : 'text-slate-900 dark:text-white text-sm'}`}>{value}</p>
  </div>
);

const Flag: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-2 transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
     <i className={`fas ${active ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
     {label}
  </div>
);

const UpgradeView: React.FC<{ onUpgrade: () => void; lang: Language; stats: UserStats }> = ({ onUpgrade, lang, stats }) => {
  const t = translations[lang];
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await onUpgrade();
      setIsSuccess(true);
    } catch (err) {
      console.error("Payment error", err);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess || stats.isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 animate-bounce">
          <i className="fa-solid fa-check"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t.upgradePage.success}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-10 leading-relaxed">{t.upgradePage.successDesc}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-800 dark:hover:bg-slate-100 shadow-2xl shadow-slate-200 dark:shadow-black/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          {t.upgradePage.backToDashboard}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{t.upgradePage.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{t.upgradePage.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          {t.upgradePage.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-check"></i>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        <div className="glass p-10 rounded-[3rem] shadow-2xl border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-crown"></i>
              PRO PLAN
            </div>
            
            <div className="space-y-2">
              <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{t.upgradePage.price}</p>
              <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">{t.upgradePage.securePayment}</p>
            </div>

            <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  {t.upgradePage.processing}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-credit-card"></i>
                  {t.upgradePage.payNow}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-6 text-slate-300 dark:text-slate-600 text-2xl">
              <i className="fa-brands fa-cc-visa"></i>
              <i className="fa-brands fa-cc-mastercard"></i>
              <i className="fa-brands fa-cc-stripe"></i>
              <i className="fa-brands fa-cc-apple-pay"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CertificateTypesView: React.FC<{ certificates: Certificate[]; lang: Language }> = ({ certificates, lang }) => {
  const t = translations[lang];
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const defaultTypes = [
    { ...t.certDetails.ielts, icon: 'fa-language' },
    { ...t.certDetails.toefl, icon: 'fa-graduation-cap' },
    { ...t.certDetails.cambridge, icon: 'fa-university' },
    { ...t.certDetails.pte, icon: 'fa-book' },
    { ...t.certDetails.duolingo, icon: 'fa-owl' },
    { ...t.certDetails.goethe, icon: 'fa-flag' },
    { ...t.certDetails.testdaf, icon: 'fa-vial' },
    { ...t.certDetails.dsh, icon: 'fa-school' },
    { ...t.certDetails.delf, icon: 'fa-landmark' },
    { ...t.certDetails.dalf, icon: 'fa-landmark' },
    { ...t.certDetails.tcf, icon: 'fa-file-signature' },
    { ...t.certDetails.torfl, icon: 'fa-r' },
    { ...t.certDetails.hsk, icon: 'fa-dragon' },
    { ...t.certDetails.hskk, icon: 'fa-comment-dots' },
    { ...t.certDetails.jlpt, icon: 'fa-torii-gate' },
    { ...t.certDetails.topik, icon: 'fa-yin-yang' },
    { ...t.certDetails.dele, icon: 'fa-bullhorn' },
    { ...t.certDetails.siele, icon: 'fa-globe' },
  ];

  const allTypes = [...defaultTypes, ...certificates.map(c => ({
    name: c.name,
    org: c.organization,
    validity: 'N/A',
    security: 'Custom Certificate',
    verification: 'Admin Managed',
    ai: 'Standard Analysis',
    icon: c.icon || 'fa-certificate'
  }))];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{t.certificateTypes}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTypes.map((cert, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedCert(cert)}
            className="glass p-8 rounded-[2.5rem] hover:shadow-glow-indigo transition-all group cursor-pointer hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <i className={`fa-solid ${cert.icon}`}></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{cert.name}</h3>
            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">{cert.org}</p>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <i className="fa-solid fa-clock"></i>
              {cert.validity}
            </div>
          </div>
        ))}
      </div>

      {selectedCert && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedCert(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="flex items-start justify-between mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-indigo-200">
                  <i className={`fa-solid ${selectedCert.icon}`}></i>
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none mb-2">{selectedCert.name}</h2>
                  <p className="text-indigo-500 font-black uppercase tracking-widest text-xs">{selectedCert.org}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCert(null)} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <DetailBox label={t.certLabels.validity} value={selectedCert.validity} icon="fa-hourglass-half" />
              <DetailBox label={t.certLabels.verificationMethod} value={selectedCert.verification} icon="fa-shield-check" />
              <div className="md:col-span-2">
                <DetailBox label={t.certLabels.securityFeatures} value={selectedCert.security} icon="fa-lock" />
              </div>
              <div className="md:col-span-2">
                <DetailBox label={t.certLabels.aiElements} value={selectedCert.ai} icon="fa-microchip" color="indigo" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailBox: React.FC<{ label: string; value: string; icon: string; color?: string }> = ({ label, value, icon, color }) => (
  <div className={`p-6 rounded-3xl border ${color === 'indigo' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
    <div className="flex items-center gap-3 mb-3">
      <i className={`fa-solid ${icon} ${color === 'indigo' ? 'text-indigo-600' : 'text-slate-900'} text-xs`}></i>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{label}</span>
    </div>
    <p className={`text-sm font-bold leading-relaxed ${color === 'indigo' ? 'text-indigo-900' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const ProfileView: React.FC<{ user: User; onUpdate: (u: User) => void; onRestartTutorial: () => void; stats: UserStats; apiFetch: any; lang: Language; onNavigate: (tab: any) => void }> = ({ user, onUpdate, onRestartTutorial, stats, apiFetch, lang, onNavigate }) => {
  const [formData, setFormData] = useState({ name: user.name, email: user.email, password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'stats' | 'security' | 'settings'>('info');
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (auth.currentUser) {
        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, {
          displayName: formData.name
        });

        // Update Firestore document
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          displayName: formData.name,
          email: formData.email // Note: Changing email in Auth requires re-authentication, skipping for simplicity unless requested
        });

        onUpdate({ ...user, name: formData.name, email: formData.email });
        setMessage({ type: 'success', text: t.profileUpdated });
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err: any) {
      console.error("Update profile error", err);
      setMessage({ type: 'error', text: err.message || t.updateError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t.userProfile}</h1>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setActiveSubTab('info')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSubTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.profileTabs.info.toUpperCase()}</button>
          <button onClick={() => setActiveSubTab('stats')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSubTab === 'stats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.profileTabs.stats.toUpperCase()}</button>
          <button onClick={() => setActiveSubTab('security')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSubTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.profileTabs.security.toUpperCase()}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeSubTab === 'info' && (
            <div className="glass p-10 rounded-[3rem] shadow-soft">
              {message && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.fullName}</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.email}</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.newPasswordPlaceholder}</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={loading} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-200">
                    {loading ? t.updating.toUpperCase() : t.saveChanges.toUpperCase()}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === 'stats' && (
            <div className="glass p-10 rounded-[3rem] shadow-soft space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-indigo-50 rounded-[2rem] text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{t.stats.xp.toUpperCase()}</p>
                  <p className="text-4xl font-black text-indigo-600">{stats.xp}</p>
                </div>
                <div className="p-8 bg-emerald-50 rounded-[2rem] text-center">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">{t.stats.level.toUpperCase()}</p>
                  <p className="text-4xl font-black text-emerald-600">{Math.floor(stats.xp / 1000) + 1}</p>
                </div>
                <div className="p-8 bg-amber-50 rounded-[2rem] text-center">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">{t.stats.streak.toUpperCase()}</p>
                  <p className="text-4xl font-black text-amber-600">{stats.streak} {lang === 'uz' ? 'kun' : 'days'}</p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2rem]">
                <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">{t.stats.history}</h3>
                <div className="space-y-4">
                  {stats.history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black ${h.score < 30 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{h.score}%</div>
                        <div>
                          <p className="font-bold text-slate-900">{h.type}</p>
                          <p className="text-[10px] text-slate-900">{new Date(h.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <i className="fa-solid fa-chevron-right text-slate-900"></i>
                    </div>
                  ))}
                  {stats.history.length === 0 && <p className="text-center text-slate-400 py-4 italic">{t.noAudits}</p>}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="glass p-10 rounded-[3rem] shadow-soft space-y-8">
              <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100">
                <h3 className="text-lg font-black text-rose-900 mb-2">{t.security.dangerZone}</h3>
                <p className="text-sm text-rose-600 mb-6">{t.security.dangerDesc}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all">{t.security.logoutAllBtn}</button>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2rem]">
                <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">{t.security.tutorialTitle}</h3>
                <p className="text-xs text-slate-500 mb-6">{t.security.tutorialDesc}</p>
                <button onClick={onRestartTutorial} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">{t.security.startTutorial}</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] shadow-soft">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-6">{t.accountInfo}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-500 uppercase mb-1">{t.role}</p>
                <p className="font-bold text-slate-900 dark:text-white uppercase">{user.role}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-500 uppercase mb-1">{t.plan}</p>
                <p className={`font-bold uppercase ${user.plan === 'pro' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{user.plan}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-500 uppercase mb-1">{t.memberSince}</p>
                <p className="font-bold text-slate-900 dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {user.plan === 'free' && (
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
              <h4 className="text-xl font-black mb-2">{t.upgradeToPro}</h4>
              <p className="text-sm opacity-80 mb-6">{t.proDesc}</p>
              <button 
                onClick={() => onNavigate('upgrade')}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all"
              >
                {t.upgradeNowBtn || t.upgradeNow}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminPanelView: React.FC<{ apiFetch: any; lang: Language }> = ({ apiFetch, lang }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingCert, setEditingCert] = useState<Partial<Certificate> | null>(null);
  const [search, setSearch] = useState('');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'certificates' | 'users'>('dashboard');
  const t = translations[lang];

  const fetchData = async () => {
    try {
      // Fetch certificates from Firestore
      const certsCol = collection(db, 'certificates');
      const certsSnapshot = await getDocs(certsCol);
      const certsList = certsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate));
      setCertificates(certsList);

      // Fetch users from Firestore
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);

      // Calculate stats locally
      setStats({
        totalUsers: usersList.length,
        proUsers: usersList.filter(u => u.plan === 'pro').length,
        totalCerts: certsList.length
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdatePlan = async (userId: string, plan: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { plan });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    
    try {
      const certId = editingCert.id || editingCert.name?.toUpperCase().replace(/\s+/g, '_');
      if (!certId) return;

      const certDocRef = doc(db, 'certificates', certId);
      const { id, ...dataToSave } = editingCert;
      await setDoc(certDocRef, { ...dataToSave, id: certId });
      
      fetchData();
      setEditingCert(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.deleteConfirm)) return;
    try {
      const certDocRef = doc(db, 'certificates', id);
      await deleteDoc(certDocRef);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = certificates.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t.admin.title}</h1>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setAdminTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${adminTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.admin.dashboard.toUpperCase()}
          </button>
          <button 
            onClick={() => setAdminTab('certificates')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${adminTab === 'certificates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.admin.certificates.toUpperCase()}
          </button>
          <button 
            onClick={() => setAdminTab('users')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${adminTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.admin.users.toUpperCase()}
          </button>
        </div>
      </div>

      {adminTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label={t.admin.totalUsers} value={stats.totalUsers} icon="fa-users" color="indigo" />
          <StatCard label={t.admin.proUsers} value={stats.proUsers} icon="fa-crown" color="amber" />
          <StatCard label={t.admin.totalCerts} value={certificates.length} icon="fa-certificate" color="emerald" />
        </div>
      )}

      {adminTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder={t.admin.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <button 
              onClick={() => setEditingCert({ name: '', organization: '', description: '', icon: 'fa-certificate', auditRules: '' })}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {t.admin.addCert}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div key={c.id} className="glass p-8 rounded-[2.5rem] relative group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
                    <i className={`fa-solid ${c.icon || 'fa-certificate'}`}></i>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingCert(c)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => handleDelete(c.id)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">{c.name}</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">{c.organization}</p>
                <p className="text-sm text-slate-500 font-medium line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'users' && (
        <div className="glass rounded-[3rem] overflow-hidden shadow-soft">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400">{t.admin.userName}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400">{t.admin.userEmail}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400">{t.admin.userPlan}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400">{t.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                  <td className="p-6 font-bold text-slate-900">{u.name}</td>
                  <td className="p-6 text-sm text-slate-500">{u.email}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.plan === 'pro' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => handleUpdatePlan(u.id, u.plan === 'pro' ? 'free' : 'pro')}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      {u.plan === 'pro' ? t.admin.makeFree : t.admin.makePro}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 border border-slate-100 dark:border-white/5">
            <h2 className="text-3xl font-black tracking-tighter mb-8 dark:text-white">{editingCert.id ? t.admin.editCert : t.admin.addCert}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.admin.certName}</label>
                <input 
                  type="text" 
                  value={editingCert.name || ''} 
                  onChange={e => setEditingCert({ ...editingCert, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.admin.organization}</label>
                <input 
                  type="text" 
                  value={editingCert.organization || ''} 
                  onChange={e => setEditingCert({ ...editingCert, organization: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.admin.description}</label>
                <textarea 
                  value={editingCert.description || ''} 
                  onChange={e => setEditingCert({ ...editingCert, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium h-32 resize-none dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.admin.icon}</label>
                <input 
                  type="text" 
                  value={editingCert.icon || ''} 
                  onChange={e => setEditingCert({ ...editingCert, icon: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-2">{t.admin.auditRules}</label>
                <textarea 
                  value={editingCert.auditRules || ''} 
                  onChange={e => setEditingCert({ ...editingCert, auditRules: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium h-32 resize-none dark:text-white font-mono text-xs"
                  placeholder='{"minRisk": 80, "requiredFields": ["name", "date"]}'
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">{t.admin.save}</button>
                <button type="button" onClick={() => setEditingCert(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">{t.admin.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryView: React.FC<{ stats: UserStats; onClear: () => void; lang: Language }> = ({ stats, onClear, lang }) => {
  const t = translations[lang];
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t.archive.title}</h1>
        <button 
          onClick={onClear}
          className="lg:hidden flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all"
        >
          <i className="fa-solid fa-trash-can"></i>
          {t.archive.purge}
        </button>
      </div>
      <div className="glass rounded-[3.5rem] overflow-hidden shadow-soft">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-900 dark:text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <tr>
                     <th className="px-10 py-8">{t.archive.timestamp}</th>
                     <th className="px-10 py-8">{t.archive.certificate}</th>
                     <th className="px-10 py-8">{t.archive.riskMatrix}</th>
                     <th className="px-10 py-8 text-right">{t.archive.verdict}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {stats.history.length ? stats.history.map((h, i) => (
                     <tr key={i} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-10 py-6 text-sm font-medium text-slate-500">{new Date(h.date).toLocaleString()}</td>
                        <td className="px-10 py-6 font-black text-slate-900">{h.type}</td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className={`h-full ${h.score < 30 ? 'bg-emerald-500' : h.score < 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${h.score}%` }}></div>
                              </div>
                              <span className="text-xs font-black">{h.score}%</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest ${h.score < 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {h.score < 40 ? t.archive.valid : t.archive.risky}
                           </span>
                        </td>
                     </tr>
                  )) : <tr><td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-medium italic">{t.archive.empty}</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const QRScanner: React.FC<{ onScan: (text: string) => void, onClose: () => void, lang: Language }> = ({ onScan, onClose, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = translations[lang];

  useEffect(() => {
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        const scan = () => {
          if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);
              const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height);
              if (code) { onScan(code.data); return; }
            }
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch (err) { alert(t.verifier.cameraDenied); onClose(); }
    };
    start();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8">
       <div className="relative w-full max-w-lg aspect-square bg-black rounded-[4rem] overflow-hidden border-4 border-white shadow-2xl">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline />
          <canvas ref={canvasRef} hidden />
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-scan"></div>
          <div className="absolute inset-20 border-2 border-white/20 border-dashed rounded-[2rem]"></div>
       </div>
       <h3 className="text-white text-2xl font-black mt-12 tracking-tight">{t.verifier.scanning}</h3>
       <p className="text-slate-400 mt-2 font-medium">{t.verifier.placeQR}</p>
       <button onClick={onClose} className="mt-16 px-12 py-5 bg-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">{t.verifier.cancelScan}</button>
    </div>
  );
};

export default App;
