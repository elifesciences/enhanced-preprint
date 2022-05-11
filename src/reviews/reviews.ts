import { marked } from "marked";

export const generateReviewPage = (reviews: string[], doi: string): string => {
  if (reviews.length == 0) {
    return wrapWithHtml('<li class="review-list__item"><article class="review-list-content">No reviews found</article></li>', doi);
  }
  const reviewListItems = reviews.map(review => `<li class="review-list__item"><article class="review-list-content">${marked.parse(review)}</article></li>`)
  return wrapWithHtml(reviewListItems.join(''), doi);
}

const wrapWithHtml = (reviews: string, doi: string): string =>
  `<main role="main">
    <a class="return-link" href="/article/${doi}">< Back to article</a>
    <ul class="review-list">
        ${reviews}
    </ul>
  </main>`;
