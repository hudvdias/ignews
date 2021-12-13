import Prismic from '@prismicio/client';

export const repositoryName = 'ignews-hud'

export function getPrismicClient(req?: unknown) {
  const prismic = Prismic.client(
    process.env.PRISMIC_ENDPOINT,
    {
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
      req,
    }
  );

  return prismic;
};