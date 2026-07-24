import type { DerivedCryptoKeys } from '@/utils/crypto-keys';
import { KeyRatchetFactory, type IKeyRatchetStrategy } from '@/crypto/keyRatchet.strategy';

/**
 * State Pattern: KeyRatchetContext
 * Encapsulates state management for key generations, version tracking,
 * forward key ratcheting, and version synchronization.
 */
export class KeyRatchetContext {
  private currentVersion: number = 1;
  private currentKeys: DerivedCryptoKeys;
  private strategy: IKeyRatchetStrategy;
  private keyHistory: Map<number, DerivedCryptoKeys> = new Map();
  private maxHistorySize: number = 100;

  constructor(
    initialKeys: DerivedCryptoKeys,
    initialVersion: number = 1,
    strategyMode: 'hash' | 'static' = 'hash'
  ) {
    this.currentKeys = initialKeys;
    this.currentVersion = initialVersion;
    this.strategy = KeyRatchetFactory.getStrategy(strategyMode);
    this.keyHistory.set(initialVersion, initialKeys);
  }

  public get version(): number {
    return this.currentVersion;
  }

  public get keys(): DerivedCryptoKeys {
    return this.currentKeys;
  }

  /**
   * Advances the ratchet by 1 step.
   */
  public ratchetStep(): DerivedCryptoKeys {
    this.currentKeys = this.strategy.ratchet(this.currentKeys);
    this.currentVersion++;
    this.keyHistory.set(this.currentVersion, this.currentKeys);

    if (this.keyHistory.size > this.maxHistorySize) {
      const oldestKeyVersion = Math.min(...Array.from(this.keyHistory.keys()));
      this.keyHistory.delete(oldestKeyVersion);
    }

    return this.currentKeys;
  }

  /**
   * Synchronizes the ratchet state to reach a target version number.
   * Ratchets forward as needed.
   */
  public syncToVersion(targetVersion: number): DerivedCryptoKeys {
    while (this.currentVersion < targetVersion) {
      this.ratchetStep();
    }
    return this.currentKeys;
  }

  /**
   * Retrieves derived keys for a specific version.
   * Checks current version, historical cached versions, or ratchets forward if needed.
   */
  public getKeysForVersion(targetVersion: number): DerivedCryptoKeys | null {
    if (targetVersion === this.currentVersion) {
      return this.currentKeys;
    }

    if (this.keyHistory.has(targetVersion)) {
      return this.keyHistory.get(targetVersion)!;
    }

    if (targetVersion > this.currentVersion) {
      return this.syncToVersion(targetVersion);
    }

    return null; // Key version expired / beyond history window
  }
}
