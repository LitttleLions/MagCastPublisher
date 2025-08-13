import { 
  type Issue, type InsertIssue,
  type Article, type InsertArticle,
  type Image, type InsertImage,
  type TemplatePack, type InsertTemplatePack,
  type RenderJob, type InsertRenderJob,
  type Asset, type InsertAsset,
  type JsonIssue
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Issues
  getIssues(): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | undefined>;
  deleteIssue(id: string): Promise<boolean>;

  // Articles
  getArticlesByIssue(issueId: string): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;

  // Images
  getImagesByArticle(articleId: string): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: string): Promise<boolean>;

  // Template Packs
  getTemplatePacks(): Promise<TemplatePack[]>;
  getTemplatePack(id: string): Promise<TemplatePack | undefined>;
  createTemplatePack(pack: InsertTemplatePack): Promise<TemplatePack>;
  updateTemplatePack(id: string, updates: Partial<TemplatePack>): Promise<TemplatePack | undefined>;

  // Render Jobs
  getRenderJobs(): Promise<RenderJob[]>;
  getRenderJob(id: string): Promise<RenderJob | undefined>;
  createRenderJob(job: InsertRenderJob): Promise<RenderJob>;
  updateRenderJob(id: string, updates: Partial<RenderJob>): Promise<RenderJob | undefined>;

  // Assets
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined>;

  // JSON Processing
  processJsonIssue(jsonData: JsonIssue): Promise<Issue>;
}

export class MemStorage implements IStorage {
  private issues: Map<string, Issue> = new Map();
  private articles: Map<string, Article> = new Map();
  private images: Map<string, Image> = new Map();
  private templatePacks: Map<string, TemplatePack> = new Map();
  private renderJobs: Map<string, RenderJob> = new Map();
  private assets: Map<string, Asset> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize with some template packs
    const modernPack: TemplatePack = {
      id: "modern-pack",
      name: "Modern Pack",
      description: "Clean, minimalist design with flexible column layouts",
      version: "v2.1.0",
      isActive: true,
      variants: [
        { 
          id: "modern-clean", 
          columns: 2, 
          hero: { min_vh: 30, max_vh: 50 },
          body: { font_min: 9.5, font_max: 10.5, leading: [1.4, 1.5] },
          pullquote: { allow: true, min_paragraph: 3 }
        },
        { 
          id: "modern-bold", 
          columns: 3, 
          hero: { min_vh: 40, max_vh: 60 },
          body: { font_min: 9.0, font_max: 10.0, leading: [1.3, 1.4] },
          pullquote: { allow: true, min_paragraph: 4 }
        }
      ],
      rules: { 
        typography: { font_min: 9.0, font_max: 10.5, line_height_min: 1.3, line_height_max: 1.5 },
        layout: { max_columns: 3, min_text_length: 150, max_text_length: 1800 },
        images: { hero_required_words: 200, max_images_per_column: 2 }
      },
      createdAt: new Date(),
    };

    const corporatePack: TemplatePack = {
      id: "corporate-pack",
      name: "Corporate Pack",
      description: "Professional business report styling",
      version: "v1.8.2",
      isActive: true,
      variants: [
        { 
          id: "corporate-professional", 
          columns: 2, 
          hero: { min_vh: 25, max_vh: 40 },
          body: { font_min: 10.0, font_max: 11.0, leading: [1.45, 1.55] },
          pullquote: { allow: false, min_paragraph: 0 }
        },
        { 
          id: "corporate-executive", 
          columns: 1,
          body: { font_min: 10.5, font_max: 11.5, leading: [1.5, 1.6] },
          pullquote: { allow: true, min_paragraph: 2 }
        }
      ],
      rules: { 
        typography: { font_min: 10.0, font_max: 11.5, line_height_min: 1.45, line_height_max: 1.6 },
        layout: { max_columns: 2, min_text_length: 200, max_text_length: 2500 },
        images: { hero_required_words: 300, max_images_per_column: 1 }
      },
      createdAt: new Date(),
    };

