import _ from 'lodash';

export const config = {
  RSS_LOAD_TIMEOUT: 10000,
  RSS_PROXY_URL: 'https://allorigins.hexlet.app',
};

export const getConfig = (configName) => _.get(config, configName, null);
