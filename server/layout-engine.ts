import type { Article, Image, TemplatePack } from "@shared/schema";

export interface LayoutVariant {
  id: string;
  columns: number;
  hero?: {
    min_vh: number;
    max_vh: number;
  };
  body?: {
    font_min: number;
    font_max: number;
    leading: [number, number];
  };
  pullquote?: {
    allow: boolean;
    min_paragraph: number;
  };
}

export interface LayoutRules {
  typography: {
    font_min: number;
    font_max: number;
    line_height_min: number;
    line_height_max: number;
  };
  layout: {
    max_columns: number;
    min_text_length: number;
    max_text_length: number;
  };
  images: {
    hero_required_words: number;
    max_images_per_column: number;
  };
}

export interface LayoutDecision {
  variant: LayoutVariant;
  fontSize: number;
  lineHeight: number;
  heroHeight?: number;
  columnCount: number;
  score: number;
  warnings: string[];
}

export interface ArticleMetrics {
  wordCount: number;
  paragraphCount: number;
  characterCount: number;
  heroImage?: Image;
  inlineImages: Image[];
  hasLongParagraphs: boolean;
  estimatedLines: number;
}

export class LayoutEngine {
  private rules: LayoutRules;

  constructor(templatePack: TemplatePack) {
    this.rules = this.parseRules(templatePack);
  }

  private parseRules(templatePack: TemplatePack): LayoutRules {
    const defaultRules: LayoutRules = {
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
    };

    // Merge with template pack rules
    if (templatePack.rules && typeof templatePack.rules === 'object') {
      const packRules = templatePack.rules as any;
      if (packRules.typography) {
        Object.assign(defaultRules.typography, packRules.typography);
      }
      if (packRules.layout) {
        Object.assign(defaultRules.layout, packRules.layout);
      }
      if (packRules.images) {
        Object.assign(defaultRules.images, packRules.images);
      }
    }

    return defaultRules;
  }

  public analyzeArticle(article: Article, images: Image[]): ArticleMetrics {
    const text = this.stripHtml(article.bodyHtml);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = article.bodyHtml.split(/<\/p>/i).length - 1;

    const heroImage = images.find(img => img.role === 'hero');
    const inlineImages = images.filter(img => img.role === 'inline');

    // Estimate lines based on average words per line (8-12 words)
    const avgWordsPerLine = 10;
    const estimatedLines = Math.ceil(words.length / avgWordsPerLine);

    // Check for long paragraphs (over 100 words)
    const paragraphTexts = article.bodyHtml.split(/<\/?p[^>]*>/gi).filter(p => p.trim());
    const hasLongParagraphs = paragraphTexts.some(p => 
      this.stripHtml(p).split(/\s+/).length > 100
    );

    return {
      wordCount: words.length,
      paragraphCount: paragraphs,
      characterCount: text.length,
      heroImage,
      inlineImages,
      hasLongParagraphs,
      estimatedLines,
    };
  }

  public decideLayout(
    article: Article, 
    images: Image[], 
    variants: LayoutVariant[]
  ): LayoutDecision {
    const metrics = this.analyzeArticle(article, images);
    const decisions: LayoutDecision[] = [];

    for (const variant of variants) {
      const decision = this.evaluateVariant(variant, metrics, article);
      decisions.push(decision);
    }

    // Sort by score (highest first)
    decisions.sort((a, b) => b.score - a.score);

    return decisions[0] || this.getFallbackDecision(variants[0], metrics);
  }

  private evaluateVariant(
    variant: LayoutVariant, 
    metrics: ArticleMetrics, 
    article: Article
  ): LayoutDecision {
    const warnings: string[] = [];
    let score = 100; // Start with perfect score

    // Column optimization based on text length
    let optimalColumns = this.calculateOptimalColumns(metrics);
    if (variant.columns > optimalColumns) {
      score -= 15; // Penalty for too many columns
      warnings.push(`${variant.columns} columns may be too many for ${metrics.wordCount} words`);
    }

    // Hero image requirements
    let heroHeight: number | undefined;
    if (variant.hero && metrics.heroImage) {
      if (metrics.wordCount >= this.rules.images.hero_required_words) {
        heroHeight = variant.hero.max_vh; // Use maximum height for long articles
        score += 10; // Bonus for good hero usage
      } else {
        heroHeight = variant.hero.min_vh; // Use minimum height for short articles
        score -= 5; // Small penalty for suboptimal hero usage
      }
    } else if (variant.hero && !metrics.heroImage && metrics.wordCount > this.rules.images.hero_required_words) {
      score -= 20; // Penalty for missing hero on long article
      warnings.push("Long article would benefit from hero image");
    }

    // Typography optimization
    const { fontSize, lineHeight } = this.optimizeTypography(metrics, variant);
    
    // Font size penalties
    if (fontSize <= this.rules.typography.font_min) {
      score -= 25; // Heavy penalty for minimum font size
      warnings.push("Font size at minimum limit");
    }
    if (fontSize >= this.rules.typography.font_max) {
      score -= 10; // Light penalty for maximum font size
      warnings.push("Font size at maximum limit");
    }

    // Text overflow estimation
    const estimatedHeight = this.estimateTextHeight(metrics, fontSize, lineHeight, variant.columns);
    if (estimatedHeight > 1000) { // Rough page height limit
      score -= 30; // Heavy penalty for potential overflow
      warnings.push("Text may overflow page boundaries");
    }

    // Image distribution
    if (metrics.inlineImages.length > variant.columns * this.rules.images.max_images_per_column) {
      score -= 15; // Penalty for too many images per column
      warnings.push("Too many images for column layout");
    }

    // Paragraph length considerations
    if (metrics.hasLongParagraphs && variant.columns > 2) {
      score -= 10; // Penalty for long paragraphs in narrow columns
      warnings.push("Long paragraphs in narrow columns may affect readability");
    }

    // Pullquote optimization
    if (variant.pullquote?.allow && metrics.paragraphCount >= (variant.pullquote.min_paragraph || 3)) {
      score += 5; // Bonus for pullquote opportunity
    }

    return {
      variant,
      fontSize,
      lineHeight,
      heroHeight,
      columnCount: variant.columns,
      score: Math.max(0, score), // Ensure score doesn't go negative
      warnings,
    };
  }

