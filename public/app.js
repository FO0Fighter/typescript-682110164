const listEl = document.getElementById('list');
const formEl = document.getElementById('add-form');
const inputEl = document.getElementById('add-input');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');

let items = [];

function showError(message) {
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
}

function render() {
    listEl.replaceChildren();
    for (const item of items) {
        const li = document.createElement('li');
        li.textContent = '- ' + item.text;
        listEl.append(li);
    }
    emptyEl.hidden = items.length > 0;
}

async function api(path, options = {}) {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
    return body;
}

async function load() {
    try {
        items = await api('/api/items');
        showError('');
    } catch (err) {
        showError(err.message);
    }
    render();
}

formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    try {
        await api('/api/items', { method: 'POST', body: JSON.stringify({ text }) });
        inputEl.value = '';
        inputEl.focus();
        await load();
    } catch (err) {
        showError(err.message);
    }
});

load();
