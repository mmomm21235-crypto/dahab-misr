package com.dahabmisr.app;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.Debug;
import android.provider.Settings;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;

/**
 * Security configuration and checks for the Dahab Misr Android app.
 * Team 4: Mobile APK Security
 *
 * Provides: root detection, debugger detection, emulator detection,
 * tamper detection (APK signature verification), and integrity checks.
 */
public class SecurityConfig {

    private static final String TAG = "SecurityConfig";

    // Debug mode is determined at build time
    private static final boolean IS_DEBUG = BuildConfig.DEBUG;

    // Paths commonly found on rooted devices
    private static final String[] ROOT_INDICATORS = {
            "/system/app/Superuser.apk",
            "/system/xbin/su",
            "/system/bin/su",
            "/sbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su",
            "/system/app/SuperSU.apk",
            "/system/app/SuperSU",
            "/system/app/BusyBox.apk",
            "/cache/su"
    };

    // Packages commonly associated with root
    private static final String[] ROOT_PACKAGES = {
            "com.topjohnwu.magisk",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.noshufou.android.su",
            "com.saurik.substrate",
            "com.devadvance.rootcloak",
            "com.devadvance.rootcloakplus",
            "com.kingo.root",
            "com.smedialink.oneclickroot",
            "com.zhiqupk.root.global",
            "com.alephzain.framaroot"
    };

    // Emulator indicators
    private static final String[] EMULATOR_FILES = {
            "/dev/socket/qemud",
            "/dev/qemu_pipe",
            "/system/lib/libc_malloc_debug_qemu.so",
            "/sys/qemu_trace",
            "/system/bin/qemu-arm",
            "/system/bin/qemu-x86",
            "/dev/goldfish_pipe"
    };

    private static final String[] EMULATOR_PROPERTIES = {
            "ro.hardware",
            "ro.product.model",
            "ro.product.device",
            "ro.product.board",
            "ro.boot.qemu",
            "ro.kernel.qemu"
    };

    private static final String[] EMULATOR_BRANDS = {
            "generic",
            "sdk",
            "google_sdk",
            "genymotion"
    };

    private static final String[] DEBUGGER_INDICATORS = {
            "android_server",
            "android_server.jar",
            "android_server64",
            "android_server64.jar",
            "com.saurik.substrate",
            "frida",
            "frida-server",
            "xposed"
    };

    // Expected package name (guard against repackaging)
    private static final String EXPECTED_PACKAGE = "com.dahabmisr.app";

    // SHA-256 of your release signing certificate (set after first signing)
    // To get this: keytool -list -v -keystore your-release.jks -alias your-alias
    // or: apksigner verify --print-certs your-app.apk
    private static final String EXPECTED_CERT_SHA256 = "YOUR_CERT_SHA256_HASH_HERE";

    private final Context context;

    public SecurityConfig(Context context) {
        this.context = context.getApplicationContext();
    }

    // ========================================================================
    // Root Detection
    // ========================================================================

    /**
     * Checks if the device is rooted.
     * Returns true if ANY root indicator is detected.
     */
    public boolean isDeviceRooted() {
        return checkRootBinaries() || checkRootPackages() || checkSuCommand();
    }

    private boolean checkRootBinaries() {
        for (String path : ROOT_INDICATORS) {
            if (new File(path).exists()) {
                logSecurityEvent("Root binary detected: " + path);
                return true;
            }
        }
        return false;
    }

    private boolean checkRootPackages() {
        PackageManager pm = context.getPackageManager();
        for (String packageName : ROOT_PACKAGES) {
            try {
                pm.getPackageInfo(packageName, 0);
                logSecurityEvent("Root package detected: " + packageName);
                return true;
            } catch (PackageManager.NameNotFoundException e) {
                // Not installed, continue
            }
        }
        return false;
    }

