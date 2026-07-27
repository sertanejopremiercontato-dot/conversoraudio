export class ConversionQueueService {
  private static activeCount = 0;
  private static maxConcurrent = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '2', 10);

  /**
   * Tries to acquire a slot for conversion. Returns true if acquired.
   */
  static acquireSlot(): boolean {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      console.log(`[Queue] Slot adquirido. Concorrência ativa: ${this.activeCount}/${this.maxConcurrent}`);
      return true;
    }
    return false;
  }

  /**
   * Releases an acquired conversion slot.
   */
  static releaseSlot(): void {
    if (this.activeCount > 0) {
      this.activeCount--;
      console.log(`[Queue] Slot liberado. Concorrência ativa: ${this.activeCount}/${this.maxConcurrent}`);
    }
  }

  static getActiveCount(): number {
    return this.activeCount;
  }

  static getMaxConcurrent(): number {
    return this.maxConcurrent;
  }
}
