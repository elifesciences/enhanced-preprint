import {
  existsSync, readdirSync, realpathSync, rmSync,
} from 'fs';
import { mkdtemp } from 'fs/promises';
import { basename, dirname } from 'path';
import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3';
import { convertJatsToJson, PreprintXmlFile } from './conversion/encode';
import {
  ArticleContent, ArticleRepository, Heading, OrcidIdentifier as OrcidModel, ProcessedArticle,
} from '../model/model';
import { Content, HeadingContent } from '../model/content';
import { logger } from '../utils/logger';
import { config } from '../config';

// type related to the JSON output of encoda
type Address = {
  type: 'PostalAddress',
  addressCountry: string,
};
type Organisation = {
  type: 'Organization',
  name: string,
  address: Address,
};
type Identifier = {
  type?: string,
  propertyID?: string,
  name?: string
  value: string
};
type OrcidIdentifier = {
  type: 'PropertyValue',
  propertyID: 'https://registry.identifiers.org/registry/orcid',
  value: string
};
type Person = {
  type: 'Person',
  affiliations?: Array<Organisation>,
  familyNames: Array<string>,
  givenNames: Array<string>,
  emails?: Array<string>,
  identifiers?: Array<Identifier>,
};
type License = {
  type: 'CreativeWork',
  url: string,
};
type PublicationType = 'PublicationVolume' | 'Periodical';
type Publication = {
  type: PublicationType,
  name: string,
  volumeNumber?: number,
  isPartOf?: Publication,
};

type Reference = {
  type: 'Article',
  id: string,
  title: string,
  url: string,
  pageEnd: number,
  pageStart: number,
  authors: Array<Person>,
  identifiers?: {
    type: string,
    name: string,
    propertyID: string,
    value: string,
  }[],
  datePublished: {
    type: string,
    value: string
  },
  isPartOf?: Publication,
};

export type ArticleStruct = {
  id: string,
  journal: string,
  title: Content,
  datePublished: DateType
  dateAccepted: DateType
  dateReceived: DateType
  identifiers: Array<ArticleIdentifier>
  authors: Array<Person>,
  description: Content,
  licenses: Array<License>,
  content: Content,
  references: Reference[],
};
type ArticleIdentifier = {
  name: string,
  value: string
};

type DateType = {
  type: string,
  value: string
};

const getDirectories = (source: string) => readdirSync(source, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const getS3Connection = () => new S3Client({
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
    sessionToken: config.s3.sessionToken ?? undefined,
  },
  endpoint: config.s3.endPoint,
  forcePathStyle: true,
});
// read in the token from file if it's a file
// if (config.s3.sessionToken) {
//   const sessionToken = existsSync(config.s3.sessionToken) ? readFileSync(config.s3.sessionToken).toString('utf-8') : config.s3.sessionToken;
//   return new MinioClient({
//     ...config.s3,
//     sessionToken,
//   });
// }

// return new MinioClient(config.s3);

// TO-DO: replace this with s3
const getAvailableManuscriptPaths = async (client: S3Client): Promise<string[]> => new Promise((resolve, reject) => {
  const objectsRequest = client.send(new ListObjectsCommand({
    Bucket: config.s3Bucket,
    Prefix: '/data',
  }));
  const manuscriptPaths: string[] = [];

  objectsRequest.then((objects) => {
    // An object's key is it's filename
    objects.Contents?.forEach((obj) => {
      if (obj.Key && obj.Key.endsWith('.xml')) {
        manuscriptPaths.push(obj.Key);
        console.log(obj.Key);
      }
    });
    resolve(manuscriptPaths);
  }).catch((err) => reject(err));
});

const processXml = async (file: PreprintXmlFile): Promise<ArticleContent> => {
  // resolve path so that we can search for filenames reliable once encoda has converted the source
  const realFile = realpathSync(file);
  let json = await convertJatsToJson(realFile);
  const articleStruct = JSON.parse(json) as ArticleStruct;

  // extract DOI
  const dois = articleStruct.identifiers.filter((identifier) => identifier.name === 'doi');
  const doi = dois[0].value;

  // HACK: replace all locally referenced files with a id referencing the asset path
  const articleDir = dirname(realFile);
  logger.debug(`replacing ${articleDir} in JSON with ${doi} for client to find asset path`);
  json = json.replaceAll(articleDir, doi);

  return {
    doi,
    document: json,
  };
};

