
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult, CertificateType } from "./types";

const AUDIT_RULES: Record<string, string> = {
  IELTS: `Siz OLIY DARAJALI IELTS FORENSIK AUDITORISIZ. IELTS TRF haqiqiyligini tekshiring. 
  TRF 18 belgidan iborat bo'lishi shart. Ballar o'rtachasi Overall'ga mos kelishini matematik tekshiring. 
  2 yillik amal qilish muddatini (expiry) qat'iy nazorat qiling.`,
  TOEFL: "ETS logosi, 0-120 ball tizimi va 2 yillik amal qilish muddatini tekshiring.",
  ITEP: "iTEP (International Test of English Proficiency) sertifikatini tekshiring. Rasmiy tekshirish: iteptest.com/verify/test_verification.php",
  ITEP_CANADA: "iTEP Canada sertifikatini tekshiring. Rasmiy tekshirish: test.itepcanada.com/verify/test_verification.php",
  MILLIY_NEW: "O'zbekiston Milliy sertifikati (2022 yil maydan keyin). Rasmiy tekshirish: sertifikat.uzbmb.uz/site/cert?type=1",
  MILLIY_OLD: "O'zbekiston Milliy sertifikati (2022 yil maygacha). Rasmiy tekshirish: sertifikat.uzbmb.uz/site/cert?type=3",
  TYS: "Turk tili (Yunus Emre Enstitüsü) TYS sertifikati. Rasmiy tekshirish: belgesorgula.yee.org.tr yoki turkiye.gov.tr/yunus-emre-enstitusu-ebys",
  TestDaF: "Nemis tili TestDaF sertifikati. Rasmiy tekshirish: gast.de/portal/certificate/verification-testdaf-form",
  TOPIK: "Koreys tili TOPIK sertifikati. Rasmiy tekshirish: topik.go.kr/TWMYPG/TWMYPG0060-001.do",
  HSK: "Xitoy tili HSK sertifikati. Rasmiy tekshirish: chinesetest.cn",
  Cambridge: "Cambridge Assessment English (B2 First, C1 Advanced, C2 Proficiency). Statement of Results va Certificate haqiqiyligini tekshiring. Rasmiy tekshirish: cambridgeenglish.org/verifying-results",
  PTE: "Pearson Test of English. Score Report Code (SRC) orqali haqiqiyligini tekshiring. Rasmiy tekshirish: pearsonpte.com/scoring/verify-pte-scores",
  Duolingo: "Duolingo English Test. Sertifikatdagi URL (share.duolingo.com/...) orqali haqiqiyligini tekshiring. 160 ballik tizim va 2 yillik amal qilish muddatini tekshiring.",
  DEFAULT: "Hujjatning haqiqiyligini, tashkilot logotipini va amal qilish muddatini tekshiring."
};

const forensicSchema = {
  type: Type.OBJECT,
  properties: {
    certificateType: { type: Type.STRING },
    extractedData: {
      type: Type.OBJECT,
      properties: {
        candidateName: { type: Type.STRING },
        identifier: { type: Type.STRING },
        testDate: { type: Type.STRING },
        organization: { type: Type.STRING },
        scores: { 
          type: Type.OBJECT, 
          properties: {
            Listening: { type: Type.STRING },
            Reading: { type: Type.STRING },
            Writing: { type: Type.STRING },
            Speaking: { type: Type.STRING },
            Literacy: { type: Type.STRING, description: "Duolingo specific" },
            Comprehension: { type: Type.STRING, description: "Duolingo specific" },
            Conversation: { type: Type.STRING, description: "Duolingo specific" },
            Production: { type: Type.STRING, description: "Duolingo specific" }
          }
        },
        overall: { type: Type.STRING },
        expiryDate: { type: Type.STRING }
      },
      required: ["candidateName", "identifier", "overall", "testDate"]
    },
    riskScore: { type: Type.NUMBER },
    status: { type: Type.STRING, enum: ["VALID", "REVIEW", "INVALID"] },
    forensicFlags: {
      type: Type.OBJECT,
      properties: {
        formatCheck: { type: Type.BOOLEAN },
        nameMatch: { type: Type.BOOLEAN },
        expiryCheck: { type: Type.BOOLEAN },
        securityFeatures: { type: Type.BOOLEAN },
        imageIntegrity: { type: Type.BOOLEAN },
        pixelManipulation: { type: Type.BOOLEAN, description: "Piksellar darajasida o'zgarishlar bormi?" },
        fontConsistency: { type: Type.BOOLEAN, description: "Shriftlar bir xilligi tekshiruvi" },
        metadataAnomalies: { type: Type.BOOLEAN, description: "Metadata anomaliyalari" }
      }
    },
    deepForensicAnalysis: {
      type: Type.OBJECT,
      properties: {
        tamperEvidence: { type: Type.STRING, description: "Hujjat o'zgartirilganiga oid dalillar" },
        sourceVerification: { type: Type.STRING, description: "Manba ishonchliligi tahlili" },
        technicalDetails: { type: Type.STRING, description: "Texnik detallar (DPI, rang profili va h.k.)" }
      }
    },
    analysisNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["certificateType", "extractedData", "riskScore", "status", "forensicFlags", "analysisNotes"]
};

export const getFileFingerprint = (file: File): string => {
  return `${file.name}_${file.size}_${file.lastModified}`;
};

export const checkCache = (fingerprint: string): VerificationResult | null => {
  const cached = localStorage.getItem(`audit_cache_${fingerprint}`);
  return cached ? JSON.parse(cached) : null;
};

export const saveToCache = (fingerprint: string, result: VerificationResult) => {
  localStorage.setItem(`audit_cache_${fingerprint}`, JSON.stringify({ ...result, isFromCache: true }));
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callWithRetry = async (fn: () => Promise<any>, retries = 5, delay = 5000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isQuotaError = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
    
    if (retries > 0 && (isQuotaError || error.status >= 500)) {
      // Quota xatosi bo'lsa kutish vaqtini ko'paytiramiz (Exponential Backoff)
      const waitTime = isQuotaError ? delay * 2 : delay;
      console.warn(`Quota limitga urildi. ${waitTime}ms dan keyin qayta urinib ko'ramiz... Qolgan urinishlar: ${retries}`);
      await sleep(waitTime);
      return callWithRetry(fn, retries - 1, waitTime);
    }
    throw error;
  }
};

export const isValidBase64 = (str: any): boolean => {
  if (typeof str !== 'string' || !str || str.trim() === "") return false;
  try {
    // Basic regex check first for allowed base64 characters
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str.substring(0, 100).replace(/\s/g, ""))) {
      return false;
    }
    // Check if it's a valid base64 string by attempting to decode a small portion
    // We wrap it to catch the "The string did not match the expected pattern" error.
    window.atob(str.substring(0, 64).replace(/=+$/, ""));
    return true;
  } catch (e) {
    return false;
  }
};

