
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
import { WebView } from "react-native-webview";

const ERP_URL = "https://erp.mitra.ac.in";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const canGoBack = useRef(false);

  const [loadError, setLoadError] = useState<string | null>(null);

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
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Auto Feedback</Text>

        <Pressable onPress={reloadERP} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {loadError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ERP could not load. Check your internet connection.
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: ERP_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              Loading ERP...
            </Text>
          </View>
        )}
        onLoadStart={() => {
          setLoadError(null);
        }}
        onNavigationStateChange={(navState) => {
          canGoBack.current = navState.canGoBack;
        }}
        onError={(event) => {
          setLoadError(event.nativeEvent.description);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: 56,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  refreshText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  webview: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    padding: 12,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
});
