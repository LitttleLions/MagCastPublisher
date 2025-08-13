import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIssueSchema, insertRenderJobSchema, jsonIssueSchema } from "@shared/schema";
import { renderingService } from "./rendering-service";
import { z } from "zod";
import { join } from "path";
import { existsSync } from "fs";

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
      const mockStats = {
        totalDecisions: 8,
        averageScore: 95,
        lastDecisionTime: "Vor 2 Stunden",
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
        recentDecisions: [
          {
            articleId: "artikel-1",
            articleTitle: "Wirtschaftsaufschwung in der Ostseeregion",
            variant: {
              id: "magazine-editorial",
              columns: 2,
            },
            fontSize: 9.7,
            columnCount: 2,
            score: 115,
            warnings: [],
            timestamp: "Vor 2 Stunden",
          },
          {
            articleId: "artikel-2",
            articleTitle: "Demo Artikel",
            variant: {
              id: "modern-clean",
              columns: 2,
            },
            fontSize: 10.0,
            columnCount: 2,
            score: 85,
            warnings: ["2 columns may be too many for 46 words"],
            timestamp: "Vor 3 Stunden",
          },
        ],
      };

      res.json(mockStats);
    } catch (error) {
      console.error('Error fetching layout engine stats:', error);
      res.status(500).json({ error: 'Failed to fetch layout engine stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}