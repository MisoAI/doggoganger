import { misoData } from '../data/index.js';
import { MODE_QUESTION } from './constants.js';

export class UserHistory {

  constructor(ask) {
    this._ask = ask;
    this._threads = new Map();          // thread_id -> thread
    this._threadByQuestion = new Map(); // question_id -> thread
    this._badge_dismissed_at = undefined;     // updated_at of the latest activity seen at dismissal
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
    thread.unread = false;
    return { ...thread };
  }

  notifications() {
    let unread_count = 0;
    let last_update_at;
    for (const { unread, updated_at } of this._threads.values()) {
      if (!unread) {
        continue;
      }
      unread_count++;
      if (last_update_at === undefined || updated_at > last_update_at) {
        last_update_at = updated_at;
      }
    }
    const has_unread = unread_count > 0 &&
      (this._badge_dismissed_at === undefined || last_update_at > this._badge_dismissed_at);
    return { has_unread, unread_count, last_update_at };
  }

  dismissNotifications() {
    for (const { updated_at } of this._threads.values()) {
      if (this._badge_dismissed_at === undefined || updated_at > this._badge_dismissed_at) {
        this._badge_dismissed_at = updated_at;
      }
    }
  }

  generateThreads({ rows = [3, 6], ...options } = {}, { seed } = {}) {
    const data = misoData({ seed });
    const prng = data._lorem.prng;
    rows = typeof rows === 'number' ? rows : prng.randomInt(...rows);
    for (let i = 0; i < rows; i++) {
      this._generateThread(data, options);
    }
  }

  _generateThread(data, { questionRows = [1, 10], ...options } = {}) {
    const prng = data._lorem.prng;
    questionRows = typeof questionRows === 'number' ? questionRows : prng.randomInt(...questionRows);

    let parent_question_id;
    for (let i = 0; i < questionRows; i++) {
      ({ question_id: parent_question_id } = this._ask._createAnswer(data, MODE_QUESTION, { parent_question_id }, options));
    }

    // Simulate threads with server-side activity the user has not seen yet
    this._threadByQuestion.get(parent_question_id).unread = prng.randomBool();
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
  // are appended to the thread of their parent question.
  _track(data, { question_id, parent_question_id, question, datetime }) {
    const parentThread = parent_question_id && this._threadByQuestion.get(parent_question_id);
    if (parentThread) {
      parentThread.questions_ids.push(question_id);
      parentThread.updated_at = datetime;
      this._threadByQuestion.set(question_id, parentThread);
      return parentThread;
    }

    const thread = {
      thread_id: data._lorem.prng.uuid(),
      title: question,
      updated_at: datetime,
      unread: false,
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
