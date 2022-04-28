import { wrapArticleInHtml } from "./article";
import { JSDOM } from 'jsdom';

const validArticleHtml = `
  <article>
    <h1 itemprop="headline" content="Article">Article</h1>
    <ol data-itemprop="authors">
      <li itemscope="" itemtype="http://schema.org/Person" itemprop="author">
        <meta itemprop="name" content="Dr Reece Urcher">
        <span data-itemprop="givenNames">
          <span itemprop="givenName">Reece</span>
        </span>
        <span data-itemprop="familyNames">
          <span itemprop="familyName">Urcher</span>
        </span>
        <span data-itemprop="affiliations">
          <a itemprop="affiliation" href="#author-organization-1">1</a>
        </span>
      </li>
    </ol>
    <ol data-itemprop="affiliations">
      <li itemscope="" itemtype="http://schema.org/Organization" itemid="#author-organization-1" id="author-organization-1">
        <span itemprop="name">Department of Neuroscience, The University of Texas at Austin</span>
      </li>
    </ol>
    <span itemscope="" itemtype="http://schema.org/Organization" itemprop="publisher">
      <meta itemprop="name" content="Unknown">
      <span itemscope="" itemtype="http://schema.org/ImageObject" itemprop="logo">
        <meta itemprop="url" content="https://via.placeholder.com/600x60/dbdbdb/4a4a4a.png?text=Unknown">
      </span>
    </span>
    <time itemprop="datePublished" datetime="2021-07-06">2021-07-06</time>
    <ul data-itemprop="about">
      <li itemscope="" itemtype="http://schema.org/DefinedTerm" itemprop="about">
        <span itemprop="name">New Results</span>
      </li>
    </ul>
    <ul data-itemprop="identifiers">
      <li itemscope="" itemtype="http://schema.org/PropertyValue" itemprop="identifier">
        <meta itemprop="propertyID" content="https://registry.identifiers.org/registry/doi">
        <span itemprop="name">doi</span><span itemprop="value">12.345/67890213445</span>
      </li>
    </ul>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1">heading 1</h2>
    <h3 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1-1">subheading 1</h3>
    <h3 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1-2">subheading 2</h3>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s2">heading 2</h2>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s3">heading 3</h2>
  </article>
`;

const articleHtmlNoTitle = `
  <article>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1">heading 1</h2>
    <h3 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1-1">subheading 1</h3>
    <h3 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s1-2">subheading 2</h3>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s2">heading 2</h2>
    <h2 itemscope="" itemtype="http://schema.stenci.la/Heading" id="s3">heading 3</h2>
  </article>
`

const articleHtmlNoHeadings = `
  <article>
    <h1 itemprop="headline" content="Article">Article</h1>
  </article>
`;

describe('article-page', () => {
  it('wraps the article html with the themed page html', () => {
    const result = wrapArticleInHtml(validArticleHtml, '');

    expect(result.startsWith('<html lang="en">') && result.endsWith('</html>')).toBeTruthy();
  });

  it('gets the title from the html', () => {
    const wrappedArticle = wrapArticleInHtml(validArticleHtml, '');
    const container = JSDOM.fragment(wrappedArticle);

    expect(container.querySelector('title')?.textContent).toBe('Article');
  });

  it('sets the title to empty string if it is not found', () => {
    const wrappedArticle = wrapArticleInHtml(articleHtmlNoTitle, '');
    const container = JSDOM.fragment(wrappedArticle);

    expect(container.querySelector('title')?.textContent).toBe('');
  });

  it('moves the article heading elements out of the article body and into an article header', () => {
    const wrappedArticle = wrapArticleInHtml(validArticleHtml, '');
    const container = JSDOM.fragment(wrappedArticle);

    expect(container.querySelector('article > h1')).toBeNull()
    expect(container.querySelector('article > [data-itemprop="authors"]')).toBeNull()
    expect(container.querySelector('article > [data-itemprop="affiliations"]')).toBeNull()
    expect(container.querySelector('article > [itemprop="publisher"]')).toBeNull()
    expect(container.querySelector('article > [itemprop="datePublished"]')).toBeNull()
    expect(container.querySelector('article > [data-itemprop="identifiers"]')).toBeNull()

    expect(container.querySelector('main > .header > h1')?.textContent).toBe('Article');
    expect(container.querySelector('main > .header > [data-itemprop="authors"]')?.textContent?.replaceAll(/[\s]{2,}/g,' ').trim()).toBe('Reece Urcher 1');
    expect(container.querySelector('main > .header > [data-itemprop="affiliations"]')?.textContent?.replaceAll(/[\s]{2,}/g,' ').trim()).toBe('Department of Neuroscience, The University of Texas at Austin');
    expect(container.querySelector('main > .header > [itemprop="publisher"]')?.textContent?.replaceAll(/[\s]{2,}/g,' ').trim()).toBe('');
    expect(container.querySelector('main > .header > [itemprop="datePublished"]')?.textContent).toBe('2021-07-06');
    expect(container.querySelector('main > .header > [data-itemprop="identifiers"]')?.textContent?.replaceAll(/[\s]{2,}/g,' ').trim()).toBe('doi12.345/67890213445');
  });

  it('does not include Table of Contents if no headings found', () => {
    const wrappedArticle = wrapArticleInHtml(articleHtmlNoHeadings, '');
    const container = JSDOM.fragment(wrappedArticle);

    expect(container.querySelector('.toc-container')).toBeNull();
  });

  it('generates a list of headings', () => {
    const wrappedArticle = wrapArticleInHtml(validArticleHtml, '');
    const container = JSDOM.fragment(wrappedArticle);
    const headingsNode = container.querySelectorAll('.toc-list__item > .toc-list__link');
    const headings = Array.from(headingsNode).map(element => element.textContent).filter(heading => heading !== null);

    expect(headings).toStrictEqual(expect.arrayContaining(['heading 1', 'heading 2', 'heading 3']));
  });

  it('does not add any html when there are no subheadings', () => {
    const wrappedArticle = wrapArticleInHtml(validArticleHtml, '');
    const container = JSDOM.fragment(wrappedArticle);
    const subHeadingsNode = container.querySelector('.toc-list:nth-child(2) > .toc-list__item > .toc-list__link--subheading');

    expect(subHeadingsNode).toBeNull();
  })
})