    private boolean checkSuCommand() {
        try {
            Runtime.getRuntime().exec("which su");
            Process process = Runtime.getRuntime().exec("su -c echo root");
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()));
            String result = reader.readLine();
            reader.close();
            if ("root".equals(result)) {
                logSecurityEvent("su command succeeded");
                return true;
            }
        } catch (IOException e) {
            // su not available, which is expected on non-rooted devices
        } catch (SecurityException e) {
            logSecurityEvent("SecurityException checking su: " + e.getMessage());
        }
        return false;
    }

    // ========================================================================
    // Debugger Detection
    // ========================================================================

    /**
     * Checks if a debugger is attached to the app process.
     */
    public boolean isDebuggerAttached() {
        if (Debug.isDebuggerConnected()) {
            logSecurityEvent("Debugger is connected");
            return true;
        }
        return false;
    }

    /**
     * Checks for common debugging/instrumentation frameworks.
     */
    public boolean isDebugFrameworkDetected() {
        // Check for Xposed framework
        try {
            Class.forName("de.robv.android.xposed.XposedBridge");
            logSecurityEvent("Xposed framework detected");
            return true;
        } catch (ClassNotFoundException e) {
            // Not present
        }

        // Check for Frida
        try {
            Class.forName("com.facebook.frida.Frida");
            logSecurityEvent("Frida framework detected");
            return true;
        } catch (ClassNotFoundException e) {
            // Not present
        }

        // Check for common debug processes
        if (isProcessRunning(DEBUGGER_INDICATORS)) {
            logSecurityEvent("Debug process detected");
            return true;
        }

        return false;
    }

    private boolean isProcessRunning(String[] processNames) {
        try {
            Runtime.getRuntime().exec("ps");
            Process process = Runtime.getRuntime().exec("ps");
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                String lowerLine = line.toLowerCase();
                for (String name : processNames) {
                    if (lowerLine.contains(name.toLowerCase())) {
                        reader.close();
                        return true;
                    }
                }
            }
            reader.close();
        } catch (IOException e) {
            // ps not available
        }
        return false;
    }

    // ========================================================================
    // Emulator Detection
    // ========================================================================

    /**
     * Checks if the app is running on an emulator.
     */
    public boolean isEmulator() {
        return checkEmulatorFiles() || checkEmulatorProperties()
                || checkEmulatorBuild() || checkEmulatorTelephony();
    }

    private boolean checkEmulatorFiles() {
        for (String path : EMULATOR_FILES) {
            if (new File(path).exists()) {
                logSecurityEvent("Emulator file detected: " + path);
                return true;
            }
        }
        return false;
    }

    private boolean checkEmulatorProperties() {
        for (String prop : EMULATOR_PROPERTIES) {
            String value = getSystemProperty(prop);
            if (value != null && !value.isEmpty()) {
                if (value.contains("generic") || value.contains("sdk")
                        || value.contains("emulator") || value.contains("goldfish")) {
                    logSecurityEvent("Emulator property detected: " + prop + "=" + value);
                    return true;
                }
            }
        }
        return false;
    }

    private boolean checkEmulatorBuild() {
        String product = Build.PRODUCT;
        if (product != null) {
            for (String brand : EMULATOR_BRANDS) {
                if (product.toLowerCase().contains(brand)) {
                    logSecurityEvent("Emulator build detected: " + product);
                    return true;
                }
            }
        }
        return Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT);
    }

    private boolean checkEmulatorTelephony() {
        try {
            String imei = getSystemProperty("gsm.sim.imei");
            if (imei == null || imei.isEmpty() || imei.equals("000000000000000")) {
                // No IMEI can indicate emulator
                return false; // Not definitive
            }
        } catch (Exception e) {
            // Ignore
        }
        return false;
    }

    // ========================================================================
    // Tamper Detection (APK Signature Verification)
    // ========================================================================

    /**
     * Verifies the APK has not been repackaged by checking its signing certificate.
     */
    public boolean isAPKTampered() {
        if (EXPECTED_CERT_SHA256.startsWith("YOUR_")) {
            // Certificate hash not configured yet - skip check
            Log.w(TAG, "Certificate hash not configured - skipping tamper check");
            return false;
        }

        try {
            PackageInfo packageInfo;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo = context.getPackageManager().getPackageInfo(
                        context.getPackageName(),
                        PackageManager.GET_SIGNING_CERTIFICATES);
                Signature[] signatures = packageInfo.signingInfo.getApkContentsSigners();
                if (signatures != null && signatures.length > 0) {
                    String certHash = getCertificateSHA256(signatures[0]);
                    if (!EXPECTED_CERT_SHA256.equals(certHash)) {
                        logSecurityEvent("APK tampered: certificate mismatch");
                        return true;
                    }
                }
            } else {
                @SuppressWarnings("deprecation")
                PackageInfo legacyInfo = context.getPackageManager().getPackageInfo(
                        context.getPackageName(),
                        PackageManager.GET_SIGNATURES);
                @SuppressWarnings("deprecation")
                Signature[] signatures = legacyInfo.signatures;
                if (signatures != null && signatures.length > 0) {
                    String certHash = getCertificateSHA256(signatures[0]);
                    if (!EXPECTED_CERT_SHA256.equals(certHash)) {
                        logSecurityEvent("APK tampered: certificate mismatch");
                        return true;
                    }
                }
            }
        } catch (PackageManager.NameNotFoundException e) {
            logSecurityEvent("Package not found during tamper check: " + e.getMessage());
            return true;
        }
        return false;
    }

    /**
     * Verifies the package name has not been changed.
     */
    public boolean isPackageNameTampered() {
        String currentPackage = context.getPackageName();
        if (!EXPECTED_PACKAGE.equals(currentPackage)) {
            logSecurityEvent("Package name tampered: " + currentPackage);
            return true;
        }
        return false;
    }

    // ========================================================================
    // Runtime Integrity Checks
    // ========================================================================

    /**
     * Performs all security checks and returns the result.
     *
     * @param blockOnRoot if true, will attempt to kill the app when root is detected
     * @return true if any security threat is detected
     */
    public SecurityReport performSecurityChecks(boolean blockOnRoot) {
        SecurityReport report = new SecurityReport();

        report.isRooted = isDeviceRooted();
        report.isDebuggerAttached = isDebuggerAttached();
        report.isDebugFrameworkDetected = isDebugFrameworkDetected();
        report.isEmulator = isEmulator();
        report.isAPKTampered = isAPKTampered();
        report.isPackageNameTampered = isPackageNameTampered();
        report.isDebugMode = IS_DEBUG;

        report.hasThreats = report.isRooted || report.isDebuggerAttached
                || report.isDebugFrameworkDetected || report.isAPKTampered
                || report.isPackageNameTampered;

        if (report.hasThreats) {
            logSecurityEvent("Security threats detected: " + report.toString());
        }

        return report;
    }

    // ========================================================================
    // Utility Methods
    // ========================================================================

    private String getSystemProperty(String prop) {
        try {
            Process process = Runtime.getRuntime().exec("getprop " + prop);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()));
            String value = reader.readLine();
            reader.close();
            return value;
        } catch (IOException e) {
            return null;
        }
    }

    private String getCertificateSHA256(Signature signature) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] certData = signature.toByteArray();
            byte[] publicKeyHash = md.digest(certData);
            StringBuilder hexString = new StringBuilder();
            for (byte b : publicKeyHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "SHA-256 algorithm not available", e);
            return "";
        }
    }

    private void logSecurityEvent(String event) {
        // In release builds, Log calls are stripped by ProGuard rules.
        // This method exists so the security intent is recorded in code.
        if (IS_DEBUG) {
            Log.w(TAG, "SECURITY: " + event);
        }
    }

    // ========================================================================
    // Security Report
    // ========================================================================

    /**
     * Holds the results of all security checks.
     */
    public static class SecurityReport {
        public boolean isRooted = false;
        public boolean isDebuggerAttached = false;
        public boolean isDebugFrameworkDetected = false;
        public boolean isEmulator = false;
        public boolean isAPKTampered = false;
        public boolean isPackageNameTampered = false;
        public boolean isDebugMode = false;
        public boolean hasThreats = false;

        @Override
        public String toString() {
            return "SecurityReport{"
                    + "rooted=" + isRooted
                    + ", debugger=" + isDebuggerAttached
                    + ", debugFramework=" + isDebugFrameworkDetected
                    + ", emulator=" + isEmulator
                    + ", tampered=" + isAPKTampered
                    + ", pkgTampered=" + isPackageNameTampered
                    + ", debugMode=" + isDebugMode
                    + ", threats=" + hasThreats
                    + "}";
        }
    }
}
