import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import parseRSS from './parseRSS';
import { getConfig } from './confige';
import { installWatchedState, applyTranslations } from './view.js';
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

const fetchUpdates = (state) => {
  const promises = state.feeds.map((feed) => axios
    .get(decorateUrlWithProxy(feed.url), { timeout: getConfig('RSS_LOAD_TIMEOUT') })
    .then(({ data }) => {
      const { items } = parseRSS(data.contents);
      const newPosts = items.map((item) => ({ ...item, channelId: feed.id }));
      const oldPosts = state.posts.filter((post) => post.channelId === feed.id);
      return _.differenceWith(newPosts, oldPosts, (p1, p2) => p1.link === p2.link)
        .map((post) => ({ ...post, id: _.uniqueId() }));
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e);
    }));

  Promise.all(promises)
    .then((data) => {
      const posts = data.flat();
      if (posts.length > 0) {
        state.posts.unshift(...posts);
      }
    })
    .finally(() => {
      setTimeout(() => fetchUpdates(state), getConfig('RSS_UPDATE_TIMEOUT'));
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
    h1: 'h1',
    lead: '.lead',
    example: '.text-white-50',
    label: '.rss-form label[for="url-input"]',
  });

  i18next.init({
    lng: 'ru',
    debug: true,
    resources: locales,
  }).then((translate) => {
    applyTranslations(elements, translate);
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

    setTimeout(() => fetchUpdates(state), getConfig('RSS_UPDATE_TIMEOUT'));
  });
};
