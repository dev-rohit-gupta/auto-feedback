import type { FeedbackMode, RatingOption, RatingStrategy } from "./types";

/** Always ranks by validated scores, never by DOM <option> order. */
export class ScoredRatingStrategy implements RatingStrategy {
  constructor(private readonly random: () => number = Math.random) {}

  choose(mode: FeedbackMode, options: readonly RatingOption[]): RatingOption {
    if (options.length === 0) {
      throw new Error("No rating options available for this question.");
    }

    const values = new Set<string>();
    for (const option of options) {
      if (!option.value || !option.label || !Number.isFinite(option.score) ||
          values.has(option.value)) {
        throw new Error("Rating options are missing or invalid.");
      }
      values.add(option.value);
    }

    const sorted = [...options].sort((a, b) => b.score - a.score);
    switch (mode) {
      case "excellent":
        return sorted[0];
      case "poor":
        return sorted[sorted.length - 1];
      case "average":
        return sorted[Math.floor((sorted.length - 1) / 2)];
      case "random": {
        const value = this.random();
        if (!Number.isFinite(value) || value < 0 || value >= 1) {
          throw new Error("Invalid random generator result.");
        }
        return sorted[Math.floor(value * sorted.length)];
      }
      default:
        throw new Error("Unsupported feedback mode.");
    }
  }
}
