# 🎨 UI Migration to Design Prototype

**Migration Date:** November 10, 2025  
**From:** Pages Router (old UI)  
**To:** Design Prototype (modern green theme)

---

## 🎯 Design System Changes

### **Color Scheme**
- **Primary:** `#006239` (dark green) → was blue
- **Primary Foreground:** `#dde8e3` (light mint)
- **Ring/Accent:** `#4ade80` (bright green)
- **Background:** `#121212` (dark mode default)
- **Card:** `#171717` (slightly lighter than background)

### **Typography**
- **Font:** Outfit (Google Font) → was Inter
- **Letter Spacing:** `0.025em` tracking for better readability

### **Components**
- **Sidebar:** Fixed 64px width, always visible
- **Cards:** Rounded-2xl (16px), border-2, hover states
- **Buttons:** Primary green, smooth opacity transitions
- **Animations:** Framer Motion throughout

---

## 📁 Files to Update

### **1. Global Styles**
- ✅ `/frontend/src/styles/globals.css` → Copy from prototype

### **2. Components to Create**
- ✅ `/frontend/src/components/layout/DashboardLayout.jsx` → New sidebar layout
- ✅ `/frontend/src/components/layout/AuthLayout.jsx` → Auth pages wrapper

### **3. Pages to Update**
- ✅ `/frontend/src/pages/dashboard.jsx` → Modern stats + agent cards
- ✅ `/frontend/src/pages/cv-intelligence.jsx` → Match prototype design
- ✅ `/frontend/src/pages/interviews.jsx` → Match prototype design
- ✅ `/frontend/src/pages/support.jsx` → Match prototype design
- ✅ `/frontend/src/pages/profile.jsx` → Match prototype design
- ✅ `/frontend/src/pages/admin/users.jsx` → Admin panel design

### **4. Dependencies to Add**
```json
{
  "framer-motion": "^11.0.0"
}
```

---

## 🚀 Migration Steps

### **Step 1:** Install Dependencies
```bash
cd frontend
npm install framer-motion
```

### **Step 2:** Update Global CSS
- Copy design tokens from prototype
- Add Outfit font import
- Update color variables

### **Step 3:** Create Layout Components
- DashboardLayout with fixed sidebar
- AuthLayout for login/register pages

### **Step 4:** Update Pages One by One
- Dashboard → Agent cards + stats
- CV Intelligence → Match prototype
- Interviews → Match prototype
- Support → Match prototype
- Profile → Match prototype
- Admin pages → Match prototype

### **Step 5:** Test Responsiveness
- Mobile sidebar toggle
- Tablet layouts
- Desktop experience

---

## ⚠️ Breaking Changes

1. **Sidebar is now fixed** (not collapsible by default)
2. **Dark mode is default** (remove light mode toggle for now)
3. **Animations require JavaScript** (Framer Motion)
4. **New color scheme** might require database badge updates

---

## ✅ Checklist

- [ ] Install framer-motion
- [ ] Update globals.css
- [ ] Create DashboardLayout
- [ ] Update dashboard page
- [ ] Update CV Intelligence page
- [ ] Update Interviews page
- [ ] Update Support page
- [ ] Update Profile page
- [ ] Update Admin pages
- [ ] Test all pages
- [ ] Test mobile responsiveness
- [ ] Deploy to staging

---

**Migration Priority:** High  
**Estimated Time:** 2-3 hours  
**Status:** Ready to begin
