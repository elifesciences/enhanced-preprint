import {
  ArticleMetaSchema,
  EnhancedArticleSchema,
  ExternalVersionSummarySchema,
  RelatedContentSchema,
  SubjectsSchema,
} from './http-schema';

const enhancedArticleExample = {
  id: 'testid1',
  msid: 'testmsid1',
  doi: 'doi1',
  versionIdentifier: '1',
  versionDoi: 'publisher/testid1',
  article: {
    title: 'test article',
    authors: [
      {
        familyNames: ['Daffy'],
        givenNames: ['Duck'],
        affiliations: [{ name: 'ACME Labs' }],
        emails: ['daffy.duck@acme.org'],
      },
    ],
    abstract: 'This is the test abstract',
    licenses: [
      {
        type: 'CreativeWork',
        url: 'http://creativecommons.org/licenses/by/4.0/',
      },
      {
        type: 'CreativeWork',
        content: [
          {
            type: 'Paragraph',
            content: [
              'The copyright holder for this pre-print is the author. All rights reserved. The material may not be redistributed, re-used or adapted without the author\'s permission.',
            ],
          },
        ],
      },
    ],
    content: 'This is some test content',
    references: [
      {
        type: 'Article',
        id: 'ref1',
        title: 'Reference 1',
        authors: [],
        isPartOf: {
          type: 'CreativeWork',
          volumeNumber: 1,
        },
      },
      {
        type: 'Article',
        id: 'ref2',
        title: 'Reference 2',
        authors: [],
        pageStart: 1,
        pageEnd: 2,
        isPartOf: {
          type: 'PublicationVolume',
          volumeNumber: 10738584221112336,
        },
      },
      {
        type: 'Article',
        id: 'ref3',
        title: 'Reference 3',
        authors: [],
        pageStart: 'one',
        pageEnd: 'two',
        isPartOf: {
          type: 'Periodical',
          volumeNumber: 'one',
        },
        meta: {
          yearPublished: '2024a',
          label: 'i am a label',
        },
      },
      {
        type: 'Article',
        id: 'ref4',
        title: 'Reference 4',
        authors: [],
        publisher: {
          type: 'Organization',
          name: 'Publisher',
          address: {
            type: 'PostalAddress',
            addressLocality: 'Address Locality',
          },
        },
      },
    ],
  },
  preprintDoi: 'preprint/testid1',
  preprintUrl: 'doi.org/preprint/testid1',
  preprintPosted: '2023-01-02',
  sentForReview: '2023-01-03',
  published: '2023-01-23',
};

const externalVersionSummaryExample = {
  id: 'testid2',
  msid: 'testmsid1',
  doi: 'doi2',
  url: 'https://doi.org/doi2',
  versionIdentifier: '2',
  published: '2023-02-28',
};

