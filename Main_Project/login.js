const loginForm = document.querySelector('#login-form');
const editorForm = document.querySelector('#editor-form');
const loginMessage = document.querySelector('#login-message');
const saveMessage = document.querySelector('#save-message');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const titleInput = document.querySelector('#blog-title');
const bodyInput = document.querySelector('#blog-body');

const defaultBlog = {
  title: 'What is Edge Computing?',
  body: 'Edge computing refers to the practice of processing data closer to the source of generation, such as IoT devices, sensors, or local servers, rather than relying solely on centralized cloud data centers.\n\nThis drastically reduces latency, conserves bandwidth, and enhances responsiveness.\n\nWhy It Matters\nWith the explosion of devices and the growing demand for instantaneous processing, the need for a faster, more efficient computing model is clear.\n\nEdge computing addresses several challenges:\nLower Latency: Data does not need to travel to a distant server and back.\nIncreased Security: Sensitive data can be processed locally, reducing exposure.'
};

function getSavedBlog() {
  try {
    return JSON.parse(localStorage.getItem('portfolioBlog')) || defaultBlog;
  } catch (error) {
    return defaultBlog;
  }
}

function showEditor() {
  const blog = getSavedBlog();
  titleInput.value = blog.title;
  bodyInput.value = blog.body;
  loginForm.hidden = true;
  editorForm.hidden = false;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (usernameInput.value.trim() === 'admin' && passwordInput.value === 'Sudan@123') {
    sessionStorage.setItem('portfolioEditorSignedIn', 'true');
    loginMessage.textContent = '';
    showEditor();
  } else {
    loginMessage.textContent = 'Login details did not match.';
  }
});

editorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const updatedAt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  localStorage.setItem('portfolioBlog', JSON.stringify({ title: titleInput.value.trim(), body: bodyInput.value.trim(), updatedAt }));
  saveMessage.textContent = `Saved ${updatedAt}. Open the portfolio to view the update.`;
});

document.querySelector('#logout').addEventListener('click', () => {
  sessionStorage.removeItem('portfolioEditorSignedIn');
  editorForm.hidden = true;
  loginForm.hidden = false;
  loginForm.reset();
  saveMessage.textContent = '';
});

if (sessionStorage.getItem('portfolioEditorSignedIn') === 'true') showEditor();
