import puppeteer, { Browser, Page } from 'puppeteer';
import type { GeneratedTemplate } from './template-generator';

export interface PDFOptions {
  format: 'A4' | 'Letter' | 'A3';
  includeBackground: boolean;
  printBackground: boolean;
  displayHeaderFooter: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  scale: number;
  landscape: boolean;
  pageRanges?: string;
  preferCSSPageSize: boolean;
}

export interface RenderResult {
  buffer: Buffer;
  pageCount: number;
  warnings: string[];
  renderTime: number;
}

export class PDFRenderer {
  private browser: Browser | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-translate',
          '--disable-ipc-flooding-protection',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });

      this.isInitialized = true;
      console.log('PDF Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PDF Renderer:', error);
      throw new Error('PDF Renderer initialization failed');
    }
  }

  async renderPDF(
    template: GeneratedTemplate,
    options: Partial<PDFOptions> = {}
  ): Promise<RenderResult> {
    const startTime = Date.now();
    
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const warnings: string[] = [...template.metadata.warnings];

    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      });

      // Configure default PDF options
      const pdfOptions = this.getDefaultPDFOptions(options);

      // Set content and wait for images to load
      await page.setContent(template.html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000,
      });

      // Wait for fonts to load
      await page.evaluateHandle(() => document.fonts.ready);

      // Wait a bit more for any dynamic content
      await page.waitForTimeout(2000);

      // Check for any console errors or warnings
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          warnings.push(`Console error: ${msg.text()}`);
        } else if (msg.type() === 'warning') {
          warnings.push(`Console warning: ${msg.text()}`);
        }
      });

      // Inject additional CSS for print optimization
      await page.addStyleTag({
        content: this.getPrintOptimizationCSS(),
      });

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // Calculate page count (rough estimation from buffer size)
      const pageCount = this.estimatePageCount(pdfBuffer, template.metadata.pageCount);

      const renderTime = Date.now() - startTime;

      console.log(`PDF rendered successfully in ${renderTime}ms, estimated ${pageCount} pages`);

      return {
        buffer: pdfBuffer,
        pageCount,
        warnings,
        renderTime,
      };

    } catch (error) {
      warnings.push(`Rendering error: ${error.message}`);
      throw new Error(`PDF rendering failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  private getDefaultPDFOptions(customOptions: Partial<PDFOptions>): any {
    const defaults: PDFOptions = {
      format: 'A4',
      includeBackground: true,
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      scale: 1,
      landscape: false,
      preferCSSPageSize: true,
    };

    const merged = { ...defaults, ...customOptions };

    return {
      format: merged.format,
      printBackground: merged.printBackground,
      displayHeaderFooter: merged.displayHeaderFooter,
      headerTemplate: merged.headerTemplate,
      footerTemplate: merged.footerTemplate,
      margin: merged.margin,
      scale: merged.scale,
      landscape: merged.landscape,
      pageRanges: merged.pageRanges,
      preferCSSPageSize: merged.preferCSSPageSize,
      timeout: 60000,
    };
  }

  private getPrintOptimizationCSS(): string {
    return `
      /* Additional print optimizations */
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        img {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          max-width: 100% !important;
          height: auto !important;
        }
        
        .avoid-break,
        .hero-image-container,
        .inline-image-container,
        .pullquote {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        
        .page-break {
          page-break-before: always !important;
          break-before: always !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          break-after: avoid !important;
          page-break-after: avoid !important;
        }
        
        p {
          orphans: 2 !important;
          widows: 2 !important;
        }
        
        .article-content {
          orphans: 2 !important;
          widows: 2 !important;
        }
      }
      
      /* Force hardware acceleration for smooth rendering */
      * {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      /* Ensure images are properly loaded */
      img {
        display: block;
        max-width: 100%;
        height: auto;
      }
      
      /* Fix for potential font rendering issues */
      body, .magazine {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: "liga" 1, "kern" 1;
        text-rendering: optimizeLegibility;
      }
    `;
  }

  private estimatePageCount(buffer: Buffer, templateEstimate: number): number {
    // Use template estimate as baseline, but adjust based on buffer size
    const bufferSizeKB = buffer.length / 1024;
    
    // Rough estimation: each page is about 50-200KB depending on images
    const estimatedFromSize = Math.max(1, Math.ceil(bufferSizeKB / 100));
    
    // Use the higher of the two estimates to be safe
    return Math.max(templateEstimate, estimatedFromSize);
  }

  async renderPreviewImages(
    template: GeneratedTemplate,
    pageNumbers: number[] = [1]
  ): Promise<Buffer[]> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const screenshots: Buffer[] = [];

    try {
      await page.setViewport({
        width: 794, // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
        deviceScaleFactor: 2,
      });

      await page.setContent(template.html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000,
      });

      await page.evaluateHandle(() => document.fonts.ready);
      await page.waitForTimeout(1000);

      // Generate screenshots for requested pages
      for (const pageNum of pageNumbers) {
        // Scroll to approximate page position
        const scrollY = (pageNum - 1) * 1123;
        await page.evaluate((y) => window.scrollTo(0, y), scrollY);
        await page.waitForTimeout(500);

        const screenshot = await page.screenshot({
          type: 'png',
          clip: {
            x: 0,
            y: 0,
            width: 794,
            height: 1123,
          },
          captureBeyondViewport: true,
        });

        screenshots.push(screenshot);
      }

      return screenshots;

    } catch (error) {
      throw new Error(`Preview generation failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async validateTemplate(template: GeneratedTemplate): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const errors: string[] = [];
    const warnings: string[] = [...template.metadata.warnings];

    try {
      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(`Console error: ${msg.text()}`);
        } else if (msg.type() === 'warning') {
          warnings.push(`Console warning: ${msg.text()}`);
        }
      });

      // Listen for page errors
      page.on('pageerror', (error) => {
        errors.push(`Page error: ${error.message}`);
      });

      // Set content with shorter timeout for validation
      await page.setContent(template.html, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Check for missing images
      const missingImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src);
      });

      if (missingImages.length > 0) {
        warnings.push(`Missing or broken images: ${missingImages.join(', ')}`);
      }

      // Check for CSS issues
      const cssIssues = await page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        const issues: string[] = [];
        
        try {
          stylesheets.forEach((sheet, index) => {
            try {
              const rules = sheet.cssRules || sheet.rules;
              if (!rules) {
                issues.push(`Stylesheet ${index} has no accessible rules`);
              }
            } catch (e) {
              issues.push(`Stylesheet ${index} access error: ${e.message}`);
            }
          });
        } catch (e) {
          issues.push(`CSS validation error: ${e.message}`);
        }
        
        return issues;
      });

      warnings.push(...cssIssues);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings,
      };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('PDF Renderer closed');
    }
  }

  // Graceful shutdown handler
  setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('Shutting down PDF Renderer...');
      await this.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGUSR2', shutdown); // Nodemon restart
  }
}

// Singleton instance
export const pdfRenderer = new PDFRenderer();

// Initialize graceful shutdown
pdfRenderer.setupGracefulShutdown();