  private calculateOptimalColumns(metrics: ArticleMetrics): number {
    if (metrics.wordCount < 200) return 1;
    if (metrics.wordCount < 500) return 2;
    return 3;
  }

  private optimizeTypography(metrics: ArticleMetrics, variant: LayoutVariant): { fontSize: number; lineHeight: number } {
    const baseFont = variant.body?.font_min || this.rules.typography.font_min;
    const maxFont = variant.body?.font_max || this.rules.typography.font_max;
    const baseLineHeight = variant.body?.leading?.[0] || this.rules.typography.line_height_min;
    const maxLineHeight = variant.body?.leading?.[1] || this.rules.typography.line_height_max;

    // Scale font size based on text length and columns
    let fontSize = baseFont;
    
    if (metrics.wordCount < 300) {
      // Short articles can use larger font
      fontSize = Math.min(maxFont, baseFont + 0.5);
    } else if (metrics.wordCount > 800) {
      // Long articles may need smaller font
      fontSize = Math.max(baseFont, maxFont - 0.3);
    } else {
      // Medium articles use optimal size
      fontSize = baseFont + 0.2;
    }

    // Adjust for column count
    if (variant.columns > 2) {
      fontSize = Math.max(baseFont, fontSize - 0.2); // Slightly smaller for narrow columns
    }

    // Optimize line height based on font size
    const lineHeightRatio = (fontSize - baseFont) / (maxFont - baseFont);
    const lineHeight = baseLineHeight + (maxLineHeight - baseLineHeight) * lineHeightRatio;

    return {
      fontSize: Math.round(fontSize * 10) / 10, // Round to 1 decimal
      lineHeight: Math.round(lineHeight * 100) / 100, // Round to 2 decimals
    };
  }

  private estimateTextHeight(
    metrics: ArticleMetrics, 
    fontSize: number, 
    lineHeight: number, 
    columns: number
  ): number {
    const lineHeightPx = fontSize * lineHeight * 1.33; // Convert pt to px roughly
    const totalLines = metrics.estimatedLines;
    const linesPerColumn = Math.ceil(totalLines / columns);
    
    return linesPerColumn * lineHeightPx;
  }

  private getFallbackDecision(variant: LayoutVariant, metrics: ArticleMetrics): LayoutDecision {
    return {
      variant,
      fontSize: this.rules.typography.font_min,
      lineHeight: this.rules.typography.line_height_min,
      columnCount: Math.min(2, variant.columns),
      score: 50, // Mediocre score for fallback
      warnings: ["Using fallback layout decision"],
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  public generateLayoutCSS(decision: LayoutDecision, article: Article): string {
    const { variant, fontSize, lineHeight, heroHeight, columnCount } = decision;

    let css = `
      .article-content {
        font-size: ${fontSize}pt;
        line-height: ${lineHeight};
        column-count: ${columnCount};
        column-gap: 24px;
        column-fill: balance;
        orphans: 2;
        widows: 2;
        hyphens: auto;
      }

      .article-title {
        font-size: ${Math.round(fontSize * 2.8)}pt;
        line-height: 1.2;
        margin-bottom: 12pt;
        column-span: all;
        break-after: avoid;
      }

      .article-dek {
        font-size: ${Math.round(fontSize * 1.2)}pt;
        line-height: 1.4;
        margin-bottom: 18pt;
        column-span: all;
        font-weight: 500;
        break-after: avoid;
      }

      .article-author {
        font-size: ${Math.round(fontSize * 0.9)}pt;
        margin-bottom: 24pt;
        column-span: all;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        break-after: avoid;
      }

      .article-body p {
        margin-bottom: ${Math.round(fontSize * 0.8)}pt;
        break-inside: avoid-column;
      }

      .article-body p:first-child::first-letter {
        font-size: ${Math.round(fontSize * 3.5)}pt;
        line-height: 1;
        float: left;
        margin: 0 8pt 0 0;
        font-weight: bold;
      }
    `;

    if (heroHeight) {
      css += `
        .hero-image {
          width: 100%;
          height: ${heroHeight}vh;
          object-fit: cover;
          margin-bottom: 24pt;
          column-span: all;
          break-after: avoid;
        }
      `;
    }

    if (variant.pullquote?.allow) {
      css += `
        .pullquote {
          font-size: ${Math.round(fontSize * 1.4)}pt;
          line-height: 1.3;
          font-weight: bold;
          margin: 18pt 0;
          padding: 12pt 0;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          column-span: ${columnCount > 2 ? 2 : 'all'};
          break-inside: avoid;
        }
      `;
    }

    css += `
      .inline-image {
        width: 100%;
        margin: 12pt 0;
        break-inside: avoid;
      }

      .image-caption {
        font-size: ${Math.round(fontSize * 0.85)}pt;
        line-height: 1.3;
        margin-top: 6pt;
        font-style: italic;
        color: #666;
      }

      .image-credit {
        font-size: ${Math.round(fontSize * 0.75)}pt;
        color: #999;
        margin-top: 3pt;
      }
    `;

    return css;
  }
}