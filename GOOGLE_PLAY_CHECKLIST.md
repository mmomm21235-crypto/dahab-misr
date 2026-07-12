# 📱 Google Play Store Checklist

## Before Publishing
- [ ] Create developer account (one-time $25 fee)
- [ ] Prepare app icon (512x512, 1024x1024)
- [ ] Take screenshots (phone + tablet, English + Arabic)
- [ ] Write app description (Arabic + English)
- [ ] Set up privacy policy page
- [ ] Test on real devices

## Step-by-Step

### Option A: PWA Wrapper (Bubblewrap)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://dahab-misr.vercel.app/manifest.json
bubblewrap build
# APK will be in app/build/outputs/apk/
```

### Option B: Capacitor (React Native / web view)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap sync
npx cap open android
# Build APK from Android Studio
```

### Option C: Flutter (full native, new project)
```bash
flutter create dahab_misr_mobile
# Rebuild UI in Flutter, connect to same API
```

## App Store (iOS)
- Apple Developer Account ($99/year)
- iPad + iPhone screenshots
- App Privacy details
- TestFlight for beta testing
