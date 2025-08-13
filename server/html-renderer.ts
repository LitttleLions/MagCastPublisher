import type { GeneratedTemplate } from './template-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface HTMLRenderResult {
  htmlPath: string;
  metadata: any;
  renderTime: number;
}

export class HTMLRenderer {
  private outputDir = './generated-previews';

  constructor() {
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async renderHTML(
    template: GeneratedTemplate,
    filename: string
  ): Promise<HTMLRenderResult> {
    const startTime = Date.now();
    
    try {
      // Create standalone HTML file with embedded CSS
      const standaloneHTML = this.createStandaloneHTML(template);
      
      const htmlPath = join(this.outputDir, `${filename}.html`);
      writeFileSync(htmlPath, standaloneHTML, 'utf8');

      const renderTime = Date.now() - startTime;

      console.log(`HTML preview generated in ${renderTime}ms: ${htmlPath}`);

      return {
        htmlPath: `/api/preview-files/${filename}.html`,
        metadata: template.metadata,
        renderTime,
      };

    } catch (error) {
      throw new Error(`HTML rendering failed: ${error.message}`);
    }
  }

  private createStandaloneHTML(template: GeneratedTemplate): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MagCast Preview</title>
    <style>
        ${template.css}
        
        /* Additional preview styles */
        .preview-header {
            background: #f5f5f5;
            padding: 20px;
            border-bottom: 2px solid #ddd;
            margin-bottom: 40px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .preview-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .layout-decisions {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 40px auto;
            max-width: 800px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .decision-item {
            margin-bottom: 15px;
            padding: 10px;
            border-left: 4px solid #667eea;
            background: #f8f9ff;
        }
        
        .warning {
            color: #e67e22;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        /* Print-specific styles for better preview */
        @media print {
            .preview-header,
            .layout-decisions {
                display: none;
            }
        }
        
        /* Responsive adjustments */
        @media screen and (max-width: 768px) {
            .magazine {
                padding: 10px;
            }
            
            .preview-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <div class="preview-info">
            <div>
                <h3>MagCast Layout Preview</h3>
                <p>Generiert am ${new Date().toLocaleString('de-DE')}</p>
            </div>
            <div>
                <strong>Geschätzte Seiten:</strong> ${template.metadata.pageCount}<br>
                <strong>Layout-Entscheidungen:</strong> ${template.metadata.layoutDecisions.length}
            </div>
        </div>
    </div>
    
    <div class="layout-decisions">
        <h4>Layout-Algorithmus Entscheidungen</h4>
        ${template.metadata.layoutDecisions.map((decision: any, index: number) => `
            <div class="decision-item">
                <strong>Artikel ${index + 1}:</strong>
                Variante: ${decision.variant.id}, 
                Score: ${decision.score}, 
                Font: ${decision.fontSize}pt,
                Spalten: ${decision.columnCount}
                ${decision.warnings.length > 0 ? `
                    <div class="warning">⚠ ${decision.warnings.join(', ')}</div>
                ` : ''}
            </div>
        `).join('')}
        ${template.metadata.warnings.length > 0 ? `
            <div style="margin-top: 20px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                <strong>Warnungen:</strong> ${template.metadata.warnings.join(', ')}
            </div>
        ` : ''}
    </div>
    
    ${template.html.replace('<!DOCTYPE html>', '').replace(/<html[^>]*>/, '').replace('</html>', '').replace(/<head>.*?<\/head>/s, '').replace(/<body[^>]*>/, '').replace('</body>', '')}
</body>
</html>`;
  }
}

// Singleton instance
export const htmlRenderer = new HTMLRenderer();