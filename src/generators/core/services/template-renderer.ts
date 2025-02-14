import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Service for rendering Handlebars templates with provided data.
 * This is used by both Python and TypeScript generators to render event files.
 */
export class HandlebarsTemplateRenderer {
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();

  /**
   * Renders a template with the provided data
   * 
   * @param templatePath - Path to the template file
   * @param data - Data to render in the template
   * @returns Rendered template string
   */
  render(templatePath: string, data: any): string {
    let template = this.templateCache.get(templatePath);
    
    if (!template) {
      const templateContent = readFileSync(templatePath, 'utf-8');
      template = Handlebars.compile(templateContent);
      this.templateCache.set(templatePath, template);
    }

    return template(data);
  }

  /**
   * Gets the full path to a template file
   * 
   * @param language - The target language (python/typescript)
   * @param templateName - Name of the template file
   * @returns Full path to the template file
   */
  getTemplatePath(language: string, templateName: string): string {
    return join(__dirname, '..', '..', language, 'templates', templateName);
  }
}
