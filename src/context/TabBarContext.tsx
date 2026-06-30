import React, {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import {
  Animated,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";

/**
 * Drives the auto-hiding bottom tab bar. Scrollable screens call `onScroll`;
 * scrolling down hides the bar, scrolling up (or reaching the top) reveals it.
 * The tab bar reads `translateY` to animate itself off-screen.
 */

const HIDDEN_OFFSET = 120; // enough to clear the bar + home indicator
const DELTA = 8; // ignore tiny scroll jitter
const REVEAL_AT_TOP = 12;
const HIDE_AFTER = 48; // don't hide until scrolled a little past the top

interface TabBarVisibility {
  translateY: Animated.Value;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reveal: () => void;
}

const Ctx = createContext<TabBarVisibility | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const shown = useRef(true);

  const animateTo = (toValue: number, nextShown: boolean) => {
    shown.current = nextShown;
    Animated.timing(translateY, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const reveal = () => {
    if (!shown.current) animateTo(0, true);
  };
  const hide = () => {
    if (shown.current) animateTo(HIDDEN_OFFSET, false);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;

    if (y <= REVEAL_AT_TOP) {
      reveal();
      return;
    }
    if (dy > DELTA && y > HIDE_AFTER) hide();
    else if (dy < -DELTA) reveal();
  };

  return (
    <Ctx.Provider value={{ translateY, onScroll, reveal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibility {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useTabBarVisibility must be used within a TabBarVisibilityProvider",
    );
  }
  return ctx;
}
