import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "verifier-ai-secret-key-2026";
const DB_PATH = path.join(process.cwd(), "database.json");

// Simple JSON Database Implementation
const initDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], certificates: [] }, null, 2));
  } else {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    if (!data.certificates) {
      data.certificates = [];
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
  }
};

const getDb = () => {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { users: [], certificates: [] };
  }
};

const getUsers = () => getDb().users;
const getCertificates = () => getDb().certificates;

const saveDb = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const saveUsers = (users: any[]) => {
  const db = getDb();
  db.users = users;
  saveDb(db);
};

const saveCertificates = (certificates: any[]) => {
  const db = getDb();
  db.certificates = certificates;
  saveDb(db);
};

const saveUser = (user: any) => {
  const users = getUsers();
  const index = users.findIndex((u: any) => u.email === user.email && u.provider === user.provider);
  
  const usage = user.usage || { count: 0, lastReset: new Date().toISOString() };
  
  if (index !== -1) {
    users[index] = { 
      ...users[index], 
      ...user, 
      usage: users[index].usage || usage,
      lastLogin: new Date().toISOString() 
    };
  } else {
    users.push({ 
      ...user, 
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      plan: user.plan || 'free',
      usage: usage,
      hasSeenTutorial: user.hasSeenTutorial || false,
      language: user.language || 'uz',
      createdAt: new Date().toISOString(), 
      lastLogin: new Date().toISOString() 
    });
  }
  
  saveUsers(users);
};

initDb();

app.use(express.json());
app.use(cookieParser());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin only." });
  }
};

// Email/Password Register
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const users = getUsers();
  if (users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    password: hashedPassword,
    provider: 'email',
    role: (users.length === 0 || email === 'amuso3712@gmail.com') ? 'admin' : 'user', // First user or specific email is admin
    plan: 'free',
    usage: { count: 0, lastReset: new Date().toISOString() },
    hasSeenTutorial: false,
    language: 'uz',
    xp: 0,
    level: 1,
    streak: 0,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword, token });
});

// Email/Password Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const users = getUsers();
  const user = users.find((u: any) => u.email === email && u.provider === 'email');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Upgrade to admin if email matches
  if (email === 'amuso3712@gmail.com' && user.role !== 'admin') {
    user.role = 'admin';
    saveUsers(users);
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword, token });
});

// Plan Management
app.post("/api/user/upgrade", authenticateToken, (req: any, res) => {
  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === req.user.id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].plan = 'pro';
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = users[index];
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword });
});

app.post("/api/user/language", authenticateToken, (req: any, res) => {
  const { language } = req.body;
  if (language !== 'uz' && language !== 'en') {
    return res.status(400).json({ error: "Invalid language" });
  }

  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === req.user.id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].language = language;
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = users[index];
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword });
});

app.post("/api/usage/increment", authenticateToken, (req: any, res) => {
  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === req.user.id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  const user = users[index];
  
  // Ensure usage object exists
  if (!user.usage) {
    user.usage = { count: 0, lastReset: new Date().toISOString() };
  }
  
  const today = new Date().toISOString().split('T')[0];
  const lastReset = user.usage.lastReset ? user.usage.lastReset.split('T')[0] : today;

  if (today !== lastReset) {
    user.usage.count = 0;
    user.usage.lastReset = new Date().toISOString();
  }

  if (user.plan === 'free' && user.usage.count >= 5) {
    return res.status(403).json({ error: "Daily limit reached. Upgrade to Pro to continue verification." });
  }

  user.usage.count += 1;
  saveUsers(users);

  res.json({ count: user.usage.count, plan: user.plan });
});

app.post("/api/user/tutorial-complete", authenticateToken, (req: any, res) => {
  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === req.user.id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].hasSeenTutorial = true;
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = users[index];
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword });
});

// Admin User Management
app.get("/api/admin/users", authenticateToken, isAdmin, (req, res) => {
  const users = getUsers().map(({ password, ...u }: any) => u);
  res.json({ users });
});

app.put("/api/admin/users/:id/plan", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (plan !== 'free' && plan !== 'pro') {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].plan = plan;
  saveUsers(users);

  res.json({ user: users[index] });
});

// Protected Profile Route
app.get("/api/profile", authenticateToken, (req: any, res) => {
  const users = getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: "User not found" });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.put("/api/profile", authenticateToken, async (req: any, res) => {
  const { name, email, password } = req.body;
  const users = getUsers();
  const index = users.findIndex((u: any) => u.id === req.user.id);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  if (name) users[index].name = name;
  if (email) users[index].email = email;
  if (password) {
    users[index].password = await bcrypt.hash(password, 10);
  }

  saveUsers(users);
  const { password: _, ...userWithoutPassword } = users[index];
  
  // Update token
  const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "30d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userWithoutPassword });
});

