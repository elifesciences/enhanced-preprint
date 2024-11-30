import { Content } from './content';

export type Doi = string;

export type ArticleDocument = string;
export type ArticleContent = {
  doi: Doi
  document: ArticleDocument,
};

type AuthorMeta = {
  notes?: {
    type: string,
    rid: string,
    label?: string,
  }[],
};
export type ArticleTitle = Content;
export type ArticleAbstract = Content;
export type Address = {
  addressCountry?: string,
};
export type Organisation = {
  name: string,
  address?: Address,
  meta?: AuthorMeta,
};

export type OrcidIdentifier = {
  type: 'orcid',
  value: string,
};

export type Identifier = OrcidIdentifier;

export type Author = {
  familyNames: string[],
  givenNames?: string[],
  affiliations?: Organisation[],
  emails?: string[],
  identifiers?: Identifier[],
  meta?: AuthorMeta,
};

export type License = {
  type: string,
  url?: string,
  content?: Content,
};

export type PublicationType = 'CreativeWork' | 'Periodical' | 'PublicationIssue' | 'PublicationVolume';
export type Publication = {
  type: PublicationType,
  name?: string,
  volumeNumber?: number | string,
  isPartOf?: Publication,
};
type Publisher = {
  type: 'Organization',
  name: string,
  address?: {
    type: 'PostalAddress',
    addressLocality?: string,
  },
};
export type Reference = {
  type: 'Article',
  id: string,
  title: string,
  url?: string,
  pageEnd?: number | string,
  pageStart?: number | string,
  authors: Array<Author | Organisation>,
  datePublished?: Date,
  isPartOf?: Publication,
  publisher?: Publisher,
  identifiers?: {
    type: string,
    name: string,
    propertyID?: string,
    value: string,
  }[],
  meta?: {
    yearPublished?: string,
    label?: string,
  },
};

type ArticleMeta = {
  authorNotes?: {
    type: string,
    id: string,
    text: string,
    label?: string,
  }[],
};

export type ProcessedArticle = {
  doi: string,
  title: ArticleTitle,
  date: Date,
  authors: Author[],
  abstract: ArticleAbstract,
  licenses: License[],
  content: Content,
  references: Reference[],
  meta?: ArticleMeta,
};

export type ArticleSummary = {
  id: string,
  doi: Doi,
  msid: string,
  title: ArticleTitle,
  date: Date | null,
};
export type ArticleSummaryWithoutMSID = Omit<ArticleSummary, 'msid'>;

export type ReviewText = string;
export enum ReviewType {
  EvaluationSummary = 'evaluation-summary',
  Review = 'review-article',
  AuthorResponse = 'reply',
}

export type Participant = {
  name: string,
  role: string,
  institution?: string,
};

export type Evaluation = {
  date: Date,
  doi?: string,
  reviewType: ReviewType,
  text: ReviewText,
  participants: Participant[],
};

export type PeerReview = {
  evaluationSummary?: Evaluation,
  reviews: Evaluation[],
  authorResponse?: Evaluation,
};

type RelatedContent = {
  type: string,
  title: string,
  url: string,
  content?: string,
  imageUrl?: string,
};

export type EnhancedArticle = {
  id: string,
  msid: string,
  subjects?: string[],
  doi: string,
  volume?: string,
  eLocationId?: string,
  versionIdentifier: string,
  versionDoi?: string,
  // When we drop the old article schema from the DB,
  // we can change ProcessedArticle to exclude these properties and drop `Omit` here
  article: Omit<ProcessedArticle, 'doi' | 'date'>,
  preprintDoi: string,
  preprintUrl: string,
  preprintPosted: Date,
  sentForReview?: Date,
  peerReview?: PeerReview,
  published: Date | null,
  publishedYear?: number,
  pdfUrl?: string,
  license?: string,
  relatedContent?: RelatedContent[],
};

type PreprintVersionSummary = Omit<EnhancedArticle, 'article' | 'peerReview'>;

type ExternalVersionSummary = {
  id: string,
  msid: string,
  doi: string,
  versionIdentifier: string,
  published?: Date,
  url: string,
  corrections?: {
    url: string,
    date: Date,
  }[],
};

export type VersionSummary = PreprintVersionSummary | ExternalVersionSummary;

export type EnhancedArticleNoContent = VersionSummary & {
  article: Omit<ProcessedArticle, 'doi' | 'date' | 'content' | 'abstract' | 'licenses' | 'references'>,
  firstPublished: Date,
};

type Metrics = {
  views: number,
  downloads: number,
  citations: number,
};

export type EnhancedArticleWithVersions = {
  article: EnhancedArticle,
  metrics?: Metrics,
  versions: Record<string, VersionSummary>,
};

export type EnhancedArticlesNoContentWithTotal = {
  totalCount: number,
  articles: EnhancedArticleNoContent[],
};

export interface ArticleRepository {
  storeEnhancedArticle(article: EnhancedArticle | VersionSummary): Promise<boolean>;
  findArticleVersion(identifier: string, previews?: boolean): Promise<EnhancedArticleWithVersions | null>;
  getEnhancedArticleSummaries(): Promise<ArticleSummary[]>;
  getEnhancedArticlesNoContent(page: number | null, perPage: number | null, order: 'asc' | 'desc', startDate: string | null, endDate: string | null, useDate: 'firstPublished' | null): Promise<EnhancedArticlesNoContentWithTotal>;
  deleteArticleVersion(identifier: string): Promise<boolean>;
}
