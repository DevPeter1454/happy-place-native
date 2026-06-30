import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  fontFamilies,
  fontSizes,
  radii,
  spacing,
  shadows,
} from "../theme";

interface ToastContextValue {
  /** Show a short auto-dismissing message at the bottom of the screen. */
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((message: string) => {
    counter.current += 1;
    setToast({ id: counter.current, message });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.host, { bottom: insets.bottom + 90 }]}
      >
        <AnimatePresence>
          {toast && (
            <MotiView
              key={toast.id}
              from={{ opacity: 0, translateY: 20, scale: 0.96 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: 20, scale: 0.96 }}
              transition={{ type: "timing", duration: 220 }}
              style={styles.toast}
            >
              <Text style={styles.text} numberOfLines={2}>
                {toast.message}
              </Text>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toast: {
    maxWidth: "100%",
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    ...shadows.lg,
  },
  text: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
});
