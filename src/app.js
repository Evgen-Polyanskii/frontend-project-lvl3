import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import installWatchedState from './view.js';
import locales from './locales/ru.js';

const getElements = (obj) => _.mapValues(obj, (selector) => document.querySelector(selector));

const validationScheme = yup.string().required().url();

const validate = (url, state) => {
  const uniqueUrlValidationSchema = validationScheme.notOneOf(state.feeds);
  return uniqueUrlValidationSchema.validate(url);
};

export default () => {
  const initState = {
    form: {
      isValid: true,
      error: null,
    },
    feeds: [],
  };

  const elements = getElements({
    form: '.rss-form',
    input: '.rss-form input',
    feedback: '.feedback',
  });

  i18next.init({
    lng: 'ru',
    debug: true,
    resources: locales,
  }).then((translate) => {
    const state = installWatchedState(elements, initState, translate);
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url');
      validate(url, state)
        .then((value) => {
          state.form = {
            ...state.form,
            isValid: true,
          };
          state.feeds.push(value);
        })
        .catch((err) => {
          if (err.name === 'ValidationError') {
            state.form = {
              ...state.form,
              isValid: false,
              error: `validation_${err.type}`,
            };
          }
        });
    });
  });
};
