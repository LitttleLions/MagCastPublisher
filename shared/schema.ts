import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Magazine Issues
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  issueId: text("issue_id").notNull().unique(), // e.g., "2025-09"
  date: text("date").notNull(),
  sections: jsonb("sections").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("draft"), // draft, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Articles within issues
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull().references(() => issues.id),
  articleId: text("article_id").notNull(), // e.g., "hafen-nacht"
  section: text("section").notNull(),
  type: text("type").notNull(), // feature, reportage, short
  title: text("title").notNull(),
  dek: text("dek"),
  author: text("author").notNull(),
  bodyHtml: text("body_html").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Images associated with articles
export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  src: text("src").notNull(),
  role: text("role").notNull(), // hero, inline, gallery
  caption: text("caption"),
  credit: text("credit"),
  focalPoint: text("focal_point"), // "x,y" coordinates
  dpi: integer("dpi"),
  width: integer("width"),
  height: integer("height"),
});

// Template packs
export const templatePacks = pgTable("template_packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull(),
  isActive: boolean("is_active").default(false),
  variants: jsonb("variants").$type<any[]>().notNull().default([]),
  rules: jsonb("rules").$type<any>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Render jobs
export const renderJobs = pgTable("render_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull().references(() => issues.id),
  templatePackId: varchar("template_pack_id").notNull().references(() => templatePacks.id),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").default(0),
  renderer: text("renderer").notNull().default("prince"), // prince, vivliostyle
  pdfUrl: text("pdf_url"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assets for image management
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalUrl: text("original_url").notNull(),
  processedUrl: text("processed_url"),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  dpi: integer("dpi"),
  status: text("status").default("processing"), // processing, ready, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema validations
export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
});

export const insertTemplatePackSchema = createInsertSchema(templatePacks).omit({
  id: true,
  createdAt: true,
});

export const insertRenderJobSchema = createInsertSchema(renderJobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

// JSON ingestion schema
export const jsonIssueSchema = z.object({
  issue: z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
  }),
  sections: z.array(z.string()),
  articles: z.array(z.object({
    id: z.string(),
    section: z.string(),
    type: z.string(),
    title: z.string(),
    dek: z.string().optional(),
    author: z.string(),
    body_html: z.string(),
    images: z.array(z.object({
      src: z.string(),
      role: z.string(),
      caption: z.string().optional(),
      credit: z.string().optional(),
      focal_point: z.string().optional(),
    })),
  })),
});

// Types
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type TemplatePack = typeof templatePacks.$inferSelect;
export type InsertTemplatePack = z.infer<typeof insertTemplatePackSchema>;
export type RenderJob = typeof renderJobs.$inferSelect;
export type InsertRenderJob = z.infer<typeof insertRenderJobSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type JsonIssue = z.infer<typeof jsonIssueSchema>;
