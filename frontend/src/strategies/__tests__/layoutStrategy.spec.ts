import { describe, it, expect } from 'vitest';
import {
  AutoAdaptLayoutStrategy,
  SplitLayoutStrategy,
  TabbedLayoutStrategy,
  CompactWindowStrategy,
  LayoutStrategyResolver,
} from '../layoutStrategy';

describe('LayoutStrategy (GOF Strategy Pattern)', () => {
  it('AutoAdaptLayoutStrategy chooses correct mode based on dimensions', () => {
    const auto = new AutoAdaptLayoutStrategy();
    expect(auto.determineMode(1024, 768)).toBe('split');
    expect(auto.determineMode(600, 800)).toBe('tabbed');
    expect(auto.determineMode(350, 500)).toBe('compact');
    expect(auto.determineMode(800, 300)).toBe('compact');
  });

  it('SplitLayoutStrategy always returns split mode', () => {
    const split = new SplitLayoutStrategy();
    expect(split.determineMode()).toBe('split');
    expect(split.shouldShowSideBySide()).toBe(true);
    expect(split.shouldShowTabNavigation()).toBe(false);
  });

  it('TabbedLayoutStrategy always returns tabbed mode', () => {
    const tabbed = new TabbedLayoutStrategy();
    expect(tabbed.determineMode()).toBe('tabbed');
    expect(tabbed.shouldShowSideBySide()).toBe(false);
    expect(tabbed.shouldShowTabNavigation()).toBe(true);
  });

  it('CompactWindowStrategy always returns compact mode', () => {
    const compact = new CompactWindowStrategy();
    expect(compact.determineMode()).toBe('compact');
    expect(compact.shouldShowSideBySide()).toBe(false);
    expect(compact.shouldShowTabNavigation()).toBe(true);
  });

  it('LayoutStrategyResolver returns appropriate strategy instance', () => {
    expect(LayoutStrategyResolver.getStrategy('split').name).toBe('Dual Pane (Split)');
    expect(LayoutStrategyResolver.getStrategy('tabbed').name).toBe('Single Pane (Tabbed)');
    expect(LayoutStrategyResolver.getStrategy('compact').name).toBe('Mini Window (Compact)');
    expect(LayoutStrategyResolver.getStrategy('auto').name).toBe('Auto Adapt');
  });
});
