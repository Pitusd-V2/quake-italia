/** Moduli creati al build per gli articoli di «Capire» (vedi plugins/articoli.ts). */
declare module 'virtual:articoli' {
  import type { ArticleCard } from '../learn/articleTypes';
  const cards: ArticleCard[];
  export default cards;
}

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { ArticleData } from '../learn/articleTypes';
  /** I dati in cima al file (titolo, riassunto, fonti…), già controllati al build. */
  export const frontmatter: Omit<ArticleData, 'slug'>;
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}
