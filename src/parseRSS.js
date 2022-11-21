const getText = (el, selector) => el.querySelector(selector)?.textContent;

export default (content) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(content, 'text/xml');

  const errors = dom.querySelectorAll('parsererror');
  if (errors.length > 0) {
    const error = new Error(getText(dom, 'parsererror'));
    error.code = 'rss_parse_error';
    throw error;
  }

  const items = dom.querySelectorAll('item');
  return {
    title: getText(dom, 'title'),
    description: getText(dom, 'description'),
    items: [...items].map((el) => ({
      title: getText(el, 'title'),
      link: getText(el, 'link'),
      description: getText(el, 'description'),
    })),
  };
};
