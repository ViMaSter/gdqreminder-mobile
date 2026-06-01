package ke.mahn.gdqreminder;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.view.View;
import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import org.json.JSONObject;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Regression tests for commit e6a97d2 ("fix: Resolves regression with safearea").
 *
 * All tests share a single ActivityScenario so the activity is only created and
 * destroyed once. This avoids a Keyboard-plugin NPE crash on API 35 during
 * activity teardown, which would abort the test runner mid-suite.
 */
@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class SafeAreaTest {

    private static ActivityScenario<MainActivity> scenario;
    private static WebView sharedWebView;

    /**
     * Lazy initializer — runs inside the first test method so it is guaranteed to
     * execute in the proper instrumentation context. The scenario is intentionally
     * never closed: explicit close() triggers a Keyboard-plugin crash on API 35
     * during activity teardown. The process is cleaned up by the test runner after
     * all results are recorded.
     */
    private static synchronized void ensureInitialized() {
        if (isScenarioUsable() && isWebViewUsable()) {
            return;
        }

        scenario = ActivityScenario.launch(MainActivity.class);
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        sharedWebView = requireWebViewStatic(scenario);
        waitForAppReadyStatic(sharedWebView);
    }

    private static boolean isScenarioUsable() {
        if (scenario == null) {
            return false;
        }

        try {
            scenario.onActivity(activity -> {
                // No-op: this throws if the activity is already destroyed.
            });
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    private static boolean isWebViewUsable() {
        if (sharedWebView == null) {
            return false;
        }

        CountDownLatch latch = new CountDownLatch(1);
        try {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                sharedWebView.evaluateJavascript("true", value -> latch.countDown())
            );
            return latch.await(2, TimeUnit.SECONDS);
        } catch (Throwable ignored) {
            return false;
        }
    }

    /**
     * Validates runtime geometry in the WebView.
     *
     * This checks rendered DOM positions (top bar and app root) rather than only
     * static source strings.
     */
    @Test
    public void test2_webContentStartsAtTopAndFillsViewport() {
        ensureInitialized();
        WebView androidWebView = sharedWebView;

            JSONObject metrics = evaluateJsObject(
                androidWebView,
                "(() => {"
                    + "  const app = document.getElementById('app');"
                    + "  const topBar = document.querySelector('mwc-top-app-bar-fixed[data-test-selector=\\\"main\\\"]');"
                    + "  const appRect = app ? app.getBoundingClientRect() : null;"
                    + "  const topBarRect = topBar ? topBar.getBoundingClientRect() : null;"
                    + "  return {"
                    + "    innerHeight: window.innerHeight,"
                    + "    clientHeight: document.documentElement.clientHeight,"
                    + "    appTop: appRect ? appRect.top : null,"
                    + "    appBottom: appRect ? appRect.bottom : null,"
                    + "    topBarTop: topBarRect ? topBarRect.top : null"
                    + "  };"
                    + "})()"
            );

            assertTrue("App root must exist in DOM", !metrics.isNull("appTop"));
            assertTrue("Top app bar must exist in DOM", !metrics.isNull("topBarTop"));

            double appTop = metrics.optDouble("appTop", Double.NaN);
            double appBottom = metrics.optDouble("appBottom", Double.NaN);
            double topBarTop = metrics.optDouble("topBarTop", Double.NaN);
            int innerHeight = metrics.optInt("innerHeight", -1);
            int clientHeight = metrics.optInt("clientHeight", -1);

            assertTrue("App root should start at viewport top (was " + appTop + ")", Math.abs(appTop) <= 1.0);
            assertTrue("Top app bar should render at the top edge (was " + topBarTop + ")", Math.abs(topBarTop) <= 1.0);
            assertTrue(
                "App root should reach viewport bottom (bottom=" + appBottom + ", innerHeight=" + innerHeight + ")",
                appBottom >= (innerHeight - 1.0)
            );
            assertTrue(
                "documentElement height should match innerHeight (innerHeight=" + innerHeight + ", clientHeight=" + clientHeight + ")",
                Math.abs(innerHeight - clientHeight) <= 1
            );
    }

    /**
     * Verifies viewport meta at runtime in the loaded document.
     */
    @Test
    public void test1_viewportMetaContainsViewportFitCover() {
            ensureInitialized();
            String viewportContent = evaluateJsRaw(
                sharedWebView,
                "(() => {"
                    + "  const viewport = document.querySelector('meta[name=\\\"viewport\\\"]');"
                    + "  return viewport ? viewport.getAttribute('content') : '';"
                    + "})()"
            );

            assertTrue(
                "Viewport meta content must include viewport-fit=cover, got: " + viewportContent,
                viewportContent.contains("viewport-fit=cover")
            );
    }

    /**
     * SafeAreaPlugin must be registered with the Capacitor bridge.
     */
    @Test
    public void test3_safeAreaPluginIsRegisteredWithBridge() {
            ensureInitialized();
            scenario.onActivity(activity -> {
                assertNotNull(
                    "BridgeActivity.getBridge() must not be null after onCreate()",
                    activity.getBridge()
                );

                PluginHandle handle = activity.getBridge().getPlugin("SafeArea");
                Plugin plugin = handle != null ? handle.getInstance() : null;

                assertNotNull(
                    "SafeAreaPlugin must be registered via registerPlugin(SafeAreaPlugin.class) in MainActivity.onCreate().",
                    plugin
                );

                assertTrue(
                    "The registered plugin must be an instance of SafeAreaPlugin",
                    plugin instanceof com.capacitor.safearea.SafeAreaPlugin
                );
            });
    }

    /**
     * Validates that safe area insets are applied as CSS custom properties.
     *
     * The SafeArea plugin should set --safe-area-inset-{top,bottom,left,right}
     * on the document root so content can be positioned around notches/safe areas.
     */
    @Test
    public void test4_safeAreaInsetsCssCustomPropertiesAreSet() {
            ensureInitialized();
            waitForUiSettled(sharedWebView);
            JSONObject insets = evaluateJsObject(
                sharedWebView,
                "(() => {"
                    + "  const root = document.documentElement;"
                    + "  const style = getComputedStyle(root);"
                    + "  return {"
                    + "    top: style.getPropertyValue('--safe-area-inset-top').trim(),"
                    + "    bottom: style.getPropertyValue('--safe-area-inset-bottom').trim(),"
                    + "    left: style.getPropertyValue('--safe-area-inset-left').trim(),"
                    + "    right: style.getPropertyValue('--safe-area-inset-right').trim()"
                    + "  };"
                    + "})()"
            );

            assertTrue(
                "Safe area inset CSS custom properties must be defined",
                !insets.isNull("top") && !insets.isNull("bottom") && 
                !insets.isNull("left") && !insets.isNull("right")
            );

            String top = insets.optString("top", "");
            String bottom = insets.optString("bottom", "");
            String left = insets.optString("left", "");
            String right = insets.optString("right", "");

            assertTrue("--safe-area-inset-top should be set (got: '" + top + "')", !top.isEmpty());
            assertTrue("--safe-area-inset-bottom should be set (got: '" + bottom + "')", !bottom.isEmpty());
            assertTrue("--safe-area-inset-left should be set (got: '" + left + "')", !left.isEmpty());
            assertTrue("--safe-area-inset-right should be set (got: '" + right + "')", !right.isEmpty());
    }

    private static void waitForUiSettled(WebView webView) {
        // Avoid transient Android 15 timing where IME/window inset callbacks are still
        // settling while assertions start.
        final int maxAttempts = 20;
        String previousSnapshot = null;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String snapshot = evaluateJsRaw(
                webView,
                "(() => {"
                    + "  const style = getComputedStyle(document.documentElement);"
                    + "  const active = document.activeElement;"
                    + "  return JSON.stringify({"
                    + "    top: style.getPropertyValue('--safe-area-inset-top').trim(),"
                    + "    bottom: style.getPropertyValue('--safe-area-inset-bottom').trim(),"
                    + "    left: style.getPropertyValue('--safe-area-inset-left').trim(),"
                    + "    right: style.getPropertyValue('--safe-area-inset-right').trim(),"
                    + "    viewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight,"
                    + "    activeTag: active ? active.tagName : ''"
                    + "  });"
                    + "})()"
            );

            if (snapshot != null && snapshot.equals(previousSnapshot)) {
                return;
            }

            previousSnapshot = snapshot;
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AssertionError("Interrupted while waiting for UI to settle", e);
            }
        }
    }

    private static void waitForAppReadyStatic(WebView webView) {
        final int maxAttempts = 40;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String ready = evaluateJsRaw(
                webView,
                "(() => document.readyState === 'complete' && !!document.querySelector('mwc-top-app-bar-fixed[data-test-selector=\\\"main\\\"]'))()"
            );
            if ("true".equals(ready)) {
                return;
            }

            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AssertionError("Interrupted while waiting for app to render", e);
            }
        }

        throw new AssertionError("Timed out waiting for app to render top app bar");
    }

    private static WebView requireWebViewStatic(ActivityScenario<MainActivity> scenario) {
        AtomicReference<WebView> webViewRef = new AtomicReference<>();

        scenario.onActivity(activity -> {
            View webView = activity.getBridge().getWebView();
            assertNotNull("WebView must exist", webView);
            assertTrue("Bridge WebView must be an Android WebView", webView instanceof WebView);
            webViewRef.set((WebView) webView);
        });

        WebView webView = webViewRef.get();
        assertNotNull("Failed to obtain WebView from activity", webView);
        return webView;
    }

    private static JSONObject evaluateJsObject(WebView webView, String script) {
        String raw = evaluateJsRaw(webView, script);
        try {
            return new JSONObject(raw);
        } catch (Exception e) {
            throw new AssertionError("Failed to parse JS object result: " + raw, e);
        }
    }

    private static String evaluateJsRaw(WebView webView, String script) {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> valueRef = new AtomicReference<>();

        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            webView.evaluateJavascript(script, value -> {
                valueRef.set(value);
                latch.countDown();
            })
        );

        try {
            assertTrue("Timed out waiting for evaluateJavascript", latch.await(15, TimeUnit.SECONDS));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AssertionError("Interrupted while waiting for evaluateJavascript", e);
        }

        String raw = valueRef.get();
        assertNotNull("evaluateJavascript returned null", raw);

        // WebView wraps JS strings in quotes; strip them so callers can use raw text.
        if (raw.length() >= 2 && raw.startsWith("\"") && raw.endsWith("\"")) {
            raw = raw.substring(1, raw.length() - 1)
                .replace("\\\\", "\\")
                .replace("\\\"", "\"");
        }

        return raw;
    }
}