describe('httpschema (EnhancedArticleSchema)', () => {
  it.each([
    'foo',
    ['one', 'two', { type: 'Strong', content: { type: 'NontextualAnnotation', content: 'three' } }],
    ['', 'with', '', 'empty', { type: 'Strong', content: 'strings' }, ''],
    {
      type: 'Heading', depth: 1, content: 'heading', id: 'h1',
    },
    {
      type: 'Cite',
      content: 'I am a citation',
      target: 'target',
    },
    {
      type: 'Link',
      content: 'I am a link',
      target: 'target',
    },
    {
      type: 'Paragraph',
      content: 'I am a paragraph',
    },
    {
      type: 'Emphasis',
      content: 'I am emphasised',
    },
    {
      type: 'Strong',
      content: 'I am strong',
    },
    {
      type: 'Superscript',
      content: 'I am super',
    },
    {
      type: 'Subscript',
      content: 'I am a subscript',
    },
    {
      type: 'Date',
      content: '13/01/2001',
    },
    {
      type: 'Figure',
      content: 'I am a simple figure',
    },
    {
      type: 'Figure',
      content: 'I am a figure with caption, label and id',
      caption: 'I am a caption',
      label: 'I am a label',
      id: 'id',
    },
    {
      type: 'ImageObject',
      id: 'img',
      contentUrl: 'https://placekitten.com/500/300',
      content: [],
      meta: {
        inline: false,
      },
    },
    {
      type: 'List',
      order: 'Unordered',
      items: [
        {
          type: 'ListItem',
          content: 'one',
        },
        {
          type: 'ListItem',
          content: ['two'],
        },
        {
          type: 'ListItem',
          content: [
            {
              type: 'Strong',
              content: 'three',
            },
          ],
        },
      ],
      meta: { listType: 'alpha-upper' },
    },
    {
      type: 'Claim',
      claimType: 'Statement',
      label: 'This is a label',
      title: [
        {
          type: 'Heading',
          depth: 1,
          content: 'heading',
          id: 'h1',
        },
      ],
      content: [
        'Claim content',
      ],
    },
    [
      [{
        type: 'Heading', depth: 1, content: 'heading', id: 'h1',
      }],
    ],
  ])('validates %s content', (value) => {
    const enhancedArticle = {
      ...enhancedArticleExample,
      article: {
        ...enhancedArticleExample.article,
        content: value,
      },
    };
    expect(EnhancedArticleSchema.validate(enhancedArticle).error).toBeUndefined();
  });

  const sampleRequiredFieldValidationMessages = [
    '"doi" is required',
    '"versionIdentifier" is required',
    '"article" is required',
    '"preprintDoi" is required',
    '"preprintUrl" is required',
    '"preprintPosted" is required',
  ];

  const allRequiredFieldValidationMessages = [
    '"id" is required',
    '"msid" is required',
    ...sampleRequiredFieldValidationMessages,
    '"published" is required',
  ];

  it.each([
    [{}, allRequiredFieldValidationMessages],
    [{ id: '12345', msid: 1, published: null }, ['"msid" must be a string', ...sampleRequiredFieldValidationMessages]],
    [{ id: '12345', msid: 'id', published: 'not a date' }, [...sampleRequiredFieldValidationMessages, '"published" must be a valid date']],
    [{ publishedYear: 'one' }, [...allRequiredFieldValidationMessages, '"publishedYear" must be a number']],
    // Verify that publishedYear can also be a numeric string.
    [{ publishedYear: '2023' }, [...allRequiredFieldValidationMessages]],
    [{ unknown: 'unknown' }, [...allRequiredFieldValidationMessages, '"unknown" is not allowed']],
    [{ unknown1: 'unknown', unknown2: 'unknown' }, [...allRequiredFieldValidationMessages, '"unknown1" is not allowed', '"unknown2" is not allowed']],
  ])('handles validation error', (value, errorDetails) => {
    const invalidateEnhancedArticle = EnhancedArticleSchema.validate(value, { abortEarly: false });

    expect(invalidateEnhancedArticle.error).toBeDefined();
    expect(invalidateEnhancedArticle.error?.details.map((detail) => detail.message)).toStrictEqual(errorDetails);
  });

  it('coerces dates', () => {
    const enhancedArticle = EnhancedArticleSchema.validate(enhancedArticleExample);

    expect(enhancedArticle.error).toBeUndefined();
    expect(enhancedArticle.value?.preprintPosted).toStrictEqual(new Date('2023-01-02'));
    expect(enhancedArticle.value?.sentForReview).toStrictEqual(new Date('2023-01-03'));
    expect(enhancedArticle.value?.published).toStrictEqual(new Date('2023-01-23'));
  });

  it('validates optional reference meta', () => {
    const enhancedArticle = EnhancedArticleSchema.validate(enhancedArticleExample);

    expect(enhancedArticle.error).toBeUndefined();
    expect(enhancedArticle.value?.article.references[2].meta.label).toStrictEqual('i am a label');
    expect(enhancedArticle.value?.article.references[2].meta.yearPublished).toStrictEqual('2024a');
  });

  it('will convert publishedYear to number from string', () => {
    const enhancedArticle = EnhancedArticleSchema.validate({
      ...enhancedArticleExample,
      publishedYear: '2023',
    });

    expect(enhancedArticle.error).toBeUndefined();
    expect(typeof enhancedArticle.value?.publishedYear).toStrictEqual('number');
    expect(enhancedArticle.value?.publishedYear).toStrictEqual(2023);
  });

  it('parses optional values', () => {
    const articleWithOptionals = {
      ...enhancedArticleExample,
      subjects: [
        'subject 1',
        'subject 2',
      ],
      volume: '1',
      eLocationId: 'RP12356',
      versionDoi: '10.7554/123456',
      publishedYear: '2023',
      sentForReview: '2023-07-31',
      peerReview: {
        evaluationSummary: {
          date: '2023-08-01',
          doi: '10.7554/eLife.81090.sa0',
          reviewType: 'evaluation-summary',
          text: 'This is a great paper',
          participants: [],
        },
        authorResponse: {
          date: '2023-08-01',
          doi: '10.7554/eLife.81090.sa1',
          reviewType: 'author-response',
          text: 'I know',
          participants: [],
        },
        reviews: [],
      },
      published: '2023-08-02',
      relatedContent: [
        {
          type: 'Related Insight',
          title: 'Insight Title',
          url: 'https://doi.org/10.7554/eLife.11111',
          content: 'Insight article about this article',
          imageUrl: 'http://placekitten.com/200/150',
        },
        {
          type: 'Related Insight',
          title: 'Insight Title 2',
          url: 'https://doi.org/10.7554/eLife.22222',
        },
      ],
    };

    const enhancedArticle = EnhancedArticleSchema.validate(articleWithOptionals);

    expect(enhancedArticle.error).toBeUndefined();
  });

  it.each([
    [[{ type: 'type', title: 'title', url: 'http://url.com' }], ''],
    [[{
      type: 'type',
      title: 'title',
      url: 'http://url.com',
      content: 'content',
      imageUrl: 'http://image.url',
    }], ''],
    [[{
      type: 'type',
      title: 'title',
      url: 'http://url.com',
      unknown: 'unknown',
    }], '"[0].unknown" is not allowed'],
    [[{ title: 'title', url: 'http://url.com' }], '"[0].type" is required'],
    [[{ type: 0, title: 'title', url: 'http://url.com' }], '"[0].type" must be a string'],
    [[{ type: 'type', url: 'http://url.com' }], '"[0].title" is required'],
    [[{ type: 'type', title: {}, url: 'http://url.com' }], '"[0].title" must be a string'],
    [[{ type: 'type', title: 'title' }], '"[0].url" is required'],
    [[{ type: 'type', title: 'title', url: false }], '"[0].url" must be a string'],
    [[{
      type: 'type',
      title: 'title',
      url: 'http://url.com',
      content: '',
    }], '"[0].content" is not allowed to be empty'],
    [[{
      type: 'type',
      title: 'title',
      url: 'http://url.com',
      imageUrl: 1,
    }], '"[0].imageUrl" must be a string'],
  ])('validate relatedContent array: %s', (input, message?) => {
    const result = RelatedContentSchema.validate(input);
    if (message) {
      expect(result.error).toBeDefined();
      expect(result.error?.message).toStrictEqual(message);
    } else {
      expect(result.error).toBeUndefined();
    }
  });

  it.each([
    [['subject1', 'subject2'], ''],
    [['subject1', 'subject1'], '"[1]" contains a duplicate value'],
    [['', 'subject1'], '"[0]" is not allowed to be empty'],
    [['subject1', ['subject2']], '"[1]" must be a string'],
  ])('validate subjects array: %s', (input, message?) => {
    const result = SubjectsSchema.validate(input);
    if (message) {
      expect(result.error).toBeDefined();
      expect(result.error?.message).toStrictEqual(message);
    } else {
      expect(result.error).toBeUndefined();
    }
  });

  it.each([
    [
      {
        authorNotes: 'not valid',
      },
      ['"authorNotes" must be an array'],
    ],
    [
      {
        authorNotes: [],
      },
      ['"authorNotes" must contain at least 1 items'],
    ],
    [
      {
        authorNotes: [
          {},
        ],
      },
      [
        '"authorNotes[0].type" is required',
        '"authorNotes[0].text" is required',
      ],
    ],
    [
      {
        authorNotes: [
          {
            type: 'type',
            text: 'text',
          },
          {
            type: 'type',
            id: 'id',
            text: 'text',
            label: 'label',
          },
          {
            type: 'type',
            text: 'text',
            unknown: 'unknown',
          },
        ],
      },
      ['"authorNotes[2].unknown" is not allowed'],
    ],
    [
      {
        authorNotes: [
          {
            type: 'type',
            text: 'text',
          },
          {
            type: 'type',
            id: 'id',
            text: 'text',
            label: 'label',
          },
        ],
      },
      [],
    ],
    [{}, []],
  ])('validate article meta schema: %s', (input, errorDetails) => {
    const result = ArticleMetaSchema.validate(input, { abortEarly: false });
    if (errorDetails.length > 0) {
      expect(result.error).toBeDefined();
      expect(result.error?.details.map((detail) => detail.message)).toStrictEqual(errorDetails);
    } else {
      expect(result.error).toBeUndefined();
    }
  });

  it.each([
    [
      {
        notes: 'not valid',
      },
      ['"article.authors[0].meta.notes" must be an array'],
    ],
    [
      {
        notes: [],
      },
      ['"article.authors[0].meta.notes" must contain at least 1 items'],
    ],
    [
      {
        notes: [
          {},
        ],
      },
      [
        '"article.authors[0].meta.notes[0].type" is required',
        '"article.authors[0].meta.notes[0].rid" is required',
      ],
    ],
    [
      {
        notes: [
          {
            type: 'type',
            rid: 'rid',
          },
          {
            type: 'type',
            rid: 'rid',
            label: 'label',
          },
          {
            type: 'type',
            rid: 'rid',
            unknown: 'unknown',
          },
        ],
      },
      [
        '"article.authors[0].meta.notes[2].unknown" is not allowed',
      ],
    ],
    [
      {
        notes: [
          {
            type: 'type',
            rid: 'rid',
          },
          {
            type: 'type',
            rid: 'rid',
            label: 'label',
          },
        ],
      },
      [],
    ],
    [
      {},
      [],
    ],
  ])('validates author meta %s', (meta, errorDetails) => {
    const enhancedArticle = {
      ...enhancedArticleExample,
      article: {
        ...enhancedArticleExample.article,
        authors: [
          {
            ...enhancedArticleExample.article.authors[0],
            meta,
          },
          ...enhancedArticleExample.article.authors.slice(1),
        ],
      },
    };
    const result = EnhancedArticleSchema.validate(enhancedArticle, { abortEarly: false });
    if (errorDetails.length > 0) {
      expect(result.error).toBeDefined();
      expect(result.error?.details.map((detail) => detail.message)).toStrictEqual(errorDetails);
    } else {
      expect(result.error).toBeUndefined();
    }
  });

  it('Fails on empty or missing article.references', () => {
    const emptyReferencesErrorMessage = '"article.references" must contain at least 1 items';
    const articleWithEmptyReferences = {
      ...enhancedArticleExample,
      article: {
        ...enhancedArticleExample.article,
        references: [],
      },
    };

    const result = EnhancedArticleSchema.validate(articleWithEmptyReferences);

    expect(result.error).toBeDefined();
    expect(result.error?.message).toStrictEqual(emptyReferencesErrorMessage);

    const missingReferencesErrorMessage = '"article.references" is required';
    const articleWithNoReferences = ({ ...articleWithEmptyReferences } as any);
    delete articleWithNoReferences.article.references;

    const result2 = EnhancedArticleSchema.validate(articleWithNoReferences);

    expect(result2.error).toBeDefined();
    expect(result2.error?.message).toStrictEqual(missingReferencesErrorMessage);
  });
});

