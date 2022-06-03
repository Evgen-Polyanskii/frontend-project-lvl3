import * as yup from 'yup';
import installWatchedState from './view.js';

export default () => {
  const initState = {
    form: {
      isValid: true,
      error: null,
    },
    feeds: [],
  };

  const form = document.querySelector('form');

  const state = installWatchedState(form, initState);

  const validationScheme = yup.string().required().url();

  const validate = (url) => {
    const uniqueUrlValidationSchema = validationScheme.notOneOf(state.feeds);
    return uniqueUrlValidationSchema.validate(url);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validate(url)
      .then((value) => {
        state.form = {
          ...state.form,
          isValid: true,
        };
        state.feeds.push(value);
        console.log('state.feeds', state.feeds);
        form.querySelector('input').focus();
        form.reset();
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          state.form = {
            ...state.form,
            isValid: false,
            error: err.errors,
          };
        }
      });
  });
};
