import { z } from "zod";

export const productSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1),
  categories: z.array(z.enum([
    "baskets",
    "laundry_baskets",
    "picnic",
    "gift",
    "household",
    "outdoor",
    "for_children",
    "for_pets",
    "storage",
    "home_and_garden",
    "design",
    "accessories",
    "decor",
    "easter",
    "boxes",
    "chests",
    "cribs",
    "display_equipment",
  ])).min(1),
  description: z.string().min(1),
  price: z.string().optional(),
  images: z.array(z.string()).min(0),
  sizes: z.object({
    width: z.number().nullish(),
    height: z.number().nullish(),
    depth: z.number().nullish(),
    diameter: z.number().nullish(),
  }).nullish(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(true),
  published: z.boolean().default(true),
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
