import { storage } from './storage';
import { TemplateGenerator } from './template-generator';
import { pdfRenderer, type PDFOptions } from './pdf-renderer';
import { htmlRenderer } from './html-renderer';
import type { RenderJob, Issue, Article, Image, TemplatePack } from '@shared/schema';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface RenderRequest {
  jobId: string;
  issueId: string;
  templatePackId: string;
  renderer: 'puppeteer' | 'prince' | 'vivliostyle';
  options?: Partial<PDFOptions>;
}

export interface RenderProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  pdfPath?: string;
  errors?: string[];
  warnings?: string[];
}

export class RenderingService {
  private activeJobs = new Map<string, AbortController>();
  private outputDir = './generated-pdfs';

  constructor() {
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async processRenderJob(request: RenderRequest): Promise<void> {
    const { jobId, issueId, templatePackId, renderer, options } = request;

    console.log(`Starting render job ${jobId} for issue ${issueId}`);

    // Create abort controller for this job
    const abortController = new AbortController();
    this.activeJobs.set(jobId, abortController);

    try {
      // Update job status to processing
      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 10,
        message: 'Loading data...',
      });

      // Check if job was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      // Load data
      const [issue, templatePack, articles, allImages] = await Promise.all([
        this.loadIssue(issueId),
        this.loadTemplatePack(templatePackId),
        this.loadArticles(issueId),
        this.loadImages(issueId),
      ]);

      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 25,
        message: 'Generating layout...',
      });

      // Check if job was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      // Generate template
      const templateGenerator = new TemplateGenerator(templatePack);
      const template = await templateGenerator.generateMagazine(issue, articles, allImages);

      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 50,
        message: 'Optimizing layout decisions...',
      });

      // Log layout decisions for debugging
      console.log(`Layout decisions for job ${jobId}:`, 
        template.metadata.layoutDecisions.map(d => ({
          variant: d.variant.id,
          score: d.score,
          warnings: d.warnings,
        }))
      );

      // Check if job was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 70,
        message: 'Rendering PDF...',
      });

      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 85,
        message: 'Generating output...',
      });

      let outputPath: string;
      let renderTime: number;
      let warnings: string[] = [];
      let decisions = template.metadata.layoutDecisions; // Store layout decisions

      // Try PDF rendering first, with full error handling
      let pdfSuccess = false;
      if (renderer === 'puppeteer') {
        try {
          await pdfRenderer.initialize();
        const validation = await pdfRenderer.validateTemplate(template);
        if (validation.isValid) {
          const renderResult = await pdfRenderer.renderPDF(template, options);

          // Save PDF to disk
          const filename = `${issue.issueId}-${templatePack.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
          const pdfPath = join(this.outputDir, filename);
          writeFileSync(pdfPath, renderResult.buffer);

          outputPath = `/api/downloads/${filename}`;
          renderTime = renderResult.renderTime;
          warnings = renderResult.warnings;
          pdfSuccess = true;

          console.log(`PDF saved to ${pdfPath}, size: ${renderResult.buffer.length} bytes`);
          } else {
            console.log(`Template validation failed: ${validation.errors.join(', ')}`);
          }
        } catch (pdfError) {
          console.log(`PDF rendering failed: ${pdfError.message}`);
        }
      } else {
        console.log('Non-puppeteer renderer requested, skipping PDF generation');
      }

      // Fallback to HTML rendering if PDF failed
      if (!pdfSuccess) {
        console.log('Falling back to HTML preview generation');
        const filename = `${issue.issueId}-${templatePack.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const htmlResult = await htmlRenderer.renderHTML(template, filename);

        outputPath = htmlResult.htmlPath;
        renderTime = htmlResult.renderTime;
        warnings.push('PDF rendering unavailable in this environment, generated HTML preview instead');

        console.log(`HTML preview saved: ${htmlResult.htmlPath}`);
      }

      // Check if job was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      await this.updateJobProgress(jobId, {
        status: 'processing',
        progress: 95,
        message: 'Finalizing...',
      });

      // Complete job
      await this.updateJobProgress(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Rendering completed successfully',
        pdfPath: outputPath,
        warnings,
      });

      console.log(`Render job ${jobId} completed successfully in ${renderTime}ms`);

    } catch (error) {
      console.error(`Render job ${jobId} failed:`, error);

      await this.updateJobProgress(jobId, {
        status: 'failed',
        progress: 0,
        message: 'Rendering failed',
        errors: [error.message],
      });
    } finally {
      // Clean up
      this.activeJobs.delete(jobId);
    }
  }

  async cancelRenderJob(jobId: string): Promise<boolean> {
    const abortController = this.activeJobs.get(jobId);
    if (abortController) {
      abortController.abort();
      this.activeJobs.delete(jobId);

      await this.updateJobProgress(jobId, {
        status: 'failed',
        progress: 0,
        message: 'Job cancelled by user',
        errors: ['Job was cancelled'],
      });

      return true;
    }
    return false;
  }

  private async updateJobProgress(jobId: string, progress: Partial<RenderProgress>): Promise<void> {
    try {
      const updateData: any = {};

      if (progress.status) updateData.status = progress.status;
      if (progress.progress !== undefined) updateData.progress = progress.progress;
      if (progress.message) updateData.errorMessage = progress.message;
      if (progress.pdfPath) updateData.pdfUrl = progress.pdfPath;
      if (progress.errors) updateData.errorMessage = progress.errors.join('; ');
      if (progress.warnings) updateData.warnings = progress.warnings;
      if (progress.metadata) updateData.metadata = progress.metadata; // Add metadata to updateData

      if (progress.status === 'processing' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }

      if (progress.status === 'completed' || progress.status === 'failed') {
        updateData.completedAt = new Date();
      }

      await storage.updateRenderJob(jobId, updateData);
    } catch (error) {
      console.error(`Failed to update job progress for ${jobId}:`, error);
    }
  }

  private async loadIssue(issueId: string): Promise<Issue> {
    const issue = await storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }
    return issue;
  }

  private async loadTemplatePack(templatePackId: string): Promise<TemplatePack> {
    const templatePack = await storage.getTemplatePack(templatePackId);
    if (!templatePack) {
      throw new Error(`Template pack not found: ${templatePackId}`);
    }
    return templatePack;
  }

  private async loadArticles(issueId: string): Promise<Article[]> {
    const articles = await storage.getArticlesByIssue(issueId);
    if (articles.length === 0) {
      // Changed to return empty array instead of throwing error for cases where no articles exist but rendering should still proceed.
      console.warn(`No articles found for issue: ${issueId}`);
      return [];
    }
    return articles;
  }

  private async loadImages(issueId: string): Promise<Image[]> {
    const articles = await storage.getArticlesByIssue(issueId);
    const allImages: Image[] = [];

    for (const article of articles) {
      const images = await storage.getImagesByArticle(article.id);
      allImages.push(...images);
    }

    return allImages;
  }

  async generatePreview(issueId: string, templatePackId: string): Promise<{
    screenshots: Buffer[];
    metadata: any;
  }> {
    const [issue, templatePack, articles, allImages] = await Promise.all([
      this.loadIssue(issueId),
      this.loadTemplatePack(templatePackId),
      this.loadArticles(issueId),
      this.loadImages(issueId),
    ]);

    const templateGenerator = new TemplateGenerator(templatePack);
    const template = await templateGenerator.generateMagazine(issue, articles, allImages);

    await pdfRenderer.initialize();
    const screenshots = await pdfRenderer.renderPreviewImages(template, [1, 2]);

    return {
      screenshots,
      metadata: template.metadata,
    };
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  getActiveJobIds(): string[] {
    return Array.from(this.activeJobs.keys());
  }

  async cleanup(): Promise<void> {
    // Cancel all active jobs
    for (const [jobId, controller] of this.activeJobs) {
      controller.abort();
      await this.updateJobProgress(jobId, {
        status: 'failed',
        progress: 0,
        message: 'Service shutdown',
        errors: ['Service was shut down'],
      });
    }
    this.activeJobs.clear();

    // Close PDF renderer
    await pdfRenderer.close();
  }
}

// Singleton instance
export const renderingService = new RenderingService();