
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

const ERP_URL = "https://erp.mitra.ac.in";

// Set false if the ERP has problems with custom alerts.
const ENABLE_CUSTOM_ALERTS = true;

const isErpUrl = (url: string) =>
  /^https:\/\/erp\.mitra\.ac\.in(?:[/?#]|$)/i.test(url);

const ALERT_SCRIPT = `
(function () {
  if (window.__erpAlertBridgeInstalled) return;

  window.__erpAlertBridgeInstalled = true;

  var originalAlert = window.alert.bind(window);

  window.alert = function (message) {
    try {
      if (!window.ReactNativeWebView) {
        return originalAlert(message);
      }

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "ERP_ALERT",
          message: String(message ?? "")
        })
      );
    } catch (error) {
      originalAlert(message);
    }
  };
})();
true;
`;

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const canGoBack = useRef(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popup, setPopup] = useState<string | null>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack.current) {
          webViewRef.current?.goBack();
          return true;
        }

        return false;
      }
    );

    return () => subscription.remove();
  }, []);

  const reloadERP = () => {
    setLoadError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!isErpUrl(event.nativeEvent.url)) return;

    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (
        data?.type === "ERP_ALERT" &&
        typeof data.message === "string"
      ) {
        setPopup(data.message.slice(0, 2000));
      }
    } catch {
      // Ignore unrelated messages.
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
        />

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Auto Feedback</Text>
            <Text style={styles.subtitle}>Student ERP</Text>
          </View>

        <Pressable
          onPress={reloadERP}
          style={styles.refreshButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.refreshText}>Refresh</Text>
          )}
        </Pressable>
        </View>

        {loadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              ERP could not load. Check your connection.
            </Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: ERP_URL }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          injectedJavaScriptBeforeContentLoaded={ALERT_SCRIPT}
          onLoadStart={() => {
            setLoadError(null);
            setIsLoading(true);
          }}
          onLoadEnd={(event) => {
            setIsLoading(false);

            if (
              ENABLE_CUSTOM_ALERTS &&
              isErpUrl(event.nativeEvent.url)
            ) {
              webViewRef.current?.injectJavaScript(ALERT_SCRIPT);
            }
          }}
          onMessage={handleMessage}
          onNavigationStateChange={(navState) => {
            canGoBack.current = navState.canGoBack;

            if (__DEV__) {
              // Exclude query strings and fragments,
              // which may contain authentication tokens.
              const safeUrl = navState.url.split(/[?#]/)[0];

              console.log("[ERP NAV]", {
                url: safeUrl,
                canGoBack: navState.canGoBack,
                loading: navState.loading,
              });
            }
          }}
          onError={(event) => {
            setIsLoading(false);
            setLoadError(event.nativeEvent.description);
          }}
        />

        <Modal
          visible={popup !== null}
          transparent
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setPopup(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>i</Text>
              </View>

              <Text style={styles.modalTitle}>
                ERP Notification
              </Text>

              <Text style={styles.modalMessage}>
                {popup}
              </Text>

              <Pressable
                style={styles.modalButton}
                onPress={() => setPopup(null)}
              >
                <Text style={styles.modalButtonText}>
                  Got it
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  refreshButton: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
  },
  refreshText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
  },
  errorContainer: {
    padding: 12,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.5)",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    elevation: 10,
  },
  iconContainer: {
    height: 52,
    width: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2563eb",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "#2563eb",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
