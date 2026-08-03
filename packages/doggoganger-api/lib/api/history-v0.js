import { misoData } from '../data/index.js';
import { formatDatetime } from '../utils.js';
import { MODE_QUESTION } from './constants.js';

// The user history API as it exists in production today: a flat, POST-only
// surface where a thread is addressed by the question_id of its root question.
// It reads and writes the same thread store as UserHistory, which models the
// newer (not yet released) resource-style API.
// @see https://miso-docs.apidocumentation.com/api/genai/user-history
export class UserHistoryV0 {

  constructor(ask) {
    this._ask = ask;
  }

  get _history() {
    return this._ask.userHistory;
  }

  // POST /ask/user_history/list
  threads({ rows = 100, start = 0, before } = {}) {
    let threads = [...this._history._threads.values()].sort(byUpdatedAtDesc);
    if (before !== undefined) {
      threads = threads.filter(({ updated_at }) => updated_at < before);
    }
    return {
      threads: threads.slice(start, start + rows).map(mapToThreadEntry),
      has_more: threads.length > start + rows,
      start,
      rows,
    };
  }

  // POST /ask/user_history/thread
  openThread({ thread_id, rows = 30, after, order = 'asc' } = {}) {
    const thread = this._getThreadByQuestion(thread_id);
    let question_ids = [...thread.questions_ids];
    if (order === 'desc') {
      question_ids.reverse();
    }
    if (after !== undefined) {
      const index = question_ids.indexOf(after);
      if (index > -1) {
        question_ids = question_ids.slice(index + 1);
      }
    }
    return {
      question_ids: question_ids.slice(0, rows),
      has_more: question_ids.length > rows,
    };
  }

  // POST /ask/user_history/thread/rename
  renameThread({ thread_id, title } = {}) {
    const thread = this._getThreadByQuestion(thread_id);
    thread.title = title;
    return { question_id: thread.thread_id, title };
  }

  // POST /ask/user_history/delete
  deleteThreads({ question_ids = [] } = {}) {
    const { _threads } = this._history;
    let deleted_count = 0;
    for (const id of question_ids) {
      if (_threads.has(id)) {
        deleted_count++;
      }
    }
    this._history.deleteThreads({ thread_ids: question_ids });
    return { deleted_count };
  }

  // POST /ask/user_history/delete_all
  deleteAllThreads() {
    this._history.deleteAllThreads();
  }

  // POST /ask/user_history/thread/updates/subscribe
  subscribe({ thread_id } = {}) {
    this._history._getThread(thread_id).subscribed = true;
  }

  // POST /ask/user_history/thread/updates/unsubscribe
  unsubscribe({ thread_id } = {}) {
    this._history._getThread(thread_id).subscribed = false;
  }

  // POST /ask/user_history/thread/updates
  updates() {
    return { has_new: this._history.notifications().has_unread };
  }

  // POST /ask/user_history/thread/updates/dismiss_thread
  dismissThread({ thread_id } = {}) {
    this._history.markThreadAsRead(thread_id);
  }

  // POST /ask/user_history/thread/updates/dismiss_overall
  dismissOverall() {
    this._history.dismissNotifications();
  }

  // POST /ask/user_history/thread/updates/touch
  // Simulates server-side activity on a thread, optionally generating a new
  // answer in it, so clients can exercise the update indicators on demand.
  touchThread({ thread_id, generate = false } = {}, { seed } = {}) {
    const thread = this._history._getThread(thread_id);
    let question_id;
    if (generate) {
      const data = misoData({ seed });
      const parent_question_id = thread.questions_ids[thread.questions_ids.length - 1];
      // _track() bumps updated_at as the generated question joins the thread
      ({ question_id } = this._ask._createAnswer(data, MODE_QUESTION, { cite_link: true, parent_question_id }, { finished: true }));
    } else {
      thread.updated_at = formatDatetime(this._ask._nextTimestamp());
    }
    thread.has_new = true;
    return { generated: !!generate, question_id, touched: 1 };
  }

  _getThreadByQuestion(question_id) {
    const thread = this._history._threadByQuestion.get(question_id);
    if (!thread) {
      const error = new Error(`Thread not found: ${question_id}`);
      error.status = 404;
      throw error;
    }
    return thread;
  }

}

function byUpdatedAtDesc(a, b) {
  return a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0;
}

// A thread is keyed by its root question, so id and question_id coincide
function mapToThreadEntry({ thread_id, title, updated_at, subscribed, has_new }) {
  return {
    id: thread_id,
    time: updated_at,
    question_id: thread_id,
    title,
    subscribed,
    has_new,
  };
}
