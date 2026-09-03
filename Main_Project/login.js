const loginForm = document.querySelector('#login-form');
const editorForm = document.querySelector('#editor-form');
const loginMessage = document.querySelector('#login-message');
const saveMessage = document.querySelector('#save-message');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const titleInput = document.querySelector('#blog-title');
const bodyInput = document.querySelector('#blog-body');
const aboutMeInput = document.querySelector('#about-me-body');
const sessionTimeout = 5 * 60 * 1000;
let inactivityTimer;

const defaultBlog = {
  title: 'What is Edge Computing?',
  body: 'Edge computing refers to the practice of processing data closer to the source of generation, such as IoT devices, sensors, or local servers, rather than relying solely on centralized cloud data centers.\n\nThis drastically reduces latency, conserves bandwidth, and enhances responsiveness.\n\nWhy It Matters\nWith the explosion of devices and the growing demand for instantaneous processing, the need for a faster, more efficient computing model is clear.\n\nEdge computing addresses several challenges:\nLower Latency: Data does not need to travel to a distant server and back.\nIncreased Security: Sensitive data can be processed locally, reducing exposure.'
};

const defaultAboutMe = `Hi there!

I'm a passionate web developer with over 2 years of experience crafting modern, responsive websites and web applications.

I specialize in both front-end and back-end development, with a strong command of technologies like HTML, CSS, JavaScript, React, Node.js, and PHP.

I believe great web development is all about creating seamless, intuitive user experiences while writing clean, maintainable code.

Let's build something great together!`;

function getSavedBlog() {
  try {
    return JSON.parse(localStorage.getItem('portfolioBlog')) || defaultBlog;
  } catch (error) {
    return defaultBlog;
  }
}

function getSavedAboutMe() {
  try {
    const savedAboutMe = JSON.parse(localStorage.getItem('portfolioAboutMe'));
    return savedAboutMe?.body || defaultAboutMe;
  } catch (error) {
    return defaultAboutMe;
  }
}

function clearEditorSession() {
  sessionStorage.removeItem('portfolioEditorLastActivity');
  clearTimeout(inactivityTimer);
}

function resetInactivityTimer() {
  sessionStorage.setItem('portfolioEditorLastActivity', String(Date.now()));
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    clearEditorSession();
    editorForm.hidden = true;
    loginForm.hidden = false;
    loginMessage.textContent = 'Your session expired after 5 minutes of inactivity.';
    loginForm.reset();
  }, sessionTimeout);
}

function startEditorSession() {
  sessionStorage.setItem(sessionKey, 'true');
  resetInactivityTimer();
}

function showEditor() {
  const blog = getSavedBlog();
  titleInput.value = blog.title;
  bodyInput.value = blog.body;
  aboutMeInput.value = getSavedAboutMe();
  loginForm.hidden = true;
  editorForm.hidden = false;
  resetInactivityTimer();
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameInput.value.trim(), password: passwordInput.value })
  })
    .then(async (response) => {
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Login details did not match.');
      }
      passwordInput.value = '';
      startEditorSession();
      loginMessage.textContent = '';
      showEditor();
    })
    .catch((error) => {
      loginMessage.textContent = error.message === 'Failed to fetch'
        ? 'Unable to contact the login service.'
        : error.message;
    });
});

editorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const updatedAt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  localStorage.setItem('portfolioBlog', JSON.stringify({ title: titleInput.value.trim(), body: bodyInput.value.trim(), updatedAt }));
  localStorage.setItem('portfolioAboutMe', JSON.stringify({ body: aboutMeInput.value.trim(), updatedAt }));
  resetInactivityTimer();
  saveMessage.textContent = `Saved ${updatedAt}. Open the portfolio to view the updates.`;
});

document.querySelector('#logout').addEventListener('click', () => {
  fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' })
  }).catch(() => {});
  clearEditorSession();
  editorForm.hidden = true;
  loginForm.hidden = false;
  loginForm.reset();
  saveMessage.textContent = '';
});

['click', 'keydown', 'mousemove', 'touchstart'].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    if (!editorForm.hidden) resetInactivityTimer();
  }, { passive: true });
});

fetch('/api/auth')
  .then((response) => response.json())
  .then((result) => {
    if (result.authenticated) showEditor();
  })
  .catch(() => clearEditorSession());
