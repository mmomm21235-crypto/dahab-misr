# ============================================================================
# Dahab Misr - Android APK Security (R8/ProGuard Rules)
# Team 4: Mobile APK Security
# ============================================================================

# ----------------------------
# R8 Full Mode Optimization
# ----------------------------
-allowaccessmodification
-overloadaggressively
-repackageclasses ''
-flattenpackagehierarchy ''

# ----------------------------
# Obfuscation & Shrink Settings
# ----------------------------
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod
-keepattributes *Annotation*

# ----------------------------
# Capacitor / WebView Core
# ----------------------------
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public void handleOnStart();
    public void handleOnResume();
    public void handleOnPause();
    public void handleOnStop();
    public void handleOnDestroy();
    public void load();
    @com.getcapacitor.annotation.CapacitorPlugin { *; }
    @com.getcapacitor.PluginMethod { *; }
}

# ----------------------------
# Node.js / Prisma / Native Bridge
# ----------------------------
-keep class com.dahabmisr.app.MainActivity { *; }
-keep class com.dahabmisr.app.SecurityConfig { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class org.unimodules.** { *; }
-keep class expo.** { *; }

# Keep JavaScript interface for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ----------------------------
# Security Classes (Do Not Rename)
# Keep security checks intact to prevent tampering
# ----------------------------
-keep class com.dahabmisr.app.SecurityConfig { *; }
-keep class com.dahabmisr.app.MainActivity { *; }
-keep class com.dahabmisr.app.security.** { *; }

# ----------------------------
# Cordova Plugin Support
# ----------------------------
-keep class org.apache.cordova.** { *; }
-keep class org.apache.cordova.** { public protected *; }
-keepclassmembers class * {
    @org.apache.cordova.CallbackContext <methods>;
}

# ----------------------------
# AndroidX / Material
# ----------------------------
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# ----------------------------
# Enum Safety
# ----------------------------
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ----------------------------
# Parcelable
# ----------------------------
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# ----------------------------
# Serializable
# ----------------------------
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ----------------------------
# Remove Logging in Release
# ----------------------------
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
    public static int wtf(...);
    public static int println(...);
}

# ----------------------------
# Suppress Warnings
# ----------------------------
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe
-dontwarn com.google.errorprone.annotations.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ----------------------------
# Google Play Services
# ----------------------------
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ----------------------------
# Stripe / Payment SDK (if used)
# ----------------------------
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# ----------------------------
# Firebase (if used)
# ----------------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.measurement.** { *; }
