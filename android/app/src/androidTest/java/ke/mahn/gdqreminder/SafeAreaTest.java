package ke.mahn.gdqreminder;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.view.View;
import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.getcapacitor.Plugin;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Regression tests for commit e6a97d2 ("fix: Resolves regression with safearea").
 */
@RunWith(AndroidJUnit4.class)
public class SafeAreaTest {

    /**
     * Validates runtime geometry in the WebView.
     *
     * This checks rendered DOM positions (top bar and app root) rather than only
     * static source strings.
     */
    @Test
    public void webContentStartsAtTopAndFillsViewport() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();

            WebView androidWebView = requireWebView(scenario);
            waitForAppReady(androidWebView);

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
    }

    /**
     * Verifies viewport meta at runtime in the loaded document.
     */
    @Test
    public void viewportMetaContainsViewportFitCover() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();

            WebView androidWebView = requireWebView(scenario);
            waitForAppReady(androidWebView);

            String viewportContent = evaluateJsRaw(
                androidWebView,
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
    }

    /**
     * SafeAreaPlugin must be registered with the Capacitor bridge.
     */
    @Test
    public void safeAreaPluginIsRegisteredWithBridge() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();

            scenario.onActivity(activity -> {
                assertNotNull(
                    "BridgeActivity.getBridge() must not be null after onCreate()",
                    activity.getBridge()
                );

                Plugin plugin = activity.getBridge().getPlugin("SafeArea").getInstance();

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
    }

    private void waitForAppReady(WebView webView) {
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

    private WebView requireWebView(ActivityScenario<MainActivity> scenario) {
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

    private JSONObject evaluateJsObject(WebView webView, String script) {
        String raw = evaluateJsRaw(webView, script);
        try {
            return new JSONObject(raw);
        } catch (Exception e) {
            throw new AssertionError("Failed to parse JS object result: " + raw, e);
        }
    }

    private String evaluateJsRaw(WebView webView, String script) {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> valueRef = new AtomicReference<>();

        webView.post(() -> webView.evaluateJavascript(script, value -> {
            valueRef.set(value);
            latch.countDown();
        }));

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
