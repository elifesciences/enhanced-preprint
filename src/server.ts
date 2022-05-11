import express from 'express';
import { readdirSync } from "fs";
import { convertJatsToHtml } from "./conversion/encode";
import { generateArticleList } from "./article-list/article-list";
import { buildArticlePage } from "./article/article";
import { generateReviewPage } from "./reviews/reviews";
import { basePage } from "./base-page/base-page";


const app = express();
const cache: Record<string, string> = {};

const getDirectories = (source: string) => {
  return readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  const articles: Record<string, Array<string>> = {};
  const journals = getDirectories('./data');
  journals.forEach(journal => articles[journal] = []);
  journals.forEach(journal => {
    getDirectories(`./data/${journal}`).forEach(articleDir => articles[journal].push(articleDir))
  })
  res.send(basePage(generateArticleList(journals, articles)));
});

app.get('/article/:journalId/:articleId', async (req, res) => {
  const journalId = req.params.journalId;
  const articleId = req.params.articleId;
  let articleHtml = cache[`${journalId}:${articleId}`];
  if (!articleHtml) {
    articleHtml = await convertJatsToHtml(journalId, articleId);
    cache[`${journalId}:${articleId}`] = articleHtml;
  }
  res.send(basePage(buildArticlePage(articleHtml, `${journalId}/${articleId}`)));
});

app.get('/article/:journalId/:articleId/reviews', async (req, res) => {
  const { journalId, articleId } = req.params;
  const doi = `${journalId}/${articleId}`;
  res.send(basePage(await generateReviewPage(doi)));
});

app.listen(3000, () => {
  console.log(`Example app listening on port 3000`);
});
