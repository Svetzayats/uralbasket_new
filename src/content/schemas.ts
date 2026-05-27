import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["baskets", "trade", "design", "boxes"]),
  description: z.string().min(1),
  price: z.string().optional(),
  images: z.array(z.string()).min(0),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const blogSchema = z.object({
  title: z.string().min(1),
  publishedAt: z.date(),
  category: z.enum(["master-class", "reviews", "how-to", "materials"]),
  excerpt: z.string().min(1),
  coverImage: z.string().min(1),
  draft: z.boolean().default(false),
});

export const pageSchema = z.object({
  title: z.string().min(1),
});

export type Product = z.infer<typeof productSchema>;
export type BlogPost = z.infer<typeof blogSchema>;
export type Page = z.infer<typeof pageSchema>;
