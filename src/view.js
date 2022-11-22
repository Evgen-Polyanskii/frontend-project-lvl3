import onChange from 'on-change';

const feedbackType = {
  success: 'success',
  danger: 'danger',
};

const renderFeedback = (elements, type, message) => {
  const { feedback } = elements;
  feedback.classList.forEach((className) => {
    if (className.match(/^text-/)) {
      feedback.classList.remove(className);
    }
  });
  if (type) {
    feedback.classList.add(`text-${type}`);
  }
  feedback.textContent = message;
};

const handleForm = (elements, state, translate) => {
  const { form: { isValid, error } } = state;
  const { input } = elements;
  if (isValid) {
    input.classList.remove('is-invalid');
    return;
  }
  const errorMessage = translate([`errors.${error}`]);
  input.classList.add('is-invalid');
  renderFeedback(elements, feedbackType.danger, errorMessage);
};

const handleLoadingProcess = (elements, state, translate) => {
  const { loadingProcess } = state;
  const { submit, input } = elements;
  switch (loadingProcess.status) {
    case 'loading':
      submit.disabled = true;
      input.setAttribute('readonly', true);
      renderFeedback(elements, '', '');
      break;
    case 'failed':
      submit.disabled = false;
      input.removeAttribute('readonly');
      renderFeedback(elements, feedbackType.danger, translate([`errors.${loadingProcess.error}`]));
      break;
    case 'idle':
      submit.disabled = false;
      input.value = '';
      input.removeAttribute('readonly');
      input.focus();
      renderFeedback(elements, feedbackType.success, translate(['loading.success']));
      break;
    default:
      throw new Error(`Unknown loadingProcess status: '${loadingProcess.status}'`);
  }
};

const handleFeeds = (elements, state, translate) => {
  const { feeds: feedsEl } = elements;
  const { feeds } = state;
  feedsEl.innerHTML = `
    <div class="card border-0">
        <div class="card-body">
            <h2 class="card-title h4">${translate('elements.feeds')}</h2>
        </div>
        <ul class="list-group rounded-0">
            ${feeds.map(({ title, description }) => (`
              <li class="list-group-item">
                <h3 class="h6 m-0">${title}</h3>
                <p class="m-0 small text-black-50">${description}</p>
              </li>
            `)).join('\n')}
        </ul>
    </div>
  `;
};

const handlePosts = (elements, state, translate) => {
  const { posts: postsEl } = elements;
  const { posts, ui } = state;
  postsEl.innerHTML = `
    <div class="card border-0">
        <div class="card-body">
            <h2 class="card-title h4">${translate('elements.posts')}</h2>
        </div>
        <ul class="list-group border-0 rounded-0">
          ${posts.map((post) => (`
            <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
              <a
                class=${(ui.seenPosts.has(post.id)) ? '"fw-normal link-secondary"' : 'fw-bold'}
                href="${post.link}"
                data-id="${post.id}"
                rel="noopener noreferrer"
                target="_blank">
                ${post.title}
              </a>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                data-id="${post.id}"
                data-bs-toggle="modal"
                data-bs-target="#modal"
              >${translate('elements.preview')}</button>
            </li>
          `)).join('\n')}
        </ul>
    </div>
  `;
};

const handlePreviewPost = (elements, state) => {
  const post = state.posts.find(({ id }) => id === state.modal.postId);

  if (!post) return;

  const title = elements.modal.querySelector('#modalLabel');
  const body = elements.modal.querySelector('.modal-body');
  const articleLink = elements.modal.querySelector('.full-article');

  title.textContent = post.title;
  body.textContent = post.description;
  articleLink.href = post.link;
};

const handlers = {
  form: handleForm,
  feeds: handleFeeds,
  posts: handlePosts,
  'loadingProcess.status': handleLoadingProcess,
  'ui.seenPosts': handlePosts,
  'modal.postId': handlePreviewPost,
};

export const installWatchedState = (elements, state, translate) => (onChange(
  state,
  (path) => handlers[path]?.(elements, state, translate),
));

export const applyTranslations = (elements, translate) => {
  elements.h1.innerText = translate('elements.h1');
  elements.lead.innerText = translate('elements.lead');
  elements.example.innerText = translate('elements.example');
  elements.submit.innerText = translate('elements.submit');
  elements.label.innerText = translate('elements.label');
  elements.modalClose.innerText = translate('elements.close');
  elements.modalReadAll.innerText = translate('elements.reedMore');
};
