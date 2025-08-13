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
        { id: "A", columns: 2, hero: { min_vh: 36, max_vh: 52 } },
        { id: "B", columns: 3, hero: { min_vh: 30, max_vh: 42 } }
      ],
      rules: { typography: { font_min: 9.5, font_max: 10.5 } },
      createdAt: new Date(),
    };

    const corporatePack: TemplatePack = {
      id: "corporate-pack",
      name: "Corporate Pack",
      description: "Professional business report styling",
      version: "v1.8.2",
      isActive: false,
      variants: [
        { id: "A", columns: 1, hero: { min_vh: 25, max_vh: 35 } },
        { id: "B", columns: 2, hero: { min_vh: 20, max_vh: 30 } }
      ],
      rules: { typography: { font_min: 10, font_max: 11 } },
      createdAt: new Date(),
    };

    const magazinePack: TemplatePack = {
      id: "magazine-pack",
      name: "Magazine Pack",
      description: "Traditional magazine layout with rich typography",
      version: "v3.0.1",
      isActive: false,
      variants: [
        { id: "A", columns: 2, hero: { min_vh: 40, max_vh: 60 } },
        { id: "B", columns: 3, hero: { min_vh: 35, max_vh: 50 } },
        { id: "C", columns: 1, hero: { min_vh: 50, max_vh: 70 } }
      ],
      rules: { typography: { font_min: 9, font_max: 12 } },
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
      ...insertIssue,
      id,
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
      ...insertArticle,
      id,
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
      ...insertImage,
      id,
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
      ...insertPack,
      id,
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
      ...insertJob,
      id,
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
      ...insertAsset,
      id,
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
    // Create the issue
    const issue = await this.createIssue({
      title: jsonData.issue.title,
      issueId: jsonData.issue.id,
      date: jsonData.issue.date,
      sections: jsonData.sections,
      status: "draft",
    });

    // Create articles and images
    for (const articleData of jsonData.articles) {
      const article = await this.createArticle({
        issueId: issue.id,
        articleId: articleData.id,
        section: articleData.section,
        type: articleData.type,
        title: articleData.title,
        dek: articleData.dek || "",
        author: articleData.author,
        bodyHtml: articleData.body_html,
      });

      // Create images for this article
      for (const imageData of articleData.images) {
        await this.createImage({
          articleId: article.id,
          src: imageData.src,
          role: imageData.role,
          caption: imageData.caption || null,
          credit: imageData.credit || null,
          focalPoint: imageData.focal_point || null,
          dpi: null,
          width: null,
          height: null,
        });
      }
    }

    return issue;
  }
}

export const storage = new MemStorage();