describe('httpschema (ExternalVersionSummarySchema)', () => {
  const sampleRequiredFieldValidationMessages = [
    '"doi" is required',
    '"url" is required',
    '"versionIdentifier" is required',
  ];

  const allRequiredFieldValidationMessages = [
    '"id" is required',
    '"msid" is required',
    ...sampleRequiredFieldValidationMessages,
    '"published" is required',
  ];

  it.each([
    [{}, allRequiredFieldValidationMessages],
    [{ id: '12345', msid: 1, published: null }, ['"msid" must be a string', ...sampleRequiredFieldValidationMessages]],
    [{ id: '12345', msid: 'id', published: 'not a date' }, [...sampleRequiredFieldValidationMessages, '"published" must be a valid date']],
    [{ unknown: 'unknown' }, [...allRequiredFieldValidationMessages, '"unknown" is not allowed']],
    [{ unknown1: 'unknown', unknown2: 'unknown' }, [...allRequiredFieldValidationMessages, '"unknown1" is not allowed', '"unknown2" is not allowed']],
  ])('handles validation error', (value, errorDetails) => {
    const invalidateExternalVersionSummary = ExternalVersionSummarySchema.validate(value, { abortEarly: false });

    expect(invalidateExternalVersionSummary.error).toBeDefined();
    expect(invalidateExternalVersionSummary.error?.details.map((detail) => detail.message)).toStrictEqual(errorDetails);
  });

  it.each([
    [[{}], ['"corrections[0].url" is required', '"corrections[0].date" is required']],
    [[{ url: 'url', date: '2024-01-14' }, {}], ['"corrections[1].url" is required', '"corrections[1].date" is required']],
    [[{ url: 'url' }], ['"corrections[0].date" is required']],
    [[{ date: '2024-01-14' }], ['"corrections[0].url" is required']],
    [[{ url: {}, date: '2024-01-14' }], ['"corrections[0].url" must be a string']],
    [[{ url: 'url', date: 'date' }], ['"corrections[0].date" must be in ISO 8601 date format']],
  ])('handles validation error with corrections', (corrections, expectedMessages) => {
    const invalidateCorrections = ExternalVersionSummarySchema.validate({
      id: 'id',
      msid: 'msid',
      doi: 'doi',
      versionIdentifier: 'v42',
      published: '2008-11-02',
      url: 'www.google.com',
      corrections,
    }, { abortEarly: false });

    expect(invalidateCorrections.error).toBeDefined();
    expect(invalidateCorrections.error?.details.map((detail) => detail.message)).toStrictEqual(expectedMessages);
  });

  it('coerces dates', () => {
    const externalVersionSummary = ExternalVersionSummarySchema.validate(externalVersionSummaryExample);

    expect(externalVersionSummary.error).toBeUndefined();
    expect(externalVersionSummary.value?.published).toStrictEqual(new Date('2023-02-28'));
  });

  it('validates vor corrections', () => {
    const corrections1Entry = [{
      url: 'https://elifesciences.org/reviewed-preprints/85111/',
      date: '2024-01-14',
    }];

    const input = {
      id: 'id',
      msid: 'msid',
      doi: 'doi',
      versionIdentifier: 'v42',
      published: '2008-11-02',
      url: 'www.google.com',
      corrections: corrections1Entry,
    };
    const { value, error } = ExternalVersionSummarySchema.validate(input);

    expect(error).toBeUndefined();
    expect(value.corrections).toBeTruthy();
  });
});
