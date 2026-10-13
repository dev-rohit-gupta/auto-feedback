import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import FeedbackMenu from "./src/components/FeedbackMenu";
import AppNoticeModal, { type AppNotice } from "./src/components/AppNoticeModal";
import type { FeedbackMode } from "./src/automation/types";
import { FEATURES } from "./src/config/features";
import { BRAND } from "./src/config/brand";
import { ERP_URL, isErpUrl } from "./src/config/erp";
import { ERP_ALERT_SCRIPT, parseErpAlertMessage } from "./src/erp/erpAlertBridge";
import { ERP_SESSION_SCRIPT, parseErpSessionMessage, type ErpSessionStatus } from "./src/erp/erpSessionBridge";
import type { FeedbackInspectionState } from "./src/erp/feedbackInspection";
import { LiveErpFeedbackProbe } from "./src/erp/LiveErpFeedbackProbe";
import {
  createErpPageObserverScript,
  parseErpFormChange,
} from "./src/erp/erpPageObserverScript";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const currentUrl = useRef(ERP_URL);
  const feedbackProbe = useRef(new LiveErpFeedbackProbe());

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("excellent");
  const [sessionStatus, setSessionStatus] =
    useState<ErpSessionStatus>("checking");
  const [inspection, setInspection] = useState<FeedbackInspectionState>({
    status: "idle",
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack.current) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, []);

  const checkErpSession = () => {
    setSessionStatus("checking");
    if (!isErpUrl(currentUrl.current)) {
      setSessionStatus("unknown");
    } else if (!isLoading) {
      webViewRef.current?.injectJavaScript(ERP_SESSION_SCRIPT);
    }
    // While a page is loading, onLoadEnd will perform the check.
  };

  const inspectFeedbackPage = () => {
    if (sessionStatus !== "logged_in" || isLoading ||
        !isErpUrl(currentUrl.current)) {
      setInspection({
        status: "error",
        message: "Open a logged-in ERP page and try again.",
      });
      return;
    }
    if (!webViewRef.current) return;
    setInspection({ status: "loading" });
    feedbackProbe.current.request((script) => {
      webViewRef.current?.injectJavaScript(script);
    });
  };

  const reloadERP = () => {
    setLoadError(null);
    setIsLoading(true);
    setSessionStatus("checking");
    webViewRef.current?.reload();
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!isErpUrl(event.nativeEvent.url)) return;

    try {
      const data: unknown = JSON.parse(event.nativeEvent.data);
      if (parseErpFormChange(data)) {
        feedbackProbe.current.invalidate();
        setInspection((previous) =>
          previous.status === "idle" ? previous : { status: "stale" },
        );
        return;
      }
      const snapshot = feedbackProbe.current.accept(data);
      if (snapshot) {
        if (snapshot.scanFailed) {
          const message = "Could not inspect the current ERP page. Please try again.";
          setInspection({ status: "error", message });
          setNotice({ title: "Inspection Error", message, kind: "error" });
        } else {
          setInspection({ status: "ready", snapshot });
        }
        return;
      }
      const session = parseErpSessionMessage(data);
      if (session !== null) {
        setSessionStatus(session);
        return;
      }

      const alertMessage = parseErpAlertMessage(data);
      if (alertMessage !== null && FEATURES.customErpAlerts) {
        setNotice({
          title: "ERP Notification",
          message: alertMessage,
          kind: "info",
        });
      }
    } catch {
      // Other messages from the ERP are not part of our bridge.
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{BRAND.name}</Text>
            <Text style={styles.subtitle}>{BRAND.subtitle}</Text>
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
          injectedJavaScriptBeforeContentLoaded={FEATURES.customErpAlerts ? ERP_ALERT_SCRIPT : undefined}
          onLoadStart={() => {
            feedbackProbe.current.invalidate();
            setInspection({ status: "idle" });
            setLoadError(null);
            setIsLoading(true);
            setSessionStatus("checking");
          }}
          onLoadEnd={(event) => {
            setIsLoading(false);
            if (isErpUrl(event.nativeEvent.url)) {
              if (FEATURES.customErpAlerts) {
                webViewRef.current?.injectJavaScript(ERP_ALERT_SCRIPT);
              }
              webViewRef.current?.injectJavaScript(ERP_SESSION_SCRIPT);
              webViewRef.current?.injectJavaScript(createErpPageObserverScript());
            } else {
              setSessionStatus("unknown");
            }
          }}
          onMessage={handleMessage}
          onNavigationStateChange={(navState) => {
            canGoBack.current = navState.canGoBack;
            currentUrl.current = navState.url;
            if (__DEV__) {
              console.log("[ERP NAV]", {
                url: navState.url.split(/[?#]/)[0],
                canGoBack: navState.canGoBack,
                loading: navState.loading,
              });
            }
          }}
          onError={() => {
            feedbackProbe.current.invalidate();
            setInspection({ status: "idle" });
            setIsLoading(false);
            setSessionStatus("unknown");
            setLoadError("ERP connection failed.");
            setNotice({
              title: "Connection Error",
              message:
                "Unable to load the ERP website. Check your connection and try Refresh.",
              kind: "error",
            });
          }}
        />

        <FeedbackMenu
          mode={feedbackMode}
          onModeChange={setFeedbackMode}
          sessionStatus={sessionStatus}
          onCheckSession={checkErpSession}
          inspection={inspection}
          onInspectFeedbackPage={inspectFeedbackPage}
        />

        <AppNoticeModal
          notice={notice}
          onDismiss={() => setNotice(null)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
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
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  refreshButton: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
  },
  refreshText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
  webview: { flex: 1, backgroundColor: "#ffffff" },
  errorContainer: { padding: 12, backgroundColor: "#fef2f2" },
  errorText: { color: "#b91c1c", fontSize: 13 }
});
