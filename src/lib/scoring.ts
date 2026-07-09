const MONTHLY_ACTIVE_RATIO = 0.05;
const SUBSCRIPTION_RATE = 0.10;
const IAP_RATE = 0.05;
const PAID_PURCHASE_RATE = 0.05;
const AVG_SUBSCRIPTION_PRICE = 9.99;
const AVG_IAP_PRICE = 4.99;

export function estimateMrr(app: {
  downloads: number;
  price: number;
  hasIap: boolean;
  hasSubscriptions: boolean;
  rating: number;
}): number {
  const mau = app.downloads * MONTHLY_ACTIVE_RATIO;
  const effectiveRating = app.rating > 0 ? app.rating : 2.5;
  const popularity = effectiveRating / 5;

  let mrr = 0;

  if (app.hasSubscriptions) {
    mrr += mau * SUBSCRIPTION_RATE * AVG_SUBSCRIPTION_PRICE;
  }

  if (app.hasIap) {
    mrr += mau * IAP_RATE * AVG_IAP_PRICE;
  }

  if (app.price > 0 && !app.hasSubscriptions && !app.hasIap) {
    mrr += mau * PAID_PURCHASE_RATE * app.price;
  } else if (app.price > 0) {
    mrr += mau * 0.01 * app.price;
  }

  return Math.round(mrr * popularity * 100) / 100;
}

export function calculateOpportunityScore(params: {
  estimatedMrr: number;
  negativeReviewRatio: number;
  competitorCount: number;
  descriptionLength: number;
}): number {
  let score = 0;

  const mrrScore = Math.min(40, Math.round(Math.log10(params.estimatedMrr + 1) * (40 / 6)));
  score += mrrScore;

  const negativeScore = Math.round(params.negativeReviewRatio * 20);
  score += negativeScore;

  let competitorScore = 0;
  if (params.competitorCount <= 2) competitorScore = 20;
  else if (params.competitorCount <= 5) competitorScore = 10;
  score += competitorScore;

  let simplicityScore = 0;
  if (params.descriptionLength < 500) simplicityScore = 10;
  else if (params.descriptionLength < 2000) simplicityScore = 5;
  score += simplicityScore;

  score += 5;

  return Math.min(100, Math.max(0, score));
}
