import onChange from 'on-change';

const handleForm = (elements, { form }) => {
  const input = elements.querySelector('input');
  if (form.isValid) {
    input.classList.remove('is-invalid');
    return;
  }
  input.classList.add('is-invalid');
};

const handlers = {
  form: handleForm,
};

const installWatchedState = (elements, state) => (onChange(
  state,
  (path) => handlers[path]?.(elements, state),
)
);

export default installWatchedState;
