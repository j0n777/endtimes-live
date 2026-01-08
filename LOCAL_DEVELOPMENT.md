# 🚀 Local Development Guide

## Quick Access to Project

### Method 1: VS Code (Recommended)

1. **Open in VS Code**
   ```bash
   cd e:\mycode\End-Times-Monitor
   code .
   ```

2. **Open integrated terminal** (Ctrl + `)

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Access app**: http://localhost:5173

---

### Method 2: Command Line

1. **Navigate to project**
   ```bash
   cd e:\mycode\End-Times-Monitor
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```

3. **Open browser** → http://localhost:5173

---

## Available Commands

```bash
# Install dependencies (first time only)
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

---

## Project URL Structure

- **Development**: http://localhost:5173
- **Admin Panel**: http://localhost:5173 (click "ADMIN" in nav)
- **Situation Map**: http://localhost:5173 (default view)

---

## First Time Setup Checklist

- [ ] Node.js installed (v16+)
- [ ] `npm install` completed
- [ ] `.env.local` created with `API_KEY=your_gemini_key`
- [ ] `npm run dev` running
- [ ] Browser opened to http://localhost:5173

---

## Configuration After First Load

1. Click **ADMIN** in top navigation
2. Configure data sources (see README.md for details)
3. Click **SAVE CONFIGURATION**
4. Click **REFRESH** button in header
5. Wait 10-30 seconds for data to load

---

## Default Port: 5173

If port 5173 is already in use, Vite will automatically use the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

---

## Hot Module Replacement (HMR)

Changes to files will automatically reload in the browser. No need to refresh manually.

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Rebuild
rm -rf dist
npm run build
```

---

## Development Tips

- **Fast Refresh**: Save files to see instant updates
- **Console Debugging**: Open browser DevTools (F12)
- **API Testing**: Use REFRESH button to test data sources
- **Mobile Testing**: Access via local IP (e.g., http://192.168.1.X:5173)

---

**Happy coding! 🚀**