export const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!isValidBase64(base64)) {
      console.warn("Skipping compression for invalid base64 data");
      return resolve(base64);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `data:image/jpeg;base64,${base64}`;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200; 
        let width = img.width;
        let height = img.height;
        
        if (width === 0 || height === 0) {
          console.warn("Image has 0 dimensions, skipping compression");
          return resolve(base64);
        }

        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64);
        
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
        resolve(compressed || base64);
      } catch (e) {
        console.error("Compression failed:", e);
        resolve(base64);
      }
    };
    img.onerror = (e) => {
      console.error("Image load failed for compression:", e);
      resolve(base64);
    };
  });
};

const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getApiKey = () => {
  // In AI Studio, the key can be in process.env.API_KEY or process.env.GEMINI_API_KEY
  // Vite replaces these at build time, but we want to be as flexible as possible.
  return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
};

export const processCertificate = async (base64Data: string, mimeType: string, hintCategory?: CertificateType | 'AUTO', isPro: boolean = false, customRules?: string): Promise<VerificationResult> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const rules = customRules || (hintCategory && AUDIT_RULES[hintCategory]) || AUDIT_RULES.DEFAULT;
    const today = new Date().toLocaleDateString();

    // Pro foydalanuvchilar uchun kuchliroq model ishlatamiz
    const modelName = isPro ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Bugungi sana: ${today}. Qoidalar: ${rules}. 
          Hujjatni o'ta sinchkovlik bilan tekshiring. 
          ${isPro ? "Siz PRO versiyadasiz. Chuqur tahlil qiling: piksellar, shriftlar, metadata va har qanday shubhali o'zgarishlarni (tampering) aniqlang. 'deepForensicAnalysis' maydonini to'ldiring." : ""}
          Agar muddat o'tgan bo'lsa 'expiryCheck'ni false qiling. 
          Natijani FAQAT JSON formatida forensicSchema bo'yicha bering.` }
        ]
      },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: forensicSchema,
      }
    });

    const raw = JSON.parse(cleanJson(response.text));
    return { ...raw, isVerified: raw.status === "VALID" && raw.forensicFlags.expiryCheck };
  });
};

export const generateBatchSummary = async (results: VerificationResult[]): Promise<string> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const summaryData = results.map(r => ({
      name: r.extractedData.candidateName,
      status: r.status,
      risk: r.riskScore,
      type: r.certificateType
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quyidagi sertifikatlar audit natijalari bo'yicha juda qisqa (1-2 gap), professional xulosa yozing (O'zbek tilida).
      Natijalar: ${JSON.stringify(summaryData)}.`,
    });

    return response.text || "Batch tahlili yakunlandi.";
  });
};

export const processManualVerification = async (data: Record<string, string>, hintCategory?: CertificateType | 'AUTO', isPro: boolean = false): Promise<VerificationResult> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const rules = (hintCategory && AUDIT_RULES[hintCategory]) || AUDIT_RULES.DEFAULT;
    const today = new Date().toLocaleDateString();
    const modelName = isPro ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: `Bugungi sana: ${today}. Qoidalar: ${rules}. 
          Foydalanuvchi tomonidan qo'lda kiritilgan ma'lumotlar: ${JSON.stringify(data)}.
          Ushbu ma'lumotlar asosida sertifikatning haqiqiyligini va mantiqiy to'g'riligini tekshiring. 
          Masalan: TRF formati, ballar hisob-kitobi, amal qilish muddati va h.k.
          Natijani FAQAT JSON formatida forensicSchema bo'yicha bering. 
          'forensicFlags'da image bilan bog'liq bo'lmagan (formatCheck, nameMatch, expiryCheck) maydonlarni to'ldiring, qolganlarini true qoldiring.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: forensicSchema,
      }
    });

    const raw = JSON.parse(cleanJson(response.text));
    return { ...raw, isVerified: raw.status === "VALID" && raw.forensicFlags.expiryCheck };
  });
};

export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      try {
        const res = reader.result as string;
        if (!res.includes(',')) {
          console.error("Invalid base64 format from FileReader:", res.substring(0, 100));
          return reject(new Error("Invalid base64 format"));
        }
        const b64 = res.split(',')[1];
        if (!isValidBase64(b64)) {
          console.error("Malformed base64 detected in fileToBase64:", b64.substring(0, 100));
          return reject(new Error("Malformed base64 data"));
        }
        resolve(b64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
