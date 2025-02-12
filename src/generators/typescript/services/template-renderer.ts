import Handlebars from 'handlebars';

/**
 * Interface for template rendering services
 */
/**
 * Interface for template rendering services.
 * This abstraction allows for different template engine implementations
 * while maintaining a consistent interface for code generation.
 */
export interface TemplateRenderer {
    /**
     * Renders a template with provided data
     * @param template Template string
     * @param data Data to be used in template
     * @returns Rendered string
     */
    /**
     * Renders a template with provided data
     * @param {string} template - Template string containing placeholders
     * @param {any} data - Data object to be used in template rendering
     * @returns {string} Rendered template with data substituted
     * @throws {Error} If template rendering fails
     */
    render(template: string, data: any): string;
}

/**
 * Handlebars implementation of template renderer
 */
/**
 * Handlebars implementation of the template renderer.
 * Uses Handlebars templating engine to render templates with data.
 * Supports all Handlebars features including:
 * - Variable substitution
 * - Conditional blocks
 * - Loops and iterations
 * - Custom helpers
 */
export class HandlebarsTemplateRenderer implements TemplateRenderer {
    /**
     * Renders a template using Handlebars
     * @param {string} template - Handlebars template string
     * @param {any} data - Data context for template rendering
     * @returns {string} Rendered template string
     * @throws {Error} If template compilation or rendering fails
     */
    render(template: string, data: any): string {
        return Handlebars.compile(template)(data);
    }
}
