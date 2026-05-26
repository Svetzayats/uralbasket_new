import { describe, it, expect } from 'vitest';
import { productSchema, blogSchema, pageSchema } from '../content/schemas';

const validProduct = {
  title: 'Подарочная корзина',
  category: 'baskets' as const,
  description: 'Красивая плетёная корзина ручной работы.',
  images: ['/images/test.jpg'],
  inStock: true,
  featured: false,
  order: 1,
};

const validBlogPost = {
  title: 'Как выбрать корзину',
  publishedAt: new Date('2025-03-15'),
  category: 'how-to' as const,
  excerpt: 'Краткое описание статьи.',
  coverImage: '/images/blog/test.jpg',
  draft: false,
};

describe('productSchema', () => {
  it('accepts a valid product', () => {
    expect(() => productSchema.parse(validProduct)).not.toThrow();
  });

  it('accepts a product with an optional price', () => {
    const result = productSchema.parse({ ...validProduct, price: 'от 1 500 р.' });
    expect(result.price).toBe('от 1 500 р.');
  });

  it('applies defaults for inStock, featured, order', () => {
    const minimal = { title: 'T', category: 'trade' as const, description: 'D', images: ['/img.jpg'] };
    const result = productSchema.parse(minimal);
    expect(result.inStock).toBe(true);
    expect(result.featured).toBe(false);
    expect(result.order).toBe(0);
  });

  it('rejects a product missing title', () => {
    const { title: _, ...rest } = validProduct;
    expect(() => productSchema.parse(rest)).toThrow();
  });

  it('rejects a product missing description', () => {
    const { description: _, ...rest } = validProduct;
    expect(() => productSchema.parse(rest)).toThrow();
  });

  it('rejects an invalid category', () => {
    expect(() => productSchema.parse({ ...validProduct, category: 'furniture' })).toThrow();
  });

  it('rejects an empty images array', () => {
    expect(() => productSchema.parse({ ...validProduct, images: [] })).toThrow();
  });
});

describe('blogSchema', () => {
  it('accepts a valid blog post', () => {
    expect(() => blogSchema.parse(validBlogPost)).not.toThrow();
  });

  it('applies draft: false by default', () => {
    const { draft: _, ...rest } = validBlogPost;
    const result = blogSchema.parse(rest);
    expect(result.draft).toBe(false);
  });

  it('rejects a post missing publishedAt', () => {
    const { publishedAt: _, ...rest } = validBlogPost;
    expect(() => blogSchema.parse(rest)).toThrow();
  });

  it('rejects a post missing excerpt', () => {
    const { excerpt: _, ...rest } = validBlogPost;
    expect(() => blogSchema.parse(rest)).toThrow();
  });

  it('rejects a post missing coverImage', () => {
    const { coverImage: _, ...rest } = validBlogPost;
    expect(() => blogSchema.parse(rest)).toThrow();
  });

  it('rejects an invalid blog category', () => {
    expect(() => blogSchema.parse({ ...validBlogPost, category: 'news' })).toThrow();
  });
});

describe('pageSchema', () => {
  it('accepts a valid page', () => {
    expect(() => pageSchema.parse({ title: 'О нас' })).not.toThrow();
  });

  it('rejects a page missing title', () => {
    expect(() => pageSchema.parse({})).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() => pageSchema.parse({ title: '' })).toThrow();
  });
});
