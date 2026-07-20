package com.dahabmisr.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

/**
 * Main Activity for Dahab Misr.
 * Extends Capacitor's BridgeActivity and adds security checks at startup.
 *
 * Security checks run on a background thread; the app continues to load
 * unless a critical threat (tamper) is found.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    // Set to true to block the app on rooted devices
    private static final boolean BLOCK_ON_ROOT = true;

    // Set to true to block on emulator (useful for production)
    private static final boolean BLOCK_ON_EMULATOR = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Perform security checks asynchronously to avoid blocking the UI thread
        performSecurityChecks();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-check debugger attachment on resume (in case it was attached while paused)
        SecurityConfig securityConfig = new SecurityConfig(this);
        if (securityConfig.isDebuggerAttached()) {
            logSecurityEvent("Debugger detected on resume");
        }
    }

    private void performSecurityChecks() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                SecurityConfig securityConfig = new SecurityConfig(this);
                SecurityConfig.SecurityReport report = securityConfig.performSecurityChecks(BLOCK_ON_ROOT);

                if (report.isDebuggerAttached) {
                    logSecurityEvent("Debugger attached - consider blocking");
                    // Optionally show a warning toast in debug builds
                    if (report.isDebugMode) {
                        runOnUiThread(() -> Toast.makeText(
                                MainActivity.this,
                                "Debugger detected",
                                Toast.LENGTH_LONG
                        ).show());
                    }
                }

                if (report.isAPKTampered || report.isPackageNameTampered) {
                    logSecurityEvent("APK tamper detected - blocking");
                    runOnUiThread(() -> {
                        Toast.makeText(
                                MainActivity.this,
                                "Security violation detected",
                                Toast.LENGTH_LONG
                        ).show();
                        finish();
                    });
                    return;
                }

                if (BLOCK_ON_ROOT && report.isRooted) {
                    logSecurityEvent("Root detected - blocking");
                    runOnUiThread(() -> {
                        Toast.makeText(
                                MainActivity.this,
                                "This app cannot run on rooted devices",
                                Toast.LENGTH_LONG
                        ).show();
                        finish();
                    });
                    return;
                }

                if (BLOCK_ON_EMULATOR && report.isEmulator) {
                    logSecurityEvent("Emulator detected - blocking");
                    runOnUiThread(() -> {
                        Toast.makeText(
                                MainActivity.this,
                                "This app cannot run on emulators",
                                Toast.LENGTH_LONG
                        ).show();
                        finish();
                    });
                    return;
                }

                if (report.isDebugFrameworkDetected) {
                    logSecurityEvent("Debug framework detected - blocking");
                    runOnUiThread(() -> {
                        Toast.makeText(
                                MainActivity.this,
                                "Security violation detected",
                                Toast.LENGTH_LONG
                        ).show();
                        finish();
                    });
                    return;
                }

                if (report.hasThreats) {
                    logSecurityEvent("Threats detected but not blocking: " + report.toString());
                } else {
                    logSecurityEvent("All security checks passed");
                }

            } catch (Exception e) {
                Log.e(TAG, "Error during security checks", e);
            }
        }, 500); // Small delay to let the activity fully initialize
    }

    private void logSecurityEvent(String event) {
        // In release builds, Log calls are stripped by ProGuard rules
        Log.w(TAG, "SECURITY: " + event);
    }
}
