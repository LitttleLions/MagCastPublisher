import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIssueSchema, insertRenderJobSchema, jsonIssueSchema } from "@shared/schema";
import { z } from "zod";

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
      
      // Simulate job processing
      setTimeout(async () => {
        await storage.updateRenderJob(job.id, {
          status: "processing",
          progress: 25,
          startedAt: new Date(),
        });
        
        setTimeout(async () => {
          await storage.updateRenderJob(job.id, {
            status: "processing",
            progress: 75,
          });
          
          setTimeout(async () => {
            await storage.updateRenderJob(job.id, {
              status: "completed",
              progress: 100,
              completedAt: new Date(),
              pdfUrl: `/api/downloads/${job.id}.pdf`,
            });
          }, 2000);
        }, 3000);
      }, 1000);
      
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

  // System Health
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        prince: { status: "online", message: "Renderer operational" },
        assets: { status: "online", message: "Pipeline operational" },
        webhooks: { status: "delayed", message: "Service delayed" },
        queue: { status: "online", message: "3 jobs in queue" },
      };
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
