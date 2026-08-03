import { BASE_TIMESTAMP, formatDatetime } from '../utils.js';

// Each event is dated a beat after the previous one, so activity generated in
// the same session is ordered rather than sharing a single timestamp.
const DEFAULT_INCREMENT = 5 * 1000; // milliseconds

// State shared by all API groups: the construction options and a universal
// clock handing out strictly increasing timestamps, so events are ordered
// consistently across the whole mock API rather than per group.
export class ApiContext {

  constructor(options = {}) {
    this.options = options;
    this._timestamp = undefined;
  }

  // Advances the clock by `increment` milliseconds from the previous event and
  // returns the new time; the first event lands exactly on the base timestamp
  nextTimestamp(increment = DEFAULT_INCREMENT) {
    return this._timestamp = this._timestamp === undefined ?
      BASE_TIMESTAMP : this._timestamp + increment;
  }

  nextDatetime(increment) {
    return formatDatetime(this.nextTimestamp(increment));
  }

}
