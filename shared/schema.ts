import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Magazine Issues
export const issues = sqliteTable("issues", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  issueId: text("issue_id").notNull().unique(), // e.g., "2025-09"
  date: text("date").notNull(),
  sections: text("sections").notNull().default("[]"), // JSON array
  status: text("status").notNull().default("draft"), // draft, processing, completed, failed
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Articles within issues
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  issueId: text("issue_id").notNull().references(() => issues.id),
  articleId: text("article_id").notNull(), // e.g., "hafen-nacht"
  section: text("section").notNull(),
  type: text("type").notNull(), // feature, reportage, short
  title: text("title").notNull(),
  dek: text("dek"),
  author: text("author").notNull(),
  bodyHtml: text("body_html").notNull(),
  createdAt: text("created_at").notNull(),
});

// Images associated with articles
export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
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
export const templatePacks = sqliteTable("template_packs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(false),
  variants: text("variants").notNull().default("[]"), // JSON string
  rules: text("rules").notNull().default("{}"), // JSON string
  createdAt: text("created_at").notNull(),
});

// Render jobs
export const renderJobs = sqliteTable("render_jobs", {
  id: text("id").primaryKey(),
  issueId: text("issue_id").notNull().references(() => issues.id),
  templatePackId: text("template_pack_id").notNull().references(() => templatePacks.id),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").default(0),
  renderer: text("renderer").notNull().default("prince"), // prince, vivliostyle
  pdfUrl: text("pdf_url"),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string for additional data
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

// Assets for image management
export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  path: text("path"), // File system path
  originalUrl: text("original_url").notNull(),
  processedUrl: text("processed_url"),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  dpi: integer("dpi"),
  status: text("status").default("processing"), // processing, ready, failed
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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

export const assetSchema = z.object({
  id: z.string(),
  filename: z.string(),
  path: z.string().optional(),
  originalUrl: z.string(),
  processedUrl: z.string().optional(),
  size: z.number(),
  mimeType: z.string(),
  status: z.enum(["uploading", "processing", "ready", "failed"]).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  dpi: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertAssetSchema = assetSchema.omit({ id: true, createdAt: true, updatedAt: true });

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