    const magazinePack: TemplatePack = {
      id: "magazine-pack",
      name: "Magazine Pack",
      description: "Traditional magazine layout with rich typography",
      version: "v3.0.1",
      isActive: false,
      variants: [
        { 
          id: "magazine-editorial", 
          columns: 2, 
          hero: { min_vh: 35, max_vh: 55 },
          body: { font_min: 9.5, font_max: 10.0, leading: [1.35, 1.45] },
          pullquote: { allow: true, min_paragraph: 3 }
        },
        { 
          id: "magazine-feature", 
          columns: 3, 
          hero: { min_vh: 45, max_vh: 65 },
          body: { font_min: 9.0, font_max: 9.5, leading: [1.3, 1.4] },
          pullquote: { allow: true, min_paragraph: 4 }
        },
        { 
          id: "magazine-lifestyle", 
          columns: 2, 
          hero: { min_vh: 50, max_vh: 70 },
          body: { font_min: 9.5, font_max: 10.5, leading: [1.4, 1.5] },
          pullquote: { allow: true, min_paragraph: 2 }
        }
      ],
      rules: { 
        typography: { font_min: 9.0, font_max: 10.5, line_height_min: 1.3, line_height_max: 1.5 },
        layout: { max_columns: 3, min_text_length: 100, max_text_length: 2200 },
        images: { hero_required_words: 150, max_images_per_column: 3 }
      },
      createdAt: new Date(),
    };

