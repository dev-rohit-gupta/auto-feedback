import { FeedbackCoordinator } from "../automation/FeedbackCoordinator";
import { ScoredRatingStrategy } from "../automation/RatingStrategy";
import { MockFeedbackFormAdapter } from "./MockFeedbackFormAdapter";

/** Composition root: the demo UI does not construct adapter/strategy details. */
export function createOfflineFeedbackCoordinator(): FeedbackCoordinator {
  return new FeedbackCoordinator(
    new MockFeedbackFormAdapter(),
    new ScoredRatingStrategy(),
  );
}
