import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema, blogSchema, pageSchema } from './content/schemas';

export const collections = {
  products: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
    schema: productSchema,
  }),
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: blogSchema,
  }),
  pages: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
    schema: pageSchema,
  }),
};
