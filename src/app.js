import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import parseRSS from './parseRSS';
import { getConfig } from './confige';
import installWatchedState from './view.js';
import locales from './locales/ru.js';

const getElements = (obj) => _.mapValues(obj, (selector) => document.querySelector(selector));

const validationScheme = yup.string().required().url();

const validateUrl = (url, feeds) => {
  const feedUrls = feeds.map((feed) => feed.url);
  const uniqueUrlValidationSchema = validationScheme.notOneOf(feedUrls);
  return uniqueUrlValidationSchema.validate(url);
};

const getErrorCode = (e) => {
  if (e.isAxiosError) {
    e.code = 'network_error';
  }
  return e.code ?? 'unknown';
};

const decorateUrlWithProxy = (url) => {
  const decorated = new URL('/get', getConfig('RSS_PROXY_URL'));
  decorated.searchParams.set('disableCache', 'true');
  decorated.searchParams.set('url', url);
  return decorated.toString();
};

const loadRss = (state, url) => {
  state.loadingProcess.status = 'loading';
  return axios.get(decorateUrlWithProxy(url), { timeout: getConfig('RSS_LOAD_TIMEOUT') })
    .then(({ data }) => {
      const { title, description, items } = parseRSS(data.contents);
      const feed = {
        url, id: _.uniqueId(), title, description,
      };
      const posts = items.map((item) => ({ ...item, channelId: feed.id, id: _.uniqueId() }));
      state.posts.unshift(...posts);
      state.feeds.unshift(feed);
      state.loadingProcess.error = null;
      state.loadingProcess.status = 'idle';
      state.form = {
        ...state.form,
        error: null,
      };
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      state.loadingProcess.error = getErrorCode(e);
      state.loadingProcess.status = 'failed';
    });
};

export default () => {
  const initState = {
    form: {
      isValid: true,
      error: null,
    },
    loadingProcess: {
      error: null,
      status: 'idle', // failed idle loading
    },
    feeds: [],
    posts: [],
  };

  const elements = getElements({
    form: '.rss-form',
    input: '.rss-form input',
    feedback: '.feedback',
    submit: '.rss-form button[type="submit"]',
    feeds: '.feeds',
    posts: '.posts',
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
      validateUrl(url, state.feeds)
        .then(() => {
          state.form = {
            ...state.form,
            isValid: true,
          };
          loadRss(state, url);
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
