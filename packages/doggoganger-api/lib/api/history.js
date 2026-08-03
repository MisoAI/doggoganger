import { misoData } from '../data/index.js';
import { MODE_QUESTION } from './constants.js';

// Generated updates are marked so clients can tell them from user questions
export const GENERATED_BY = 'answer_update_monitor';

// Spacing used by generateThreads: questions within a thread follow each other
// closely, while a longer gap separates one thread from the next.
const QUESTION_INCREMENT = 30 * 1000; // milliseconds
const THREAD_GAP = 10 * 60 * 1000; // milliseconds

export class UserHistory {

  constructor(ask) {
    this._ask = ask;
    this._threads = new Map();          // thread_id -> thread
    this._threadByQuestion = new Map(); // question_id -> thread
    this._badge_dismissed_at = undefined;     // time of the latest activity seen at dismissal
  }

  threads() {
    return {
      threads: [...this._threads.values()].map(mapToThreadEntry),
    };
  }

  getThread(thread_id) {
    return { ...this._getThread(thread_id) };
  }

  updateThread(thread_id, { title } = {}) {
    const thread = this._getThread(thread_id);
    if (title !== undefined) {
      thread.title = title;
    }
    return { ...thread };
  }

  deleteThread(thread_id) {
    this._removeThread(this._getThread(thread_id));
  }

  deleteThreads({ thread_ids = [] } = {}) {
    for (const thread_id of thread_ids) {
      const thread = this._threads.get(thread_id);
      if (thread) {
        this._removeThread(thread);
      }
    }
  }

  deleteAllThreads() {
    this._threads.clear();
    this._threadByQuestion.clear();
  }

  markThreadAsRead(thread_id) {
    const thread = this._getThread(thread_id);
    thread.has_new = false;
    return { ...thread };
  }

  // Both are idempotent: re-subscribing or re-unsubscribing succeeds unchanged
  subscribeThread(thread_id) {
    this._getThread(thread_id).subscribed = true;
  }

  unsubscribeThread(thread_id) {
    const thread = this._getThread(thread_id);
    thread.subscribed = false;
    // A thread no longer watched has nothing new to report
    thread.has_new = false;
  }

  getUpdates() {
    let unread_count = 0;
    let last_update_at;
    for (const { has_new, updated_at } of this._threads.values()) {
      if (!has_new) {
        continue;
      }
      unread_count++;
      if (last_update_at === undefined || updated_at > last_update_at) {
        last_update_at = updated_at;
      }
    }
    const has_new = unread_count > 0 &&
      (this._badge_dismissed_at === undefined || last_update_at > this._badge_dismissed_at);
    return { has_new, unread_count, last_update_at };
  }

  dismissNotification() {
    for (const { updated_at } of this._threads.values()) {
      if (this._badge_dismissed_at === undefined || updated_at > this._badge_dismissed_at) {
        this._badge_dismissed_at = updated_at;
      }
    }
  }

  // admin ///
  generateThreads({ rows = [3, 6], ...options } = {}, { seed } = {}) {
    const data = misoData({ seed });
    const prng = data._lorem.prng;
    rows = typeof rows === 'number' ? rows : prng.randomInt(...rows);
    for (let i = 0; i < rows; i++) {
      this._generateThread(data, options);
    }
  }

  // Simulates server-side activity on a thread, optionally generating a new
  // answer in it, so clients can exercise the update indicators on demand.
  // Only subscribed threads receive updates; touched reports how many
  // subscriptions matched.
  touchThread(thread_id, { generate = false } = {}, { seed } = {}) {
    const thread = this._getThread(thread_id);
    if (!thread.subscribed) {
      return { touched: 0 };
    }
    if (!generate) {
      thread.updated_at = this._ask._context.nextDatetime();
      thread.has_new = true;
      return { touched: 1 };
    }
    const data = misoData({ seed });
    const parent_question_id = thread.questions_ids[thread.questions_ids.length - 1];
    // A generated update reads as an ordinary thread turn, distinguished by
    // its metadata marker; _track() bumps updated_at as it joins the thread
    const { question_id } = this._ask._createAnswer(data, MODE_QUESTION, {
      cite_link: true,
      parent_question_id,
      question: `Latest developments since ${thread.updated_at} regarding: ${thread.title}`,
      metadata: { miso_generated_by: GENERATED_BY },
    }, { finished: true });
    thread.has_new = true;
    return { generated: true, question_id, touched: 1 };
  }

  _generateThread(data, { questionRows = [1, 10], payload = {}, ...options } = {}) {
    const prng = data._lorem.prng;
    questionRows = typeof questionRows === 'number' ? questionRows : prng.randomInt(...questionRows);

    let parent_question_id;
    for (let i = 0; i < questionRows; i++) {
      // A new thread opens a longer gap after the preceding activity
      const timestamp = this._ask._context.nextTimestamp(i === 0 ? THREAD_GAP : QUESTION_INCREMENT);
      ({ question_id: parent_question_id } = this._ask._createAnswer(data, MODE_QUESTION, { cite_link: true, timestamp, ...payload, parent_question_id }, { finished: true, ...options }));
    }

    // Simulate server-side monitoring: some threads are subscribed, and only
    // those can carry activity the user has not seen yet
    const subscribed = prng.randomBool();
    const has_new = prng.randomBool();
    const thread = this._threadByQuestion.get(parent_question_id);
    if (thread) {
      thread.subscribed = subscribed;
      thread.has_new = subscribed && has_new;
    }
  }

  _getThread(thread_id) {
    const thread = this._threads.get(thread_id);
    if (!thread) {
      const error = new Error(`Thread not found: ${thread_id}`);
      error.status = 404;
      throw error;
    }
    return thread;
  }

  _removeThread(thread) {
    this._threads.delete(thread.thread_id);
    for (const question_id of thread.questions_ids) {
      this._threadByQuestion.delete(question_id);
    }
  }

  // Called by Ask whenever an answer/question is created, to maintain the
  // thread structure. Root questions start a new thread; follow-up questions
  // are appended to the thread of their parent question. A thread is identified
  // by the question_id of its root question.
  _track({ question_id, parent_question_id, question, datetime }) {
    const parentThread = parent_question_id && this._threadByQuestion.get(parent_question_id);
    if (parentThread) {
      parentThread.questions_ids.push(question_id);
      parentThread.updated_at = datetime;
      this._threadByQuestion.set(question_id, parentThread);
      return parentThread;
    }

    const thread = {
      thread_id: question_id,
      title: question,
      updated_at: datetime,
      // Watching a thread for updates is opt-in
      subscribed: false,
      has_new: false,
      questions_ids: [question_id],
    };
    this._threads.set(thread.thread_id, thread);
    this._threadByQuestion.set(question_id, thread);
    return thread;
  }

}

function mapToThreadEntry({ questions_ids, ... rest }) {
  return rest;
}
