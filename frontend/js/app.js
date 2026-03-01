const BASE_URL = import.meta.env.BASE_URL;
console.log('BASE_URL:', BASE_URL);

const statusEl = document.getElementById('status');

fetch(`${BASE_URL}api/submissions`)
  .then(res => res.json())
  .then(submissions => {
    statusEl.textContent = `${submissions.length} submission(s) so far. API connected.`;
  })
  .catch(err => {
    statusEl.textContent = `API error: ${err.message}`;
    console.error(err);
  });
