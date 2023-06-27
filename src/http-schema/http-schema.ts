import Joi from 'joi';
import { EnhancedArticle } from '../model/model';

const ParagraphSchema = Joi.object({
  type: Joi.string().valid('Paragraph').required(),
  content: Joi.link('#Content').required(),
});

const StrongContentSchema = Joi.object({
  type: Joi.string().valid('Strong').required(),
  content: Joi.link('#Content').required(),
});

const DateContentSchema = Joi.object({
  type: Joi.string().valid('Date').required(),
  content: Joi.link('#Content').required(),
});

const EmphasisContentSchema = Joi.object({
  type: Joi.string().valid('Emphasis').required(),
  content: Joi.link('#Content').required(),
});

const SuperscriptContentSchema = Joi.object({
  type: Joi.string().valid('Superscript').required(),
  content: Joi.link('#Content').required(),
});

const SubscriptContentSchema = Joi.object({
  type: Joi.string().valid('Subscript').required(),
  content: Joi.link('#Content').required(),
});

const ListItemContentSchema = Joi.object({
  type: Joi.string().valid('ListItem').required(),
  content: Joi.link('#Content').required(),
});

const ListContentSchema = Joi.object({
  type: Joi.string().valid('List').required(),
  order: Joi.string().valid('Unordered', 'Ascending').required(),
  items: Joi.array().items(ListItemContentSchema).required(),
});

const ClaimContentSchema = Joi.object({
  type: Joi.string().valid('Claim').required(),
  claimType: Joi.string().valid('Statement', 'Theorem', 'Lemma', 'Proof', 'Postulate', 'Hypothesis', 'Proposition', 'Corollary').required(),
  label: Joi.link('#Content').optional(),
  title: Joi.link('#Content').optional(),
});

const LinkContentSchema = Joi.object({
  type: Joi.string().valid('Link').required(),
  target: Joi.string().required(),
  relation: Joi.string().optional(),
  content: Joi.link('#Content').required(),
});

const CiteContentSchema = Joi.object({
  type: Joi.string().valid('Cite').required(),
  content: Joi.link('#Content').required(),
  target: Joi.string().required(),
});

const CiteGroupContentSchema = Joi.object({
  type: Joi.string().valid('CiteGroup').required(),
  items: Joi.array().items(CiteContentSchema).required(),
});

const HeadingContentSchema = Joi.object({
  id: Joi.string().optional().allow(''),
  type: Joi.string().valid('Heading').required(),
  content: Joi.link('#Content').required(),
  depth: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
});

const FigureContentSchema = Joi.object({
  type: Joi.string().valid('Figure').required(),
  content: Joi.link('#Content').required(),
  caption: Joi.link('#Content').optional(),
  id: Joi.string().optional(),
  label: Joi.string().optional(),
});

const ImageObjectContent = Joi.object({
  type: Joi.string().valid('ImageObject').required(),
  contentUrl: Joi.string().optional(),
  content: Joi.link('#Content').optional(),
  meta: Joi.object({
    inline: Joi.boolean(),
  }).optional(),
});

// These are not imported yet
const OtherContent = Joi.object({
  type: Joi.string().valid('CodeBlock', 'MathFragment', 'MediaObject', 'Table', 'ThematicBreak'),
});
// end block

const ContentPartSchema = Joi.alternatives().try(
  Joi.string().allow(''),
  ParagraphSchema,
  StrongContentSchema,
  DateContentSchema,
  EmphasisContentSchema,
  SuperscriptContentSchema,
  SubscriptContentSchema,
  ListItemContentSchema,
  ListContentSchema,
  ClaimContentSchema,
  LinkContentSchema,
  CiteContentSchema,
  CiteGroupContentSchema,
  HeadingContentSchema,
  FigureContentSchema,
  ImageObjectContent,
  OtherContent,
);

const ContentSchema = Joi.alternatives().try(
  ContentPartSchema,
  Joi.array().items(Joi.alternatives().try(ContentPartSchema, Joi.array().items(Joi.link('#Content')))),
).id('Content');

const ParticipantSchema = Joi.object({
  name: Joi.string().required(),
  role: Joi.string().required(),
  institution: Joi.string().optional(),
});
const EvaluationSchema = Joi.object({
  date: Joi.date().required(),
  reviewType: Joi.string().valid('evaluation-summary', 'review-article', 'reply').required(), // TODO get this from ENUM?
  text: Joi.string().required(),
  participants: Joi.array().items(ParticipantSchema).required(),
});

const PeerReviewSchema = Joi.object({
  evaluationSummary: EvaluationSchema.required(),
  reviews: Joi.array().items(EvaluationSchema).required(),
  authorResponse: EvaluationSchema.optional(),
});

const AddressSchema = Joi.object({
  addressCountry: Joi.string().optional(),
});

const OrganisationSchema = Joi.object({
  name: Joi.string().required(),
  address: AddressSchema.optional(),
});

const IdentifierSchema = Joi.object({
  type: Joi.string().required(),
  value: Joi.string().required(),
});

const AuthorSchema = Joi.object({
  familyNames: Joi.array().items(Joi.string()).required(),
  givenNames: Joi.array().items(Joi.string()).optional(),
  affiliations: Joi.array().items(OrganisationSchema).optional(),
  emails: Joi.array().items(Joi.string()).optional(),
  identifiers: Joi.array().items(IdentifierSchema).optional(),
});

const LicenseSchema = Joi.object({
  type: Joi.string().required(),
  url: Joi.string().optional(),
  content: ContentSchema.optional(),
});

const PublicationSchema = Joi.object({
  type: Joi.string().valid('CreativeWork', 'Periodical', 'PublicationIssue', 'PublicationVolume').required(),
  name: Joi.string().optional(), // this seems wrong but required to pass the test document
  volumeNumber: Joi.number().optional(),
  isPartOf: Joi.link('#Publication').optional(),
}).id('Publication');

const ReferenceSchema = Joi.object({
  type: Joi.string().valid('Article').required(),
  id: Joi.string().required(),
  title: Joi.string().required(),
  url: Joi.string().optional(),
  pageEnd: Joi.number().optional(),
  pageStart: Joi.number().optional(),
  authors: Joi.array().items(Joi.alternatives().try(AuthorSchema, OrganisationSchema)).required(),
  datePublished: Joi.alternatives().try(
    Joi.date().optional(),
    Joi.object({ type: Joi.string().valid('Date'), value: Joi.date().required() }),
  ),
  isPartOf: PublicationSchema.optional(),
  identifiers: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    name: Joi.string().required(),
    propertyID: Joi.string().optional(),
    value: Joi.string().required(),
  })).optional(),
});

const ProcessedArticleSchema = Joi.object({
  title: ContentSchema,
  authors: Joi.array().items(AuthorSchema).required(),
  abstract: ContentSchema,
  licenses: Joi.array().items(LicenseSchema).required(),
  content: ContentSchema,
  references: Joi.array().items(ReferenceSchema).required(),
});

export const EnhancedArticleSchema = Joi.object<EnhancedArticle>({
  id: Joi.string().required(),
  msid: Joi.string().required(),
  doi: Joi.string().required(),
  versionIdentifier: Joi.string().required(),
  versionDoi: Joi.string().optional(),
  article: ProcessedArticleSchema.required(),
  preprintDoi: Joi.string().required(),
  preprintUrl: Joi.string().required(),
  preprintPosted: Joi.date().required(),
  sentForReview: Joi.date().optional(),
  peerReview: PeerReviewSchema.optional(),
  published: Joi.date().optional(),
});
