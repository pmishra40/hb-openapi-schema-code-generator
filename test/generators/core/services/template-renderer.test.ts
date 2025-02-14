import { HandlebarsTemplateRenderer } from '../../../../src/generators/core/services/template-renderer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

jest.mock('fs');
jest.mock('path');
jest.mock('handlebars');

describe('HandlebarsTemplateRenderer', () => {
  let templateRenderer: HandlebarsTemplateRenderer;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  const mockHandlebars = Handlebars as jest.Mocked<typeof Handlebars>;

  beforeEach(() => {
    jest.clearAllMocks();
    templateRenderer = new HandlebarsTemplateRenderer();
  });

  describe('render', () => {
    it('should compile and render template on first call', () => {
      const templatePath = '/test/template.hbs';
      const templateContent = 'Hello {{name}}!';
      const data = { name: 'World' };
      const compiledTemplate = jest.fn().mockReturnValue('Hello World!');

      mockFs.readFileSync.mockReturnValue(templateContent);
      mockHandlebars.compile.mockReturnValue(compiledTemplate);

      const result = templateRenderer.render(templatePath, data);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(templatePath, 'utf-8');
      expect(mockHandlebars.compile).toHaveBeenCalledWith(templateContent);
      expect(compiledTemplate).toHaveBeenCalledWith(data);
      expect(result).toBe('Hello World!');
    });

    it('should use cached template on subsequent calls', () => {
      const templatePath = '/test/template.hbs';
      const data1 = { name: 'World' };
      const data2 = { name: 'User' };
      const compiledTemplate = jest.fn()
        .mockReturnValueOnce('Hello World!')
        .mockReturnValueOnce('Hello User!');

      mockFs.readFileSync.mockReturnValue('Hello {{name}}!');
      mockHandlebars.compile.mockReturnValue(compiledTemplate);

      // First call
      templateRenderer.render(templatePath, data1);
      
      // Second call
      const result = templateRenderer.render(templatePath, data2);

      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(mockHandlebars.compile).toHaveBeenCalledTimes(1);
      expect(compiledTemplate).toHaveBeenCalledTimes(2);
      expect(result).toBe('Hello User!');
    });

    it('should handle template compilation errors', () => {
      const templatePath = '/test/template.hbs';
      const data = { name: 'World' };

      mockFs.readFileSync.mockReturnValue('Invalid {{template');
      mockHandlebars.compile.mockImplementation(() => {
        throw new Error('Invalid template syntax');
      });

      expect(() => templateRenderer.render(templatePath, data)).toThrow('Invalid template syntax');
    });

    it('should handle file read errors', () => {
      const templatePath = '/test/template.hbs';
      const data = { name: 'World' };

      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => templateRenderer.render(templatePath, data)).toThrow('File not found');
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct template path for typescript', () => {
      const expectedPath = '/root/src/typescript/templates/test.hbs';
      mockPath.join.mockReturnValue(expectedPath);

      const result = templateRenderer.getTemplatePath('typescript', 'test.hbs');

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        '..',
        '..',
        'typescript',
        'templates',
        'test.hbs'
      );
      expect(result).toBe(expectedPath);
    });

    it('should return correct template path for python', () => {
      const expectedPath = '/root/src/python/templates/test.hbs';
      mockPath.join.mockReturnValue(expectedPath);

      const result = templateRenderer.getTemplatePath('python', 'test.hbs');

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        '..',
        '..',
        'python',
        'templates',
        'test.hbs'
      );
      expect(result).toBe(expectedPath);
    });
  });
});
