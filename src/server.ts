import express from 'express';
import { generateArticleList } from './article-list/article-list';
import { articlePage } from './article/article-page';
import { generateReviewPage } from './reviews/reviews';
import { basePage } from './base-page/base-page';
import { ArticleRepository } from './model/model';
import { loadXmlArticlesFromDirIntoStores } from './data-loader/data-loader';
import { createEnhancedArticleGetter, GetEnhancedArticle } from './reviews/get-enhanced-article';
import { createArticleRepository } from './model/create-article-repository';
import { config } from './config';
import { logger } from './utils/logger';

const app = express();

let articleRepository: ArticleRepository;
let getEnhancedArticle: GetEnhancedArticle;
createArticleRepository(config.repoType, config.repoConnection, config.repoUserName, config.repoPassword).then(async (repo: ArticleRepository) => {
  articleRepository = repo;
  getEnhancedArticle = createEnhancedArticleGetter(articleRepository, config.id);
  app.listen(3000, () => {
    logger.info('Example app listening on port 3000');
  });
});

app.use(express.static('public'));

app.get('/', async (req, res) => {
  res.send(basePage(generateArticleList(config.name, await articleRepository.getArticleSummaries())));
});

app.get('/api/article/:publisherId/:articleId/content', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;

  const { content } = await articleRepository.getArticle(doi);
  res.send(content);
});

app.get('/api/article/:publisherId/:articleId/metadata', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;

  const article = await articleRepository.getArticle(doi);
  res.send({
    authors: article.authors,
    doi,
    title: article.title,
    msas: [],
    importance: '',
    strengthOfEvidence: '',
    views: 1,
    citations: 2,
    tweets: 3,
    headings: article.headings,
  });
});

app.get('/article/:publisherId/:articleId', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const noHeader = req.query.noHeader !== undefined && req.query.noHeader === 'true';
  const pageContent = articlePage(await articleRepository.getArticle(doi), noHeader);
  res.send(basePage(pageContent, noHeader));
});

app.get('/article/:publisherId/:articleId/reviews', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const noHeader = req.query.noHeader !== undefined && req.query.noHeader === 'true';
  const pageContent = generateReviewPage(await getEnhancedArticle(doi), noHeader);
  res.send(basePage(pageContent, noHeader));
});

app.get('/article/:publisherId/:articleId/attachment/:attachmentId', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const { attachmentId } = req.params;

  if (req.accepts('image/jpeg')) {
    const iiifId = encodeURIComponent(`${doi}/${attachmentId}`);

    res.redirect(`${config.iiifServer}/iiif/2/${iiifId}/full/max/0/default.jpg`);
    return;
  }

  logger.error('Something requested an attachment, but it didnt accept jpegs. Send 404 as we currently cant find it');
  res.sendStatus(415);
});

app.get('/article/:publisherId/:articleId/iiif/:attachmentId', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const { attachmentId } = req.params;

  const iiifId = encodeURIComponent(`${doi}/${attachmentId}`);

  res.redirect(`${config.iiifServer}/iiif/2/${iiifId}`);
});

app.get('/import', async (req, res) => {
  res.send(basePage(`<form method="POST">
    <input type="submit" value="import">
  </form>`));
});
app.post('/import', async (req, res) => {
  const results = await loadXmlArticlesFromDirIntoStores(config.dataDir, articleRepository);
  if (results.every((value) => value)) {
    res.send({ status: true, message: 'Import completed' });
  } else if (results.every((value) => !value)) {
    res.send({ status: false, message: 'No new files were imported' });
  } else {
    res.send({ status: true, message: 'Some new items imported' });
  }
});
