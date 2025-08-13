import type { Article, Image, Issue, TemplatePack } from "@shared/schema";
import { LayoutEngine, type LayoutDecision } from "./layout-engine";

export interface GeneratedTemplate {
  html: string;
  css: string;
  metadata: {
    pageCount: number;
    layoutDecisions: LayoutDecision[];
    warnings: string[];
  };
}

export class TemplateGenerator {
  private layoutEngine: LayoutEngine;
  private templatePack: TemplatePack;

  constructor(templatePack: TemplatePack) {
    this.templatePack = templatePack;
    this.layoutEngine = new LayoutEngine(templatePack);
  }

  public async generateMagazine(
    issue: Issue,
    articles: Article[],
    allImages: Image[]
  ): Promise<GeneratedTemplate> {
    const layoutDecisions: LayoutDecision[] = [];
    const allWarnings: string[] = [];
    let articleHtml = '';

    // Generate table of contents
    const tocHtml = this.generateTableOfContents(issue, articles);

    // Process each article
    for (const article of articles) {
      const articleImages = allImages.filter(img => img.articleId === article.id);
      const variants = Array.isArray(this.templatePack.variants) ? this.templatePack.variants : [];
      
      const decision = this.layoutEngine.decideLayout(article, articleImages, variants);
      layoutDecisions.push(decision);
      allWarnings.push(...decision.warnings);

      const articleCss = this.layoutEngine.generateLayoutCSS(decision, article);
      const individualArticleHtml = this.generateArticleHtml(article, articleImages, decision);
      
      articleHtml += `
        <article class="magazine-article" style="page-break-before: auto;">
          <style scoped>
            ${articleCss}
          </style>
          ${individualArticleHtml}
        </article>
      `;
    }

    // Generate master CSS
    const masterCss = this.generateMasterCSS();

    // Combine everything
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${issue.title} - ${issue.issueId}</title>
        <style>
          ${masterCss}
        </style>
      </head>
      <body>
        <div class="magazine">
          <!-- Cover Page -->
          ${this.generateCoverPage(issue)}
          
          <!-- Table of Contents -->
          ${tocHtml}
          
          <!-- Articles -->
          ${articleHtml}
          
          <!-- Imprint -->
          ${this.generateImprint(issue)}
        </div>
      </body>
      </html>
    `;

    // Estimate page count (rough calculation)
    const estimatedPageCount = 2 + Math.ceil(articles.length / 2) + articles.length;

    return {
      html: fullHtml,
      css: masterCss,
      metadata: {
        pageCount: estimatedPageCount,
        layoutDecisions,
        warnings: allWarnings,
      },
    };
  }

  private generateMasterCSS(): string {
    return `
      /* CSS Reset and Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Paged Media Rules for Print/PDF */
      @page {
        size: A4;
        margin: 15mm 15mm 20mm 15mm;
        marks: crop cross;
        bleed: 3mm;
        
        @top-center {
          content: "${this.templatePack.name}";
          font-size: 8pt;
          color: #666;
        }
        
        @bottom-center {
          content: counter(page);
          font-size: 10pt;
        }
        
        @bottom-left {
          content: "${new Date().toLocaleDateString()}";
          font-size: 8pt;
          color: #666;
        }
      }

      @page :first {
        @top-center { content: none; }
        @bottom-center { content: none; }
        @bottom-left { content: none; }
      }

      /* Typography Base */
      body {
        font-family: 'Times New Roman', serif;
        color: #1a1a1a;
        background: white;
        counter-reset: page;
      }

      .magazine {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
      }

      /* Cover Page */
      .cover-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        page-break-after: always;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40mm;
      }

      .cover-title {
        font-size: 48pt;
        font-weight: bold;
        margin-bottom: 24pt;
        line-height: 1.1;
      }

      .cover-issue {
        font-size: 24pt;
        margin-bottom: 12pt;
        opacity: 0.9;
      }

      .cover-date {
        font-size: 16pt;
        opacity: 0.8;
      }

      /* Table of Contents */
      .toc-page {
        page-break-before: always;
        page-break-after: always;
        padding: 40pt 0;
      }

      .toc-title {
        font-size: 28pt;
        font-weight: bold;
        margin-bottom: 24pt;
        text-align: center;
        border-bottom: 2px solid #1a1a1a;
        padding-bottom: 12pt;
      }

      .toc-section {
        margin-bottom: 24pt;
      }

