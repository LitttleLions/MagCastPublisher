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
import sqlite3 from 'sqlite3';

// Initialize the database
const db = new sqlite3.Database(':memory:');

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
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;

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
    this.initializeDatabaseSchema();
    this.initializeSampleData();
  }

  private initializeDatabaseSchema() {
    db.serialize(() => {
      // Drop existing tables to ensure clean schema
      db.run(`DROP TABLE IF EXISTS images`);
      db.run(`DROP TABLE IF EXISTS articles`);
      db.run(`DROP TABLE IF EXISTS render_jobs`);
      db.run(`DROP TABLE IF EXISTS template_pack_variants`);
      db.run(`DROP TABLE IF EXISTS template_pack_rules`);
      db.run(`DROP TABLE IF EXISTS template_packs`);
      db.run(`DROP TABLE IF EXISTS assets`);
      db.run(`DROP TABLE IF EXISTS issues`);

      // Create issues table
      db.run(`
        CREATE TABLE issues (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          issueId TEXT UNIQUE NOT NULL,
          date TEXT NOT NULL,
          sections TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'draft',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Create articles table
      db.run(`
        CREATE TABLE articles (
          id TEXT PRIMARY KEY,
          issueId TEXT NOT NULL,
          articleId TEXT UNIQUE NOT NULL,
          section TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          dek TEXT,
          author TEXT,
          bodyHtml TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (issueId) REFERENCES issues (id)
        )
      `);

      // Create images table
      db.run(`
        CREATE TABLE images (
          id TEXT PRIMARY KEY,
          articleId TEXT NOT NULL,
          src TEXT NOT NULL,
          role TEXT,
          caption TEXT,
          credit TEXT,
          focalPoint TEXT,
          dpi INTEGER,
          width INTEGER,
          height INTEGER,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (articleId) REFERENCES articles (id)
        )
      `);

      // Create template_packs table
      db.run(`
        CREATE TABLE template_packs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          version TEXT NOT NULL,
          isActive BOOLEAN NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL
        )
      `);

      // Create template_pack_variants table
      db.run(`
        CREATE TABLE template_pack_variants (
          id TEXT PRIMARY KEY,
          templatePackId TEXT NOT NULL,
          variantId TEXT NOT NULL,
          columns INTEGER NOT NULL,
          hero TEXT,
          body TEXT,
          pullquote TEXT,
          FOREIGN KEY (templatePackId) REFERENCES template_packs (id)
        )
      `);

      // Create template_pack_rules table
      db.run(`
        CREATE TABLE template_pack_rules (
          templatePackId TEXT PRIMARY KEY,
          typography TEXT,
          layout TEXT,
          images TEXT,
          FOREIGN KEY (templatePackId) REFERENCES template_packs (id)
        )
      `);

      // Create render_jobs table
      db.run(`
        CREATE TABLE render_jobs (
          id TEXT PRIMARY KEY,
          issueId TEXT NOT NULL,
          templatePackId TEXT NOT NULL,
          renderer TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          progress INTEGER DEFAULT 0,
          pdfUrl TEXT,
          errorMessage TEXT,
          successMessage TEXT,
          metadata TEXT,
          startedAt TEXT,
          completedAt TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (issueId) REFERENCES issues (id),
          FOREIGN KEY (templatePackId) REFERENCES template_packs (id)
        )
      `);

      // Create assets table
      db.run(`
        CREATE TABLE assets (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          path TEXT,
          originalUrl TEXT NOT NULL,
          processedUrl TEXT,
          size INTEGER NOT NULL,
          mimeType TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'ready',
          width INTEGER,
          height INTEGER,
          dpi INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);
    });
  }

  private initializeSampleData() {
    // Initialize with some template packs
    const modernPack: TemplatePack = {
      id: "modern-pack",
      name: "Modern Pack",
      description: "Clean, minimalist design with flexible column layouts",
      version: "v2.1.0",
      isActive: true,
      variants: JSON.stringify([
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
      ]),
      rules: JSON.stringify({
        typography: { font_min: 9.0, font_max: 10.5, line_height_min: 1.3, line_height_max: 1.5 },
        layout: { max_columns: 3, min_text_length: 150, max_text_length: 1800 },
        images: { hero_required_words: 200, max_images_per_column: 2 }
      }),
      createdAt: new Date().toISOString(),
    };

    const corporatePack: TemplatePack = {
      id: "corporate-pack",
      name: "Corporate Pack",
      description: "Professional business report styling",
      version: "v1.8.2",
      isActive: true,
      variants: JSON.stringify([
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
      ]),
      rules: JSON.stringify({
        typography: { font_min: 10.0, font_max: 11.5, line_height_min: 1.45, line_height_max: 1.6 },
        layout: { max_columns: 2, min_text_length: 200, max_text_length: 2500 },
        images: { hero_required_words: 300, max_images_per_column: 1 }
      }),
      createdAt: new Date().toISOString(),
    };

    const magazinePack: TemplatePack = {
      id: "magazine-pack",
      name: "Magazine Pack",
      description: "Traditional magazine layout with rich typography",
      version: "v3.0.1",
      isActive: false,
      variants: JSON.stringify([
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
      ]),
      rules: JSON.stringify({
        typography: { font_min: 9.0, font_max: 10.5, line_height_min: 1.3, line_height_max: 1.5 },
        layout: { max_columns: 3, min_text_length: 100, max_text_length: 2200 },
        images: { hero_required_words: 150, max_images_per_column: 3 }
      }),
      createdAt: new Date().toISOString(),
    };

    // Insert sample data into the database
    const insertTemplatePack = async (pack: TemplatePack) => {
      return new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO template_packs (id, name, description, version, isActive, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [pack.id, pack.name, pack.description, pack.version, pack.isActive ? 1 : 0, pack.createdAt], function(err) {
          if (err) {
            console.error("Error inserting template pack:", err);
            return reject(err);
          }
          const packId = this.lastID; // This is not the ID of the pack, but the row ID. We use pack.id directly.

          // Insert variants
          const variants = JSON.parse(pack.variants);
          variants.forEach((variant: any) => {
            db.run(`
              INSERT INTO template_pack_variants (id, templatePackId, variantId, columns, hero, body, pullquote)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [randomUUID(), pack.id, variant.id, variant.columns, JSON.stringify(variant.hero), JSON.stringify(variant.body), JSON.stringify(variant.pullquote)], (err) => {
              if (err) console.error("Error inserting template pack variant:", err);
            });
          });

          // Insert rules
          const rules = JSON.parse(pack.rules);
          db.run(`
            INSERT INTO template_pack_rules (templatePackId, typography, layout, images)
            VALUES (?, ?, ?, ?)
          `, [pack.id, JSON.stringify(rules.typography), JSON.stringify(rules.layout), JSON.stringify(rules.images)], (err) => {
            if (err) console.error("Error inserting template pack rules:", err);
          });

          resolve();
        });
      });
    };

    Promise.all([
      insertTemplatePack(modernPack),
      insertTemplatePack(corporatePack),
      insertTemplatePack(magazinePack)
    ]).then(() => console.log("Sample template packs inserted.")).catch(console.error);
  }

  // Issues
  async getIssues(): Promise<Issue[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM issues ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
          console.error("Error fetching issues:", err);
          reject(err);
        } else {
          const issues = (rows as Issue[]).map(issue => ({
            ...issue,
            sections: typeof issue.sections === 'string' ? JSON.parse(issue.sections) : issue.sections
          }));
          resolve(issues);
        }
      });
    });
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM issues WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching issue:", err);
          reject(err);
        } else {
          if (row) {
            const issue = row as Issue;
            issue.sections = typeof issue.sections === 'string' ? JSON.parse(issue.sections) : issue.sections;
            resolve(issue);
          } else {
            resolve(undefined);
          }
        }
      });
    });
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const issue: Issue = {
        id,
        title: insertIssue.title,
        issueId: insertIssue.issueId,
        date: insertIssue.date,
        sections: JSON.stringify(insertIssue.sections || []),
        status: insertIssue.status || "draft",
        createdAt: now,
        updatedAt: now,
      };

      db.run(`
        INSERT INTO issues (id, title, issueId, date, sections, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [issue.id, issue.title, issue.issueId, issue.date, issue.sections, issue.status, issue.createdAt, issue.updatedAt], function(err) {
        if (err) {
          console.error("Error creating issue:", err);
          reject(err);
        } else {
          resolve(issue);
        }
      });
    });
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | undefined> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const values = updateFields.map(key => updates[key as keyof Issue]);
      const setClause = updateFields.map(key => `${key} = ?`).join(', ');

      db.run(`
        UPDATE issues SET ${setClause}, updatedAt = ? WHERE id = ?
      `, [...values, now, id], function(err) {
        if (err) {
          console.error("Error updating issue:", err);
          reject(err);
        } else if (this.changes === 0) {
          resolve(undefined);
        } else {
          db.get("SELECT * FROM issues WHERE id = ?", [id], (err, row) => {
            if (err) {
              console.error("Error fetching updated issue:", err);
              reject(err);
            } else {
              resolve(row as Issue);
            }
          });
        }
      });
    });
  }

  async deleteIssue(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM issues WHERE id = ?", [id], function(err) {
        if (err) {
          console.error("Error deleting issue:", err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Articles
  async getArticlesByIssue(issueId: string): Promise<Article[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM articles WHERE issueId = ? ORDER BY createdAt DESC", [issueId], (err, rows) => {
        if (err) {
          console.error("Error fetching articles by issue:", err);
          reject(err);
        } else {
          resolve(rows as Article[]);
        }
      });
    });
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM articles WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching article:", err);
          reject(err);
        } else {
          resolve(row as Article);
        }
      });
    });
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const now = new Date().toISOString();
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
        createdAt: now,
      };

      db.run(`
        INSERT INTO articles (id, issueId, articleId, section, type, title, dek, author, bodyHtml, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [article.id, article.issueId, article.articleId, article.section, article.type, article.title, article.dek, article.author, article.bodyHtml, article.createdAt], function(err) {
        if (err) {
          console.error("Error creating article:", err);
          reject(err);
        } else {
          resolve(article);
        }
      });
    });
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const values = updateFields.map(key => updates[key as keyof Article]);
      const setClause = updateFields.map(key => `${key} = ?`).join(', ');

      db.run(`
        UPDATE articles SET ${setClause} WHERE id = ?
      `, [...values, id], function(err) {
        if (err) {
          console.error("Error updating article:", err);
          reject(err);
        } else if (this.changes === 0) {
          resolve(undefined);
        } else {
          db.get("SELECT * FROM articles WHERE id = ?", [id], (err, row) => {
            if (err) {
              console.error("Error fetching updated article:", err);
              reject(err);
            } else {
              resolve(row as Article);
            }
          });
        }
      });
    });
  }

  async deleteArticle(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // First, delete associated images
      db.run("DELETE FROM images WHERE articleId = ?", [id], function(err) {
        if (err) {
          console.error("Error deleting images for article:", err);
          return reject(err);
        }
        // Then, delete the article
        db.run("DELETE FROM articles WHERE id = ?", [id], function(err) {
          if (err) {
            console.error("Error deleting article:", err);
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    });
  }

  // Images
  async getImagesByArticle(articleId: string): Promise<Image[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM images WHERE articleId = ? ORDER BY createdAt DESC", [articleId], (err, rows) => {
        if (err) {
          console.error("Error fetching images by article:", err);
          reject(err);
        } else {
          resolve(rows as Image[]);
        }
      });
    });
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const now = new Date().toISOString();
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

      db.run(`
        INSERT INTO images (id, articleId, src, role, caption, credit, focalPoint, dpi, width, height, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [image.id, image.articleId, image.src, image.role, image.caption, image.credit, image.focalPoint, image.dpi, image.width, image.height, now], function(err) {
        if (err) {
          console.error("Error creating image:", err);
          reject(err);
        } else {
          resolve(image);
        }
      });
    });
  }

  async deleteImage(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM images WHERE id = ?", [id], function(err) {
        if (err) {
          console.error("Error deleting image:", err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Template Packs
  async getTemplatePacks(): Promise<TemplatePack[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM template_packs", [], (err, rows) => {
        if (err) {
          console.error("Error fetching template packs:", err);
          return reject(err);
        }
        const packs = rows as TemplatePack[];
        const detailedPacks: Promise<TemplatePack>[] = packs.map(async (pack) => {
          const variants = await new Promise<any[]>((resolveVariant, rejectVariant) => {
            db.all("SELECT * FROM template_pack_variants WHERE templatePackId = ?", [pack.id], (errVariant, rowsVariant) => {
              if (errVariant) rejectVariant(errVariant);
              else resolveVariant(rowsVariant.map((rv: any) => ({ ...rv, hero: JSON.parse(rv.hero), body: JSON.parse(rv.body), pullquote: JSON.parse(rv.pullquote) })));
            });
          });
          const rules = await new Promise<any>((resolveRule, rejectRule) => {
            db.get("SELECT * FROM template_pack_rules WHERE templatePackId = ?", [pack.id], (errRule, rowRule) => {
              if (errRule) rejectRule(errRule);
              else resolveRule(rowRule ? { typography: JSON.parse(rowRule.typography), layout: JSON.parse(rowRule.layout), images: JSON.parse(rowRule.images) } : {});
            });
          });
          return { ...pack, variants, rules };
        });
        Promise.all(detailedPacks).then(resolve).catch(reject);
      });
    });
  }


  async getTemplatePack(id: string): Promise<TemplatePack | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM template_packs WHERE id = ?", [id], async (err, packRow) => {
        if (err) {
          console.error("Error fetching template pack:", err);
          return reject(err);
        }
        if (!packRow) {
          return resolve(undefined);
        }

        const pack = packRow as TemplatePack;

        const variants = await new Promise<any[]>((resolveVariant, rejectVariant) => {
          db.all("SELECT * FROM template_pack_variants WHERE templatePackId = ?", [pack.id], (errVariant, rowsVariant) => {
            if (errVariant) rejectVariant(errVariant);
            else resolveVariant(rowsVariant.map((rv: any) => ({ ...rv, hero: JSON.parse(rv.hero), body: JSON.parse(rv.body), pullquote: JSON.parse(rv.pullquote) })));
          });
        });

        const rules = await new Promise<any>((resolveRule, rejectRule) => {
          db.get("SELECT * FROM template_pack_rules WHERE templatePackId = ?", [pack.id], (errRule, rowRule) => {
            if (errRule) rejectRule(errRule);
            else resolveRule(rowRule ? { typography: JSON.parse(rowRule.typography), layout: JSON.parse(rowRule.layout), images: JSON.parse(rowRule.images) } : {});
          });
        });

        resolve({ ...pack, variants, rules });
      });
    });
  }


  async createTemplatePack(insertPack: InsertTemplatePack): Promise<TemplatePack> {
    return new Promise(async (resolve, reject) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const pack: TemplatePack = {
        id,
        name: insertPack.name,
        description: insertPack.description || null,
        version: insertPack.version,
        isActive: insertPack.isActive || false,
        variants: insertPack.variants || [],
        rules: insertPack.rules || {},
        createdAt: now,
      };

      db.run(`
        INSERT INTO template_packs (id, name, description, version, isActive, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [pack.id, pack.name, pack.description, pack.version, pack.isActive ? 1 : 0, pack.createdAt], (err) => {
        if (err) {
          console.error("Error creating template pack:", err);
          return reject(err);
        }

        // Insert variants
        pack.variants.forEach(variant => {
          db.run(`
            INSERT INTO template_pack_variants (id, templatePackId, variantId, columns, hero, body, pullquote)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [randomUUID(), pack.id, variant.id, variant.columns, JSON.stringify(variant.hero), JSON.stringify(variant.body), JSON.stringify(variant.pullquote)], (err) => {
            if (err) console.error("Error inserting template pack variant:", err);
          });
        });

        // Insert rules
        db.run(`
          INSERT INTO template_pack_rules (templatePackId, typography, layout, images)
          VALUES (?, ?, ?, ?)
        `, [pack.id, JSON.stringify(pack.rules.typography), JSON.stringify(pack.rules.layout), JSON.stringify(pack.rules.images)], (err) => {
          if (err) console.error("Error inserting template pack rules:", err);
        });

        resolve(pack);
      });
    });
  }

  async updateTemplatePack(id: string, updates: Partial<TemplatePack>): Promise<TemplatePack | undefined> {
    return new Promise(async (resolve, reject) => {
      const updateFields = Object.keys(updates).filter(key => key !== 'id' && key !== 'variants' && key !== 'rules');
      const values = updateFields.map(key => updates[key as keyof TemplatePack]);
      const setClause = updateFields.map(key => `${key} = ?`).join(', ');

      let query = `UPDATE template_packs SET ${setClause} WHERE id = ?`;
      if (updateFields.length === 0) {
        query = `SELECT * FROM template_packs WHERE id = ?`; // If no fields to update, just select
      }

      db.run(query, [...values, id], async function(err) {
        if (err) {
          console.error("Error updating template pack:", err);
          return reject(err);
        }
        if (this.changes === 0 && updateFields.length > 0) {
          return resolve(undefined);
        }

        // Handle variants update
        if (updates.variants) {
          await new Promise<void>((resolveVariant, rejectVariant) => {
            db.run("DELETE FROM template_pack_variants WHERE templatePackId = ?", [id], async (errDeleteVariant) => {
              if (errVariant) rejectVariant(errVariant);
              else {
                for (const variant of updates.variants!) {
                  await new Promise<void>((resolveInsertVariant, rejectInsertVariant) => {
                    db.run(`
                      INSERT INTO template_pack_variants (id, templatePackId, variantId, columns, hero, body, pullquote)
                      VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [randomUUID(), id, variant.id, variant.columns, JSON.stringify(variant.hero), JSON.stringify(variant.body), JSON.stringify(variant.pullquote)], (errInsertVariant) => {
                      if (errInsertVariant) rejectInsertVariant(errInsertVariant);
                      else resolveInsertVariant();
                    });
                  });
                }
                resolveVariant();
              }
            });
          });
        }

        // Handle rules update
        if (updates.rules) {
          await new Promise<void>((resolveRule, rejectRule) => {
            db.run("DELETE FROM template_pack_rules WHERE templatePackId = ?", [id], (errDeleteRule) => {
              if (errDeleteRule) rejectRule(errDeleteRule);
              else {
                db.run(`
                  INSERT INTO template_pack_rules (templatePackId, typography, layout, images)
                  VALUES (?, ?, ?, ?)
                `, [id, JSON.stringify(updates.rules.typography), JSON.stringify(updates.rules.layout), JSON.stringify(updates.rules.images)], (errInsertRule) => {
                  if (errInsertRule) rejectRule(errInsertRule);
                  else resolveRule();
                });
              }
            });
          });
        }

        // Fetch the updated pack
        resolve(await storage.getTemplatePack(id));
      });
    });
  }

  // Render Jobs
  async getRenderJobs(): Promise<RenderJob[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM render_jobs ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
          console.error("Error fetching render jobs:", err);
          reject(err);
        } else {
          resolve(rows as RenderJob[]);
        }
      });
    });
  }

  async getRenderJob(id: string): Promise<RenderJob | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM render_jobs WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching render job:", err);
          reject(err);
        } else {
          resolve(row as RenderJob);
        }
      });
    });
  }

  async createRenderJob(insertJob: InsertRenderJob): Promise<RenderJob> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const job: RenderJob = {
        id,
        issueId: insertJob.issueId,
        templatePackId: insertJob.templatePackId,
        status: insertJob.status || "queued",
        progress: insertJob.progress || 0,
        renderer: insertJob.renderer || "puppeteer",
        pdfUrl: insertJob.pdfUrl || null,
        errorMessage: insertJob.errorMessage || null,
        successMessage: insertJob.successMessage || null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
      };

      db.run(`
        INSERT INTO render_jobs (id, issueId, templatePackId, renderer, status, progress, createdAt, pdfUrl, errorMessage, successMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [job.id, job.issueId, job.templatePackId, job.renderer, job.status, job.progress, job.createdAt, job.pdfUrl, job.errorMessage, job.successMessage], function(err) {
        if (err) {
          console.error("Error creating render job:", err);
          reject(err);
        } else {
          resolve(job);
        }
      });
    });
  }

  async updateRenderJob(id: string, updates: Partial<RenderJob>): Promise<RenderJob | undefined> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const values = updateFields.map(key => updates[key as keyof RenderJob]);
      const setClause = updateFields.map(key => `${key} = ?`).join(', ');

      db.run(`
        UPDATE render_jobs SET ${setClause} WHERE id = ?
      `, [...values, id], function(err) {
        if (err) {
          console.error("Error updating render job:", err);
          reject(err);
        } else if (this.changes === 0) {
          resolve(undefined);
        } else {
          db.get("SELECT * FROM render_jobs WHERE id = ?", [id], (err, row) => {
            if (err) {
              console.error("Error fetching updated render job:", err);
              reject(err);
            } else {
              resolve(row as RenderJob);
            }
          });
        }
      });
    });
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM assets ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
          console.error("Error fetching assets:", err);
          reject(err);
        } else {
          resolve(rows as Asset[]);
        }
      });
    });
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM assets WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching asset:", err);
          reject(err);
        } else {
          resolve(row as Asset);
        }
      });
    });
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    return new Promise((resolve, reject) => {
      const assetId = randomUUID();
      const now = new Date().toISOString();

      db.run(`
        INSERT INTO assets (
          id, filename, path, originalUrl, processedUrl, size, mimeType,
          status, width, height, dpi, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        assetId, insertAsset.filename, insertAsset.path, insertAsset.originalUrl, insertAsset.processedUrl,
        insertAsset.size, insertAsset.mimeType, insertAsset.status || "ready",
        insertAsset.width, insertAsset.height, insertAsset.dpi, insertAsset.createdAt || now, now
      ], function(err) {
        if (err) {
          console.error("Error creating asset:", err);
          reject(err);
        } else {
          resolve({
            id: assetId,
            filename: insertAsset.filename,
            path: insertAsset.path,
            originalUrl: insertAsset.originalUrl,
            processedUrl: insertAsset.processedUrl,
            size: insertAsset.size,
            mimeType: insertAsset.mimeType,
            status: insertAsset.status || "ready",
            width: insertAsset.width,
            height: insertAsset.height,
            dpi: insertAsset.dpi,
            createdAt: insertAsset.createdAt || now,
            updatedAt: now
          } as Asset);
        }
      });
    });
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    return new Promise((resolve, reject) => {
      const updatedAt = new Date().toISOString();
      const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt');
      const values = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt').map(key => updates[key as keyof Asset]);

      if (fields.length === 0) {
        return resolve(undefined); // Nothing to update
      }

      db.run(`
        UPDATE assets SET ${fields.join(', ')}, updatedAt = ? WHERE id = ?
      `, [...values, updatedAt, id], function(err) {
        if (err) {
          console.error("Error updating asset:", err);
          reject(err);
        } else if (this.changes === 0) {
          resolve(undefined);
        } else {
          storage.getAsset(id).then(resolve).catch(reject);
        }
      });
    });
  }

  async deleteAsset(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM assets WHERE id = ?", [id], function(err) {
        if (err) {
          console.error("Error deleting asset:", err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // JSON Processing
  async processJsonIssue(jsonData: JsonIssue): Promise<Issue> {
    // Check if issue already exists by issueId (not database id)
    const existingIssue = await this.getIssueByIssueId(jsonData.issue.id);

    let issue: Issue;
    if (existingIssue) {
      // Update existing issue
      issue = await this.updateIssue(existingIssue.id, {
        title: jsonData.issue.title,
        date: jsonData.issue.date,
        sections: JSON.stringify(jsonData.sections),
        status: "processing",
      }) || existingIssue;

      // Clear existing articles and images for this issue
      const existingArticles = await this.getArticlesByIssue(issue.id);
      for (const article of existingArticles) {
        await this.deleteArticle(article.id);
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

  private async getIssueByIssueId(issueId: string): Promise<Issue | undefined> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM issues WHERE issueId = ?", [issueId], (err, row) => {
        if (err) {
          console.error("Error fetching issue by issueId:", err);
          reject(err);
        } else {
          resolve(row as Issue);
        }
      });
    });
  }
}

export const storage = new MemStorage();