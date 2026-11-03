// api.js
// Every call to the back end is in this file.

const API_URL = 'http://127.0.0.1:8000';

// One random id per browser tab, so each person only sees their own history.
function getSessionId() {
  let id = sessionStorage.getItem('phishfight-session');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('phishfight-session', id);
  }
  return id;
}

// Sends a request and turns any problem into an Error with a message the user can read.
async function request(path, options) {
  let response;
  try {
    response = await fetch(API_URL + path, options);
  } catch {
    // fetch only fails like this when the server cannot be reached at all
    throw new Error('Cannot reach the PhishFight server. Please check it is running and try again.');
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      // our back end always sends errors as {"error": ..., "detail": ...}
      const body = await response.json();
      if (body.detail) message = body.detail;
    } catch {
      // the body was not JSON, so keep the default message
    }
    throw new Error(message);
  }

  return response.json();
}

export function checkUrl(url) {
  return request('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, session_id: getSessionId() }),
  });
}

export function getHistory() {
  return request(`/api/history?session_id=${encodeURIComponent(getSessionId())}`);
}

export function clearHistory() {
  return request(`/api/history?session_id=${encodeURIComponent(getSessionId())}`, {
    method: 'DELETE',
  });
}