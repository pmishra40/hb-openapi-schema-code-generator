import { EventBridgeGenerator } from '../../../../src/generators/typescript/services/event-generator';
import { createMockLogger, createMockOpenAPIDocument } from '../../../../test/utils/test-utils';
import { TemplateRenderer } from '../../../../src/generators/typescript/services/template-renderer';
import { FileSystem } from '../../../../src/generators/typescript/services/file-system';
import { OpenAPIV3 } from 'openapi-types';

describe('EventBridgeGenerator', () => {
  const mockLogger = createMockLogger();
  const mockTemplateRenderer: jest.Mocked<TemplateRenderer> = {
    render: jest.fn()
  };
  const mockFileSystem: jest.Mocked<FileSystem> = {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    createDirectory: jest.fn(),
    exists: jest.fn(),
    cleanup: jest.fn(),
    createFolder: jest.fn(),
    moveFile: jest.fn(),
    readdir: jest.fn()
  };
  const mockOptions = {
    npmPackageName: '@test/package',
    npmVersion: '1.0.0',
    region: 'us-west-2',
    eventBusName: 'test-bus',
    defaultSource: 'com.test',
    logger: mockLogger
  };
  const mockDocument = createMockOpenAPIDocument();
  mockDocument.components = {
    schemas: {
      ReferencedSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  };

  let generator: EventBridgeGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.info.mockImplementation(() => undefined);
    mockDocument.components = {
      schemas: {
        ReferencedSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      }
    };
    generator = new EventBridgeGenerator(
      mockTemplateRenderer,
      mockFileSystem,
      mockLogger,
      { ...mockOptions, language: 'typescript' },
      mockDocument
    );
  });

  describe('resolveReference', () => {
    it('should throw error when reference cannot be resolved', () => {
      const ref = { $ref: '#/components/schemas/NonExistentSchema' };
      expect(() => generator['resolveReference'](ref)).toThrow('Could not resolve reference');
    });

    it('should handle nested references', () => {
      mockDocument.components = {
        schemas: {
          ParentSchema: {
            $ref: '#/components/schemas/ChildSchema'
          },
          ChildSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            }
          }
        }
      };

      const ref = { $ref: '#/components/schemas/ParentSchema' };
      const resolved = generator['resolveReference'](ref);
      expect(resolved).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      });
    });
  });

  describe('generateEventFiles', () => {
    it('should generate event files for valid schemas', async () => {
      mockLogger.info.mockImplementation(() => undefined);
      // Mock template rendering
      mockTemplateRenderer.render.mockReturnValue('generated code');
      mockFileSystem.writeFile.mockImplementation(() => undefined);

      const outputPath = '/test/output';
      const schemas = {
        'TestEvent': {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        } as OpenAPIV3.SchemaObject
      };

      await generator.generateEventFiles(outputPath, schemas);

      expect(mockFileSystem.writeFile).toHaveBeenCalled();
      expect(mockTemplateRenderer.render).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle schema references', async () => {
      mockTemplateRenderer.render.mockReturnValue('generated code');
      const outputPath = '/test/output';
      const schemas = {
        'TestEvent': {
          $ref: '#/components/schemas/ReferencedSchema'
        } as OpenAPIV3.ReferenceObject
      };

      mockTemplateRenderer.render.mockReturnValue('generated code');

      await generator.generateEventFiles(outputPath, schemas);

      expect(mockFileSystem.writeFile).toHaveBeenCalled();
      expect(mockTemplateRenderer.render).toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      const outputPath = '/test/output';
      const schemas = {
        'TestEvent': {
          type: 'object'
        } as OpenAPIV3.SchemaObject
      };

      mockTemplateRenderer.render.mockImplementation(() => {
        throw new Error('Template error');
      });

      await expect(generator.generateEventFiles(outputPath, schemas))
        .rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should pass correct template options', async () => {
      const outputPath = '/test/output';
      const schemas = {
        'TestEvent': {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        } as OpenAPIV3.SchemaObject
      };

      mockTemplateRenderer.render.mockReturnValue('generated code');
      await generator.generateEventFiles(outputPath, schemas);

      const renderCalls = mockTemplateRenderer.render.mock.calls;
      expect(renderCalls.length).toBeGreaterThan(0);
      const lastCallArgs = renderCalls[renderCalls.length - 1];
      expect(lastCallArgs[1]).toMatchObject({
        importPath: '../models',
        options: {
          npmPackageName: '@test/package',
          npmVersion: '1.0.0',
          region: 'us-west-2',
          eventBusName: 'test-bus',
          defaultSource: 'com.test',
          language: 'typescript'
        }
      });
      expect(lastCallArgs[1].toLowerCase).toBeDefined();
      expect(lastCallArgs[1].toLowerCase('TEST')).toBe('test');
    });
  });
});
