// api.js — API fetch wrapper for SongScryer
// Pure ESM module: no DOM imports, no side effects at module level.
// baseUrl is passed as a parameter so this module is testable without Vite.

/**
 * postSubmission(baseUrl, payload): POST payload to /api/submissions.
 * - baseUrl: string ending with '/' (e.g. import.meta.env.BASE_URL from app.js)
 * - payload: object with all required submission fields
 * - Throws Error with human-readable message on non-201 responses
 * - Returns the created submission record (with song_title) on success
 */
export async function postSubmission(baseUrl, payload) {
  const res = await fetch(`${baseUrl}api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message;
    try {
      const data = await res.json();
      message = data.error ?? `HTTP ${res.status}`;
    } catch {
      message = `HTTP ${res.status}`;
    }
    throw new Error(message);
  }

  return res.json();
}
