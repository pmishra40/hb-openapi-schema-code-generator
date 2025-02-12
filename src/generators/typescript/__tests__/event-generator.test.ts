import { EventBridgeGenerator } from '../services/event-generator';
import { createMockLogger, createMockOpenAPIDocument } from './test-utils';
import { TemplateRenderer } from '../services/template-renderer';
import { FileSystem } from '../services/file-system';
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
    cleanup: jest.fn()
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
    jest.clearAllMocks();
    generator = new EventBridgeGenerator(
      mockTemplateRenderer,
      mockFileSystem,
      mockLogger,
      mockOptions,
      mockDocument
    );
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
      expect(mockLogger.info).toHaveBeenCalled();
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
  });
});