// Admin Certificate Management
app.get("/api/certificates", (req, res) => {
  res.json({ certificates: getCertificates() });
});

app.get("/api/admin/stats", authenticateToken, isAdmin, (req, res) => {
  const users = getUsers();
  const certificates = getCertificates();
  
  res.json({
    totalUsers: users.length,
    totalCertificates: certificates.length,
    recentUsers: users.slice(-5).reverse().map((u: any) => ({ name: u.name, email: u.email, createdAt: u.createdAt })),
    roleDistribution: {
      admin: users.filter((u: any) => u.role === 'admin').length,
      user: users.filter((u: any) => u.role === 'user').length
    },
    planDistribution: {
      pro: users.filter((u: any) => u.plan === 'pro').length,
      free: users.filter((u: any) => u.plan === 'free').length
    }
  });
});

app.get("/api/admin/certificates", authenticateToken, isAdmin, (req, res) => {
  res.json({ certificates: getCertificates() });
});

app.post("/api/admin/certificates", authenticateToken, isAdmin, (req, res) => {
  const cert = req.body;
  const certificates = getCertificates();
  const newCert = { ...cert, id: Math.random().toString(36).substr(2, 9) };
  certificates.push(newCert);
  saveCertificates(certificates);
  res.json({ certificate: newCert });
});

app.put("/api/admin/certificates/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const updatedCert = req.body;
  const certificates = getCertificates();
  const index = certificates.findIndex((c: any) => c.id === id);

  if (index === -1) return res.status(404).json({ error: "Certificate not found" });

  certificates[index] = { ...certificates[index], ...updatedCert };
  saveCertificates(certificates);
  res.json({ certificate: certificates[index] });
});

app.delete("/api/admin/certificates/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const certificates = getCertificates();
  const filtered = certificates.filter((c: any) => c.id !== id);
  saveCertificates(filtered);
  res.json({ success: true });
});

const getRedirectUri = (req: express.Request) => {
  return `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
};

// OAuth URL Generation
app.get("/api/auth/url/:provider", (req, res) => {
  const { provider } = req.params;
  const redirectUri = getRedirectUri(req);
  let authUrl = "";

  const checkKey = (key: string | undefined) => {
    if (!key || key.trim() === "" || key === "undefined") return false;
    return true;
  };

  if (!checkKey(process.env.APP_URL)) {
    return res.status(400).json({ error: "APP_URL is not configured. Please set it to your container URL." });
  }

  switch (provider) {
    case "google":
      if (!checkKey(process.env.GOOGLE_CLIENT_ID)) return res.status(400).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&state=google`;
      break;
    case "microsoft":
      if (!checkKey(process.env.MICROSOFT_CLIENT_ID)) return res.status(400).json({ error: "MICROSOFT_CLIENT_ID is not configured" });
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email%20User.Read&state=microsoft`;
      break;
    case "apple":
      if (!checkKey(process.env.APPLE_CLIENT_ID)) return res.status(400).json({ error: "APPLE_CLIENT_ID is not configured" });
      authUrl = `https://appleid.apple.com/auth/authorize?client_id=${process.env.APPLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=name%20email&response_mode=form_post&state=apple`;
      break;
    default:
      return res.status(400).json({ error: "Invalid provider" });
  }

  res.json({ url: authUrl });
});

// Demo Login Persistence
app.post("/api/auth/demo", (req, res) => {
  const userData = {
    id: `demo-${Math.random().toString(36).substr(2, 5)}`,
    name: 'Demo User',
    email: `demo_${Math.random().toString(36).substr(2, 4)}@verifier.ai`,
    provider: 'guest'
  };

  saveUser(userData);

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "30d" });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ user: userData });
});

// OAuth Callback
app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  
  // In a real app, you would exchange the code for tokens here
  // For this demo, we'll simulate a successful login and save to our JSON DB
  const userData = {
    id: Math.random().toString(36).substr(2, 9),
    name: `${state?.toString().toUpperCase()} User`,
    email: `user_${Math.random().toString(36).substr(2, 4)}@${state}.com`,
    provider: state
  };

  // Save to persistent database
  saveUser(userData);

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "30d" });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days persistence
  });

  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userData)} }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies.auth_token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