      .toc-section-title {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 12pt;
        color: #667eea;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .toc-entry {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8pt;
        padding-bottom: 4pt;
        border-bottom: 1px dotted #ccc;
      }

      .toc-article-title {
        font-size: 12pt;
        flex-grow: 1;
      }

      .toc-author {
        font-size: 10pt;
        color: #666;
        margin: 0 12pt;
      }

      .toc-page-number {
        font-size: 12pt;
        font-weight: bold;
        color: #667eea;
      }

      /* Article Styles */
      .magazine-article {
        page-break-before: auto;
        page-break-after: auto;
        padding: 24pt 0;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 24pt;
      }

      .magazine-article:last-child {
        border-bottom: none;
      }

      /* Image Styles */
      .article-image {
        display: block;
        max-width: 100%;
        height: auto;
        break-inside: avoid;
      }

      .hero-image-container {
        margin-bottom: 24pt;
        column-span: all;
        break-after: avoid;
      }

      .inline-image-container {
        margin: 12pt 0;
        break-inside: avoid;
      }

      .image-caption {
        font-size: 9pt;
        line-height: 1.3;
        margin-top: 6pt;
        font-style: italic;
        color: #666;
      }

      .image-credit {
        font-size: 8pt;
        color: #999;
        margin-top: 3pt;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Imprint */
      .imprint-page {
        page-break-before: always;
        padding: 40pt 0;
        font-size: 9pt;
        line-height: 1.4;
        color: #666;
      }

      .imprint-title {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 18pt;
        color: #1a1a1a;
      }

      .imprint-section {
        margin-bottom: 12pt;
      }

      /* Utility Classes */
      .page-break {
        page-break-before: always;
      }

      .avoid-break {
        break-inside: avoid;
      }

      .text-center {
        text-align: center;
      }

      .text-uppercase {
        text-transform: uppercase;
      }

      /* Print Optimizations */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .magazine-article {
          orphans: 2;
          widows: 2;
        }
      }

