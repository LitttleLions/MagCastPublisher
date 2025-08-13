import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIssueSchema, insertRenderJobSchema, jsonIssueSchema } from "@shared/schema";
import { renderingService } from "./rendering-service";
import { z } from "zod";
import { join } from "path";
import { existsSync } from "fs";
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Issues
  app.get("/api/issues", async (req, res) => {
    try {
      const issues = await storage.getIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  app.post("/api/issues", async (req, res) => {
    try {
      const validatedData = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(validatedData);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  app.patch("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.updateIssue(req.params.id, req.body);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to update issue" });
    }
  });

  app.delete("/api/issues/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteIssue(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete issue" });
    }
  });

  // Articles
  app.get("/api/issues/:issueId/articles", async (req, res) => {
    try {
      const articles = await storage.getArticlesByIssue(req.params.issueId);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Images
  app.get("/api/articles/:articleId/images", async (req, res) => {
    try {
      const images = await storage.getImagesByArticle(req.params.articleId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Template Packs
  app.get("/api/template-packs", async (req, res) => {
    try {
      const packs = await storage.getTemplatePacks();
      res.json(packs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template packs" });
    }
  });

  app.patch("/api/template-packs/:id", async (req, res) => {
    try {
      const pack = await storage.updateTemplatePack(req.params.id, req.body);
      if (!pack) {
        return res.status(404).json({ error: "Template pack not found" });
      }
      res.json(pack);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template pack" });
    }
  });

  // Render Jobs
  app.get("/api/render-jobs", async (req, res) => {
    try {
      const jobs = await storage.getRenderJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch render jobs" });
    }
  });

  app.post("/api/render-jobs", async (req, res) => {
    try {
      const validatedData = insertRenderJobSchema.parse(req.body);
      const job = await storage.createRenderJob(validatedData);

      // Start real rendering process
      renderingService.processRenderJob({
        jobId: job.id,
        issueId: job.issueId,
        templatePackId: job.templatePackId,
        renderer: job.renderer as any,
      }).catch(error => {
        console.error(`Background render job ${job.id} failed:`, error);
      });

      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create render job" });
    }
  });

  app.patch("/api/render-jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateRenderJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: "Render job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to update render job" });
    }
  });

  // JSON Processing
  app.post("/api/process-json", async (req, res) => {
    try {
      const validatedData = jsonIssueSchema.parse(req.body);
      const issue = await storage.processJsonIssue(validatedData);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid JSON structure", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process JSON" });
    }
  });

  // Assets
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  // Ensure upload directory exists
  const uploadDir = './uploads/assets';
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Nur Bilddateien sind erlaubt (JPEG, PNG, GIF, SVG, WebP)'));
      }
    }
  });

  app.post("/api/assets/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }

      // Get image dimensions and metadata
      const sharp = require('sharp');
      let metadata = {};
      try {
        const imageInfo = await sharp(req.file.path).metadata();
        metadata = {
          width: imageInfo.width,
          height: imageInfo.height,
          dpi: imageInfo.density || 72
        };
      } catch (error) {
        console.warn('Could not extract image metadata:', error);
      }

      const asset = {
        filename: req.file.originalname,
        path: req.file.path,
        originalUrl: `/api/assets/serve/${req.file.filename}`,
        processedUrl: `/api/assets/serve/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
        status: "ready" as const,
        ...metadata
      };

      const savedAsset = await storage.createAsset(asset);
      res.status(201).json(savedAsset);
    } catch (error) {
      console.error('Asset upload error:', error);
      res.status(500).json({ error: error.message || "Upload fehlgeschlagen" });
    }
  });

  // Serve asset files
  app.get("/api/assets/serve/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const assetPath = path.join(uploadDir, filename);
      
      // Security check - ensure file is within upload directory
      const normalizedPath = path.normalize(assetPath);
      const normalizedUploadDir = path.normalize(uploadDir);
      
      if (!normalizedPath.startsWith(normalizedUploadDir)) {
        return res.status(403).json({ error: "Zugriff verweigert" });
      }

      res.sendFile(path.resolve(assetPath), (err) => {
        if (err) {
          res.status(404).json({ error: "Datei nicht gefunden" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Fehler beim Laden der Datei" });
    }
  });

  // Update asset metadata
  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.updateAsset(req.params.id, req.body);
      if (!asset) {
        return res.status(404).json({ error: "Asset nicht gefunden" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Fehler beim Aktualisieren des Assets" });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset nicht gefunden" });
      }

      // Delete file from filesystem
      if (asset.path) {
        try {
          await fs.unlink(asset.path);
        } catch (error) {
          console.warn('Could not delete file:', error);
        }
      }

      const deleted = await storage.deleteAsset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Asset nicht gefunden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Fehler beim Löschen des Assets" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const issues = await storage.getIssues();
      const jobs = await storage.getRenderJobs();
      const packs = await storage.getTemplatePacks();

      const stats = {
        activeIssues: issues.filter(i => i.status !== "completed").length,
        renderJobs: jobs.length,
        pdfsGenerated: jobs.filter(j => j.status === "completed").length,
        templatePacks: packs.length,
        queuedJobs: jobs.filter(j => j.status === "queued").length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Cancel render job
  app.post("/api/render-jobs/:id/cancel", async (req, res) => {
    try {
      const cancelled = await renderingService.cancelRenderJob(req.params.id);
      if (cancelled) {
        res.json({ message: "Job cancelled successfully" });
      } else {
        res.status(404).json({ error: "Job not found or not cancellable" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel render job" });
    }
  });

  // Generate HTML preview instead of screenshots for now
  app.post("/api/preview", async (req, res) => {
    try {
      const { issueId, templatePackId } = req.body;
      if (!issueId || !templatePackId) {
        return res.status(400).json({ error: "issueId and templatePackId are required" });
      }

      // For now, generate HTML preview instead of PDF/screenshots
      const [issue, templatePack, articles, allImages] = await Promise.all([
        storage.getIssue(issueId),
        storage.getTemplatePack(templatePackId),
        storage.getArticlesByIssue(issueId),
        storage.getImagesByArticle("dummy") // Get all images for issue
      ]);

      if (!issue || !templatePack) {
        return res.status(404).json({ error: "Issue or template pack not found" });
      }

      const { TemplateGenerator } = await import('./template-generator');
      const templateGenerator = new TemplateGenerator(templatePack);
      const template = await templateGenerator.generateMagazine(issue, articles, allImages);

      res.json({
        html: template.html,
        css: template.css,
        metadata: template.metadata,
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to generate preview: ${error.message}` });
    }
  });

  // Download generated PDFs
  app.get("/api/downloads/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const pdfPath = join("./generated-pdfs", filename);

      if (!existsSync(pdfPath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const isPdf = filename.endsWith('.pdf');
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(pdfPath, { root: "." });
    } catch (error) {
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Serve HTML preview files
  app.get("/api/preview-files/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const htmlPath = join("./generated-previews", filename);

      if (!existsSync(htmlPath)) {
        return res.status(404).json({ error: "Preview not found" });
      }

      res.setHeader('Content-Type', 'text/html');
      res.sendFile(htmlPath, { root: "." });
    } catch (error) {
      res.status(500).json({ error: "Failed to serve preview" });
    }
  });

  // System Health
  app.get("/api/health", async (req, res) => {
    try {
      const activeJobs = renderingService.getActiveJobCount();
      const health = {
        prince: { status: "online", message: "PDF Renderer operational" },
        assets: { status: "online", message: "Pipeline operational" },
        webhooks: { status: "delayed", message: "Service delayed" },
        queue: { status: "online", message: `${activeJobs} active jobs` },
      };
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health status" });
    }
  });

  // Layout Engine stats endpoint
  app.get('/api/layout-engine/stats', async (req, res) => {
    try {
      // Get real data from database
      const jobs = await storage.getRenderJobs();
      const completedJobs = jobs.filter(j => j.status === 'completed');
      
      // Calculate real statistics
      const totalDecisions = completedJobs.length;
      const averageScore = totalDecisions > 0 
        ? Math.round(completedJobs.reduce((sum, job) => sum + (job.metadata?.score || 85), 0) / totalDecisions)
        : 0;
      
      const lastJob = completedJobs.sort((a, b) => 
        new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
      )[0];
      
      const lastDecisionTime = lastJob 
        ? new Date(lastJob.completedAt || lastJob.createdAt).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "Keine Entscheidungen vorhanden";

      // Get recent decisions from completed jobs
      const recentDecisions = await Promise.all(
        completedJobs.slice(0, 10).map(async (job) => {
          const articles = await storage.getArticlesByIssue(job.issueId);
          const mainArticle = articles[0];
          
          return {
            articleId: mainArticle?.id || job.id,
            articleTitle: mainArticle?.title || "Unbekannter Artikel",
            variant: {
              id: job.templatePackId,
              columns: 2, // Default
            },
            fontSize: job.metadata?.fontSize || 10.0,
            columnCount: job.metadata?.columns || 2,
            score: job.metadata?.score || 85,
            warnings: job.metadata?.warnings || [],
            timestamp: new Date(job.completedAt || job.createdAt).toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          };
        })
      );

      const stats = {
        totalDecisions,
        averageScore,
        lastDecisionTime,
        activeRules: {
          typography: {
            font_min: 9.5,
            font_max: 10.5,
            line_height_min: 1.35,
            line_height_max: 1.5,
          },
          layout: {
            max_columns: 3,
            min_text_length: 100,
            max_text_length: 2000,
          },
          images: {
            hero_required_words: 200,
            max_images_per_column: 2,
          },
        },
        recentDecisions,
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching layout engine stats:', error);
      res.status(500).json({ error: 'Failed to fetch layout engine stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}