    this.templatePacks.set(modernPack.id, modernPack);
    this.templatePacks.set(corporatePack.id, corporatePack);
    this.templatePacks.set(magazinePack.id, magazinePack);
  }

  // Issues
  async getIssues(): Promise<Issue[]> {
    return Array.from(this.issues.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    return this.issues.get(id);
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = randomUUID();
    const now = new Date();
    const issue: Issue = {
      id,
      title: insertIssue.title,
      issueId: insertIssue.issueId,
      date: insertIssue.date,
      sections: insertIssue.sections || [],
      status: insertIssue.status || "draft",
      createdAt: now,
      updatedAt: now,
    };
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;

    const updatedIssue = { ...issue, ...updates, updatedAt: new Date() };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  async deleteIssue(id: string): Promise<boolean> {
    return this.issues.delete(id);
  }

  // Articles
  async getArticlesByIssue(issueId: string): Promise<Article[]> {
    return Array.from(this.articles.values()).filter(article => article.issueId === issueId);
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      id,
      title: insertArticle.title,
      issueId: insertArticle.issueId,
      type: insertArticle.type,
      articleId: insertArticle.articleId,
      section: insertArticle.section,
      dek: insertArticle.dek || null,
      author: insertArticle.author,
      bodyHtml: insertArticle.bodyHtml,
      createdAt: new Date(),
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;

    const updatedArticle = { ...article, ...updates };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  // Images
  async getImagesByArticle(articleId: string): Promise<Image[]> {
    return Array.from(this.images.values()).filter(image => image.articleId === articleId);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = randomUUID();
    const image: Image = {
      id,
      articleId: insertImage.articleId,
      src: insertImage.src,
      role: insertImage.role,
      caption: insertImage.caption || null,
      credit: insertImage.credit || null,
      focalPoint: insertImage.focalPoint || null,
      dpi: insertImage.dpi || null,
      width: insertImage.width || null,
      height: insertImage.height || null,
    };
    this.images.set(id, image);
    return image;
  }

  async deleteImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }

  // Template Packs
  async getTemplatePacks(): Promise<TemplatePack[]> {
    return Array.from(this.templatePacks.values());
  }

  async getTemplatePack(id: string): Promise<TemplatePack | undefined> {
    return this.templatePacks.get(id);
  }

  async createTemplatePack(insertPack: InsertTemplatePack): Promise<TemplatePack> {
    const id = randomUUID();
    const pack: TemplatePack = {
      id,
      name: insertPack.name,
      description: insertPack.description || null,
      version: insertPack.version,
      isActive: insertPack.isActive || false,
      variants: insertPack.variants || [],
      rules: insertPack.rules || {},
      createdAt: new Date(),
    };
    this.templatePacks.set(id, pack);
    return pack;
  }

  async updateTemplatePack(id: string, updates: Partial<TemplatePack>): Promise<TemplatePack | undefined> {
    const pack = this.templatePacks.get(id);
    if (!pack) return undefined;

    const updatedPack = { ...pack, ...updates };
    this.templatePacks.set(id, updatedPack);
    return updatedPack;
  }

  // Render Jobs
  async getRenderJobs(): Promise<RenderJob[]> {
    return Array.from(this.renderJobs.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRenderJob(id: string): Promise<RenderJob | undefined> {
    return this.renderJobs.get(id);
  }

  async createRenderJob(insertJob: InsertRenderJob): Promise<RenderJob> {
    const id = randomUUID();
    const job: RenderJob = {
      id,
      issueId: insertJob.issueId,
      templatePackId: insertJob.templatePackId,
      status: insertJob.status || "queued",
      progress: insertJob.progress || 0,
      renderer: insertJob.renderer || "puppeteer",
      pdfUrl: insertJob.pdfUrl || null,
      errorMessage: insertJob.errorMessage || null,
      successMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.renderJobs.set(id, job);
    return job;
  }

  async updateRenderJob(id: string, updates: Partial<RenderJob>): Promise<RenderJob | undefined> {
    const job = this.renderJobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.renderJobs.set(id, updatedJob);
    return updatedJob;
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const asset: Asset = {
      id,
      filename: insertAsset.filename,
      originalUrl: insertAsset.originalUrl,
      processedUrl: insertAsset.processedUrl || null,
      mimeType: insertAsset.mimeType,
      size: insertAsset.size,
      status: insertAsset.status || "pending",
      dpi: insertAsset.dpi || null,
      width: insertAsset.width || null,
      height: insertAsset.height || null,
      createdAt: new Date(),
    };
    this.assets.set(id, asset);
    return asset;
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;

    const updatedAsset = { ...asset, ...updates };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  // JSON Processing
  async processJsonIssue(jsonData: JsonIssue): Promise<Issue> {
    // Check if issue already exists by issueId (not database id)
    const existingIssue = Array.from(this.issues.values()).find(
      issue => issue.issueId === jsonData.issue.id
    );

    let issue: Issue;
    if (existingIssue) {
      // Update existing issue
      issue = await this.updateIssue(existingIssue.id, {
        title: jsonData.issue.title,
        date: jsonData.issue.date,
        sections: jsonData.sections,
        status: "processing",
      }) || existingIssue;

      // Clear existing articles and images for this issue
      const existingArticles = Array.from(this.articles.values()).filter(a => a.issueId === issue.id);
      for (const article of existingArticles) {
        // Delete images first
        const articleImages = Array.from(this.images.values()).filter(img => img.articleId === article.id);
        articleImages.forEach(img => this.images.delete(img.id));
        // Delete article
        this.articles.delete(article.id);
      }
    } else {
      // Create new issue
      issue = await this.createIssue({
        title: jsonData.issue.title,
        issueId: jsonData.issue.id,
        date: jsonData.issue.date,
        sections: jsonData.sections,
        status: "processing",
      });
    }

    console.log(`Processing JSON for issue ${issue.id} (issueId: ${issue.issueId}) with ${jsonData.articles.length} articles`);

    // Process each article
    for (const articleData of jsonData.articles) {
      const article = await this.createArticle({
        issueId: issue.id, // Use the correct database ID
        articleId: articleData.id,
        section: articleData.section,
        type: articleData.type,
        title: articleData.title,
        dek: articleData.dek,
        author: articleData.author,
        bodyHtml: articleData.body_html,
      });

      console.log(`Created article ${article.id} for issue ${issue.id}`);

      // Process images for this article
      for (const imageData of articleData.images) {
        await this.createImage({
          articleId: article.id,
          src: imageData.src,
          role: imageData.role,
          caption: imageData.caption,
          credit: imageData.credit,
          focalPoint: imageData.focal_point,
        });
      }
    }

    // Mark issue as ready
    const finalIssue = await this.updateIssue(issue.id, { status: "draft" });
    console.log(`Completed processing issue ${issue.id} with ${jsonData.articles.length} articles`);

    return finalIssue || issue;
  }
}

export const storage = new MemStorage();