      /* Responsive Adjustments for Screen Preview */
      @media screen and (max-width: 768px) {
        .magazine {
          padding: 20pt;
        }
        
        .cover-page {
          height: auto;
          min-height: 100vh;
        }
        
        .article-content {
          column-count: 1 !important;
        }
      }
    `;
  }

  private generateCoverPage(issue: Issue): string {
    const formattedDate = new Date(issue.date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="cover-page">
        <h1 class="cover-title">${this.escapeHtml(issue.title)}</h1>
        <div class="cover-issue">Ausgabe ${this.escapeHtml(issue.issueId)}</div>
        <div class="cover-date">${formattedDate}</div>
      </div>
    `;
  }

  private generateTableOfContents(issue: Issue, articles: Article[]): string {
    const sectionGroups: { [key: string]: Article[] } = {};
    
    // Group articles by section
    articles.forEach(article => {
      if (!sectionGroups[article.section]) {
        sectionGroups[article.section] = [];
      }
      sectionGroups[article.section].push(article);
    });

    let tocHtml = `
      <div class="toc-page">
        <h2 class="toc-title">Inhalt</h2>
    `;

    let pageNumber = 3; // Start after cover and TOC

    Object.entries(sectionGroups).forEach(([section, sectionArticles]) => {
      tocHtml += `
        <div class="toc-section">
          <h3 class="toc-section-title">${this.escapeHtml(section)}</h3>
      `;

      sectionArticles.forEach(article => {
        tocHtml += `
          <div class="toc-entry">
            <span class="toc-article-title">${this.escapeHtml(article.title)}</span>
            <span class="toc-author">${this.escapeHtml(article.author)}</span>
            <span class="toc-page-number">${pageNumber}</span>
          </div>
        `;
        pageNumber += 1; // Rough estimate - each article gets one page
      });

      tocHtml += `</div>`;
    });

    tocHtml += `</div>`;

    return tocHtml;
  }

  private generateArticleHtml(
    article: Article,
    images: Image[],
    decision: LayoutDecision
  ): string {
    const heroImage = images.find(img => img.role === 'hero');
    const inlineImages = images.filter(img => img.role === 'inline');

    let articleHtml = '';

    // Hero image
    if (heroImage && decision.heroHeight) {
      articleHtml += `
        <div class="hero-image-container">
          <img src="${this.escapeHtml(heroImage.src)}" 
               alt="${this.escapeHtml(heroImage.caption || article.title)}"
               class="article-image hero-image"
               style="object-position: ${heroImage.focalPoint || '50% 50%'};">
          ${heroImage.caption ? `<div class="image-caption">${this.escapeHtml(heroImage.caption)}</div>` : ''}
          ${heroImage.credit ? `<div class="image-credit">${this.escapeHtml(heroImage.credit)}</div>` : ''}
        </div>
      `;
    }

    // Article header
    articleHtml += `
      <header class="article-header">
        <h1 class="article-title">${this.escapeHtml(article.title)}</h1>
        ${article.dek ? `<div class="article-dek">${this.escapeHtml(article.dek)}</div>` : ''}
        <div class="article-author">Von ${this.escapeHtml(article.author)}</div>
      </header>
    `;

    // Article body with inline images
    let bodyHtml = article.bodyHtml;
    
    // Insert inline images into the text
    if (inlineImages.length > 0) {
      const paragraphs = bodyHtml.split('</p>');
      const insertPositions = this.calculateImagePositions(paragraphs.length, inlineImages.length);
      
      insertPositions.forEach((position, index) => {
        if (position < paragraphs.length && inlineImages[index]) {
          const image = inlineImages[index];
          const imageHtml = `
            <div class="inline-image-container">
              <img src="${this.escapeHtml(image.src)}" 
                   alt="${this.escapeHtml(image.caption || '')}"
                   class="article-image inline-image">
              ${image.caption ? `<div class="image-caption">${this.escapeHtml(image.caption)}</div>` : ''}
              ${image.credit ? `<div class="image-credit">${this.escapeHtml(image.credit)}</div>` : ''}
            </div>
          `;
          paragraphs[position] += imageHtml;
        }
      });
      
      bodyHtml = paragraphs.join('</p>');
    }

    // Add pullquote if variant allows and we have enough paragraphs
    if (decision.variant.pullquote?.allow && article.bodyHtml.split('</p>').length >= (decision.variant.pullquote.min_paragraph || 3)) {
      const pullquoteText = this.extractPullquote(article.bodyHtml);
      if (pullquoteText) {
        // Insert pullquote in the middle of the text
        const paragraphs = bodyHtml.split('</p>');
        const middleIndex = Math.floor(paragraphs.length / 2);
        paragraphs[middleIndex] += `
          <blockquote class="pullquote">
            ${this.escapeHtml(pullquoteText)}
          </blockquote>
        `;
        bodyHtml = paragraphs.join('</p>');
      }
    }

    articleHtml += `
      <div class="article-content">
        <div class="article-body">
          ${bodyHtml}
        </div>
      </div>
    `;

    return articleHtml;
  }

  private generateImprint(issue: Issue): string {
    return `
      <div class="imprint-page">
        <h2 class="imprint-title">Impressum</h2>
        
        <div class="imprint-section">
          <strong>Herausgeber:</strong><br>
          MagCast Publishing GmbH<br>
          Musterstraße 123<br>
          12345 Musterstadt
        </div>
        
        <div class="imprint-section">
          <strong>Redaktion:</strong><br>
          Chefredaktion: Max Mustermann<br>
          E-Mail: redaktion@magcast.de
        </div>
        
        <div class="imprint-section">
          <strong>Ausgabe:</strong><br>
          ${this.escapeHtml(issue.title)} - ${this.escapeHtml(issue.issueId)}<br>
          Erscheinungsdatum: ${new Date(issue.date).toLocaleDateString('de-DE')}
        </div>
        
        <div class="imprint-section">
          <strong>Technische Umsetzung:</strong><br>
          Automatisiert erstellt mit MagCast Publishing Engine<br>
          Template: ${this.escapeHtml(this.templatePack.name)} v${this.escapeHtml(this.templatePack.version)}
        </div>
        
        <div class="imprint-section">
          <strong>Copyright:</strong><br>
          Alle Rechte vorbehalten. Nachdruck, auch auszugsweise, nur mit ausdrücklicher Genehmigung des Verlags.
        </div>
      </div>
    `;
  }

  private calculateImagePositions(paragraphCount: number, imageCount: number): number[] {
    const positions: number[] = [];
    const spacing = Math.floor(paragraphCount / (imageCount + 1));
    
    for (let i = 0; i < imageCount; i++) {
      positions.push(spacing * (i + 1));
    }
    
    return positions;
  }

  private extractPullquote(html: string): string | null {
    // Find a suitable sentence for pullquote (between 40-120 characters)
    const text = this.stripHtml(html);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40 && s.trim().length < 120);
    
    return sentences.length > 0 ? sentences[0].trim() : null;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}