import { PythonEventBridgeGenerator } from '../../../../src/generators/python/services/event-generator';
import { HandlebarsTemplateRenderer } from '../../../../src/generators/core/services/template-renderer';
import { FileSystem } from '../../../../src/generators/core/services/file-system';
import { GeneratorOptions } from '../../../../src/generators/core/types';
import { OpenAPIV3 } from 'openapi-types';
import { createMockLogger } from '../../../../test/utils/test-utils';
import { join } from 'path';
import { readFileSync } from 'fs';

jest.mock('fs');
jest.mock('path');

describe('Python EventBridgeGenerator', () => {
  let generator: PythonEventBridgeGenerator;
  let mockDocument: OpenAPIV3.Document;
  let mockTemplateRenderer: jest.Mocked<HandlebarsTemplateRenderer>;
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockOptions: Required<GeneratorOptions>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocument = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          BillEvent: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' }
            }
          },
          PaymentEvent: {
            $ref: '#/components/schemas/Payment'
          },
          Payment: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' },
              status: { type: 'string' }
            }
          }
        }
      }
    };

    mockTemplateRenderer = {
      render: jest.fn().mockReturnValue('mock template content')
    } as any;

    mockFileSystem = {
      exists: jest.fn().mockReturnValue(false),
      createDirectory: jest.fn(),
      writeFile: jest.fn()
    } as any;

    mockLogger = createMockLogger();

    mockOptions = {
      language: 'python',
      outputDir: './out',
      schemaPath: './schema.yaml',
      logger: mockLogger,
      npmPackageName: 'test-package',
      npmVersion: '1.0.0',
      region: 'us-west-2',
      eventBusName: 'test-bus',
      defaultSource: 'test-source'
    } as Required<GeneratorOptions>;

    generator = new PythonEventBridgeGenerator(
      mockTemplateRenderer,
      mockFileSystem,
      mockLogger,
      mockOptions,
      mockDocument
    );

    (readFileSync as jest.Mock).mockReturnValue('mock template content');
    (join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      const testCases = [
        ['BillEvent', 'bill_event'],
        ['PaymentProcessedEvent', 'payment_processed_event'],
        ['ABC', 'a_b_c'],
        ['simpleText', 'simple_text']
      ];

      testCases.forEach(([input, expected]) => {
        // @ts-ignore - accessing private method for testing
        expect(generator.toSnakeCase(input)).toBe(expected);
      });
    });
  });

  describe('resolveReference', () => {
    it('should resolve direct references', () => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: '#/components/schemas/Payment'
      };

      // @ts-ignore - accessing private method for testing
      const result = generator.resolveReference(ref);
      expect(result).toEqual(mockDocument.components!.schemas!.Payment);
    });

    it('should handle nested references', () => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: '#/components/schemas/PaymentEvent'
      };

      // @ts-ignore - accessing private method for testing
      const result = generator.resolveReference(ref);
      expect(result).toEqual(mockDocument.components!.schemas!.Payment);
    });

    it('should throw error for invalid references', () => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: '#/components/schemas/NonExistent'
      };

      // @ts-ignore - accessing private method for testing
      expect(() => generator.resolveReference(ref)).toThrow('Could not resolve reference');
    });
  });

  describe('generateEventFiles', () => {
    it('should skip non-event schemas', async () => {
      const outputPath = './out';
      const schemas: { [key: string]: OpenAPIV3.SchemaObject } = {
        Payment: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' },
            status: { type: 'string' }
          }
        },
        User: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        }
      };

      await generator.generateEventFiles(outputPath, schemas);

      // Verify no files were generated since there are no event schemas
      expect(mockTemplateRenderer.render).not.toHaveBeenCalled();
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });


    it('should generate Python EventBridge files', async () => {
      const outputPath = './out';
      const schemas = mockDocument.components!.schemas!;

      await generator.generateEventFiles(outputPath, schemas);

      // Verify directories are created
      expect(mockFileSystem.createDirectory).toHaveBeenCalledWith(join(outputPath, 'models'));
      expect(mockFileSystem.createDirectory).toHaveBeenCalledWith(join(outputPath, 'events'));

      // Verify files are generated for BillEvent
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        join(outputPath, 'events', 'bill_event_publisher.py'),
        'mock template content'
      );
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        join(outputPath, 'events', 'bill_event_consumer.py'),
        'mock template content'
      );

      // Verify template rendering
      expect(mockTemplateRenderer.render).toHaveBeenCalledWith(
        'mock template content',
        expect.objectContaining({
          name: 'BillEvent',
          modelName: 'BillEvent',
          schema: expect.any(Object)
        })
      );
    });

    it('should handle errors during generation', async () => {
      const outputPath = './out';
      const schemas = mockDocument.components!.schemas!;

      mockFileSystem.createDirectory.mockImplementation(() => {
        throw new Error('Directory creation failed');
      });

      await expect(generator.generateEventFiles(outputPath, schemas))
        .rejects
        .toThrow('Directory creation failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should skip non-event schemas', async () => {
      const outputPath = './out';
      const schemas: { [key: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject } = {
        Payment: mockDocument.components!.schemas!.Payment,
        OtherType: { type: 'object', properties: {} } as OpenAPIV3.SchemaObject
      };

      await generator.generateEventFiles(outputPath, schemas);

      // Verify no files are generated for non-event schemas
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });
  });

});
