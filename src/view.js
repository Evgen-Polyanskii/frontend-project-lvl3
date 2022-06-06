import onChange from 'on-change';

const renderFeedback = (elements, errorMessage) => {
  const { feedback } = elements;
  feedback.textContent = errorMessage;
};

const handleForm = (elements, state, translate) => {
  const { form: { isValid, error } } = state;
  const { input, feedback } = elements;
  if (isValid) {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
    elements.form.reset();
    input.focus();
    return;
  }
  const errorMessage = translate([`errors.${error}`]);
  input.classList.add('is-invalid');
  renderFeedback(elements, errorMessage);
};

const handlers = {
  form: handleForm,
};

const installWatchedState = (elements, state, translate) => (onChange(
  state,
  (path) => handlers[path]?.(elements, state, translate),
));

export default installWatchedState;