// TO-DO: replace this with s3
const fetchXml = async (xmlPath: string): Promise<string> => {
  const xmlFileName = basename(xmlPath);
  const downloadDir = await mkdtemp(xmlFileName);
  const articlePath = `${downloadDir}/article.xml`;
  // await client.fGetObject(config.s3Bucket, xmlPath, articlePath);
  return articlePath;
};

const extractHeadings = (content: Content): Heading[] => {
  if (typeof content === 'string') {
    return [];
  }

  if (!Array.isArray(content)) {
    return extractHeadings([content]);
  }

  const headingContentParts = content.filter((contentPart) => {
    if (typeof contentPart === 'string') {
      return false;
    }

    if (Array.isArray(contentPart)) {
      return extractHeadings(content);
    }

    if (contentPart.type !== 'Heading') {
      return false;
    }

    return contentPart.depth <= 1;
  });

  return headingContentParts.map((contentPart) => {
    const heading = contentPart as HeadingContent;
    return {
      id: heading.id,
      text: heading.content,
    };
  });
};

const processArticle = (article: ArticleContent): ProcessedArticle => {
  const articleStruct = JSON.parse(article.document) as ArticleStruct;

  // extract title
  const {
    title, description: abstract, licenses,
  } = articleStruct;

  // extract publish date
  const date = new Date(articleStruct.datePublished.value);

  // map datePublished in references to a date, and author references to orcids
  const references = articleStruct.references.map((reference) => ({
    ...reference,
    datePublished: reference.datePublished?.value ? new Date(reference.datePublished.value) : undefined,
    authors: reference.authors.map((author) => ({
      ...author,
      identifiers: author.identifiers
        ?.filter<OrcidIdentifier>((identifier): identifier is OrcidIdentifier => identifier.propertyID === 'https://registry.identifiers.org/registry/orcid')
        .map<OrcidModel>((identifier) => ({ type: 'orcid', value: identifier.value })),
    })),
  }));

  // map author OrcIds
  const authors = articleStruct.authors.map((author) => {
    // map identifiers
    const identifiers = author.identifiers
      ?.filter<OrcidIdentifier>((identifier): identifier is OrcidIdentifier => identifier.propertyID === 'https://registry.identifiers.org/registry/orcid')
      .map<OrcidModel>((identifier) => ({
      type: 'orcid',
      value: identifier.value.trim(),
    })) ?? undefined;

    return {
      ...author,
      identifiers,
    };
  });

  return {
    ...article,
    title,
    date,
    authors,
    abstract,
    licenses,
    content: articleStruct.content,
    headings: extractHeadings(articleStruct.content),
    references,
  };
};

export const loadXmlArticlesFromDirIntoStores = async (dataDir: string, articleRepository: ArticleRepository): Promise<boolean[]> => {
  const existingDocuments = (await articleRepository.getArticleSummaries()).map(({ doi }) => doi);

  if (config.s3Bucket) {
    const s3 = getS3Connection();
    const xmlFiles = await getAvailableManuscriptPaths(s3);

    // filter out already loaded DOIs
    const filteredXmlFiles = xmlFiles.filter((file) => !existingDocuments.some((doc) => file.includes(doc)));

    // fetch XML to FS, convert to JSON, map to Article data structure
    const articlesToLoad = await Promise.all(
      filteredXmlFiles.map(async (xmlS3FilePath) => fetchXml(xmlS3FilePath)
        .then(async (xmlFilePath) => {
          const articleContent = await processXml(xmlFilePath);
          rmSync(dirname(xmlFilePath), { recursive: true, force: true });
          return articleContent;
        }))
        .map(async (articleContent) => processArticle(await articleContent)),
    );

    return Promise.all(articlesToLoad.map((article) => articleRepository.storeArticle(article)));
  }

  // Old fs-based import
  const xmlFiles = getDirectories(dataDir)
    .map((articleId) => `${dataDir}/${articleId}/${articleId}.xml`)
    .filter((xmlFilePath) => existsSync(xmlFilePath));

  const articlesToLoad = (await Promise.all(xmlFiles.map((xmlFile) => processXml(xmlFile))))
    .filter((article) => !existingDocuments.includes(article.doi))
    .map(processArticle);

  return Promise.all(articlesToLoad.map((article) => articleRepository.storeArticle(article)));
};
