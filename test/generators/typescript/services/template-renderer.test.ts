import { HandlebarsTemplateRenderer } from '../../../../src/generators/typescript/services/template-renderer';

describe('HandlebarsTemplateRenderer', () => {
  let renderer: HandlebarsTemplateRenderer;

  beforeEach(() => {
    renderer = new HandlebarsTemplateRenderer();
  });

  it('should render a simple template', () => {
    const template = 'Hello {{name}}!';
    const data = { name: 'World' };
    const result = renderer.render(template, data);
    expect(result).toBe('Hello World!');
  });

  it('should render a template with conditional blocks', () => {
    const template = '{{#if show}}Visible{{else}}Hidden{{/if}}';
    expect(renderer.render(template, { show: true })).toBe('Visible');
    expect(renderer.render(template, { show: false })).toBe('Hidden');
  });

  it('should render a template with loops', () => {
    const template = '{{#each items}}{{this}}{{/each}}';
    const data = { items: ['a', 'b', 'c'] };
    expect(renderer.render(template, data)).toBe('abc');
  });

  it('should handle undefined values', () => {
    const template = '{{name}}';
    expect(renderer.render(template, {})).toBe('');
  });
});
