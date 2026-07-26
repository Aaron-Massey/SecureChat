
/**
 * Command Pattern: IChatCommand
 * Chat transmission commands.
 */
export interface IChatCommand {
  id: string;
  type: 'text' | 'file';
  execute(): Promise<void> | void;
}

export class SendTextMessageCommand implements IChatCommand {
  public id: string;
  public type = 'text' as const;

  constructor(
    private sendFn: (text: string, sender: string) => void,
    private text: string,
    private senderDisplayName: string
  ) {
    this.id = `cmd-text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public execute(): void {
    this.sendFn(this.text, this.senderDisplayName);
  }
}

export class SendFileMessageCommand implements IChatCommand {
  public id: string;
  public type = 'file' as const;

  constructor(
    private sendFileFn: (file: File, sender: string) => Promise<void>,
    private file: File,
    private senderDisplayName: string
  ) {
    this.id = `cmd-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public async execute(): Promise<void> {
    await this.sendFileFn(this.file, this.senderDisplayName);
  }
}

/**
 * Command Queue Manager
 * Buffers commands during network/P2P reconnecting or disconnected states
 * and flushes them automatically when P2P connection re-establishes.
 */
export class CommandQueueManager {
  private queue: IChatCommand[] = [];
  private maxQueueSize: number;

  constructor(maxQueueSize: number = 50) {
    this.maxQueueSize = maxQueueSize;
  }

  public enqueue(command: IChatCommand): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`Command queue limit reached (${this.queue.length}/${this.maxQueueSize}). Command dropped.`);
      return false;
    }
    this.queue.push(command);
    console.log(`Enqueued command ${command.id} (queue size: ${this.queue.length}/${this.maxQueueSize})`);
    return true;
  }

  public async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    console.log(`Flushing ${this.queue.length} queued commands...`);

    const commandsToExecute = [...this.queue];
    this.queue = [];

    for (const cmd of commandsToExecute) {
      try {
        await cmd.execute();
      } catch (err) {
        console.error(`Failed to execute command ${cmd.id}:`, err);
      }
    }
  }

  public clear(): void {
    this.queue = [];
  }

  public get pendingCount(): number {
    return this.queue.length;
  }

  public get capacity(): number {
    return this.maxQueueSize;
  }
}
