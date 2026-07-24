/**
 * Mediator Pattern: useLayoutMediator
 * Manages responsive layout state and window event listeners.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  LayoutStrategyResolver,
  type LayoutStrategy,
  type LayoutMode,
} from '@/strategies/layoutStrategy';
import { EmbeddedWindowAdapter } from '@/adapters/embeddedWindowAdapter';

export type TabType = 'chat' | 'terminal' | 'settings';

export function useLayoutMediator() {
  const containerRef = ref<HTMLElement | null>(null);
  const containerWidth = ref<number>(window.innerWidth);
  const containerHeight = ref<number>(window.innerHeight);

  const strategyType = ref<string>('auto');
  const activeTab = ref<TabType>('chat');
  const isSettingsOpen = ref<boolean>(false);
  const unreadTerminalLogs = ref<number>(0);

  const windowAdapter = new EmbeddedWindowAdapter();
  const isEmbedded = ref<boolean>(windowAdapter.checkIsEmbedded());

  const currentStrategy = computed<LayoutStrategy>(() => {
    return LayoutStrategyResolver.getStrategy(strategyType.value);
  });

  const layoutMode = computed<LayoutMode>(() => {
    return currentStrategy.value.determineMode(containerWidth.value, containerHeight.value);
  });

  const showSideBySide = computed<boolean>(() => {
    return currentStrategy.value.shouldShowSideBySide(layoutMode.value);
  });

  const showTabNavigation = computed<boolean>(() => {
    return currentStrategy.value.shouldShowTabNavigation(layoutMode.value);
  });

  const isDrawerSettings = computed<boolean>(() => {
    return currentStrategy.value.shouldUseDrawerSettings(layoutMode.value);
  });

  let resizeObserver: ResizeObserver | null = null;

  const updateDimensions = (w: number, h: number) => {
    containerWidth.value = w;
    containerHeight.value = h;
  };

  const setStrategy = (type: string) => {
    strategyType.value = type;
  };

  const setActiveTab = (tab: TabType) => {
    activeTab.value = tab;
    if (tab === 'terminal') {
      unreadTerminalLogs.value = 0;
    }
  };

  const toggleSettings = () => {
    isSettingsOpen.value = !isSettingsOpen.value;
  };

  const closeSettings = () => {
    isSettingsOpen.value = false;
  };

  const incrementTerminalUnread = () => {
    if (activeTab.value !== 'terminal' && !showSideBySide.value) {
      unreadTerminalLogs.value += 1;
    }
  };

  onMounted(() => {
    if (containerRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          updateDimensions(width, height);
        }
      });
      resizeObserver.observe(containerRef.value);
    } else {
      const handleWindowResize = () => {
        updateDimensions(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleWindowResize);
    }

    // Subscribe to embedded window host messages
    windowAdapter.subscribe((msg) => {
      const payload = msg.payload as Record<string, unknown> | undefined;
      if (msg.type === 'SECURECHAT_SET_TAB' && typeof payload?.tab === 'string') {
        setActiveTab(payload.tab as TabType);
      } else if (msg.type === 'SECURECHAT_TOGGLE_SETTINGS') {
        toggleSettings();
      } else if (msg.type === 'SECURECHAT_SET_STRATEGY' && typeof payload?.strategy === 'string') {
        setStrategy(payload.strategy);
      }
    });
  });

  onUnmounted(() => {
    if (resizeObserver && containerRef.value) {
      resizeObserver.unobserve(containerRef.value);
      resizeObserver.disconnect();
    }
  });

  return {
    containerRef,
    containerWidth,
    containerHeight,
    strategyType,
    activeTab,
    isSettingsOpen,
    unreadTerminalLogs,
    isEmbedded,
    layoutMode,
    showSideBySide,
    showTabNavigation,
    shouldUseDrawerSettings: isDrawerSettings,
    isDrawerSettings,
    setStrategy,
    setActiveTab,
    toggleSettings,
    closeSettings,
    incrementTerminalUnread,
    windowAdapter,
  };
}
