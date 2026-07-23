/**
 * GOF Strategy Pattern: Layout Strategy
 * Encapsulates responsive container layout strategies for Desktop, Mobile, and Mini-Window (Embedded Portfolio) views.
 */

export type LayoutMode = 'split' | 'tabbed' | 'compact';

export interface LayoutStrategy {
  readonly name: string;
  determineMode(width: number, height: number): LayoutMode;
  shouldShowSideBySide(mode: LayoutMode): boolean;
  shouldShowTabNavigation(mode: LayoutMode): boolean;
  shouldUseDrawerSettings(mode: LayoutMode): boolean;
}

export class AutoAdaptLayoutStrategy implements LayoutStrategy {
  readonly name = 'Auto Adapt';

  determineMode(width: number, height: number): LayoutMode {
    if (width < 450 || height < 450) {
      return 'compact';
    }
    if (width < 768) {
      return 'tabbed';
    }
    return 'split';
  }

  shouldShowSideBySide(mode: LayoutMode): boolean {
    return mode === 'split';
  }

  shouldShowTabNavigation(mode: LayoutMode): boolean {
    return mode === 'tabbed' || mode === 'compact';
  }

  shouldUseDrawerSettings(mode: LayoutMode): boolean {
    return mode === 'compact' || mode === 'tabbed';
  }
}

export class SplitLayoutStrategy implements LayoutStrategy {
  readonly name = 'Dual Pane (Split)';

  determineMode(): LayoutMode {
    return 'split';
  }

  shouldShowSideBySide(): boolean {
    return true;
  }

  shouldShowTabNavigation(): boolean {
    return false;
  }

  shouldUseDrawerSettings(): boolean {
    return false;
  }
}

export class TabbedLayoutStrategy implements LayoutStrategy {
  readonly name = 'Single Pane (Tabbed)';

  determineMode(): LayoutMode {
    return 'tabbed';
  }

  shouldShowSideBySide(): boolean {
    return false;
  }

  shouldShowTabNavigation(): boolean {
    return true;
  }

  shouldUseDrawerSettings(): boolean {
    return true;
  }
}

export class CompactWindowStrategy implements LayoutStrategy {
  readonly name = 'Mini Window (Compact)';

  determineMode(): LayoutMode {
    return 'compact';
  }

  shouldShowSideBySide(): boolean {
    return false;
  }

  shouldShowTabNavigation(): boolean {
    return true;
  }

  shouldUseDrawerSettings(): boolean {
    return true;
  }
}

export class LayoutStrategyResolver {
  private static strategies: Record<string, LayoutStrategy> = {
    auto: new AutoAdaptLayoutStrategy(),
    split: new SplitLayoutStrategy(),
    tabbed: new TabbedLayoutStrategy(),
    compact: new CompactWindowStrategy(),
  };

  static getStrategy(type: string): LayoutStrategy {
    return this.strategies[type] ?? this.strategies['auto']!;
  }
}
