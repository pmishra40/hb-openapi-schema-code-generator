import { OpenAPITypeScriptGenerator } from '../ts-code-generator';
import { createMockLogger, createMockOpenAPIDocument } from './test-utils';
import { execSync } from 'child_process';
import * as fs from 'fs';

jest.mock('child_process');
jest.mock('fs');

describe('OpenAPITypeScriptGenerator', () => {
  const mockDocument = createMockOpenAPIDocument();
  const mockLogger = createMockLogger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const generator = new OpenAPITypeScriptGenerator(mockDocument);
      expect(generator).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const generator = new OpenAPITypeScriptGenerator(mockDocument, {
        npmPackageName: '@test/package',
        region: 'us-east-1'
      });
      expect(generator).toBeDefined();
    });

    it('should throw error for invalid OpenAPI document', () => {
      const invalidDoc = { info: { title: 'Test', version: '1.0.0' } } as any;


      expect(() => new OpenAPITypeScriptGenerator(invalidDoc)).toThrow();
    });
  });

  describe('generate', () => {
    let generator: OpenAPITypeScriptGenerator;

    beforeEach(() => {
      generator = new OpenAPITypeScriptGenerator(mockDocument, {
        logger: mockLogger
      });
    });

    it('should generate code successfully', async () => {
      // Mock dependencies
      const mockTemplateContent = 'template content';
      const mockTemplateRenderer = {
        render: jest.fn().mockReturnValue('rendered content')
      };
      (generator as any).templateRenderer = mockTemplateRenderer;
      mockLogger.info.mockImplementation(() => undefined);

      // Mock file system
      const mockFileSystem = {
        writeFile: jest.fn(),
        readFile: jest.fn().mockReturnValue(mockTemplateContent),
        createDirectory: jest.fn(),
        exists: jest.fn(),
        cleanup: jest.fn()
      };
      (generator as any).fileSystem = mockFileSystem;

      // Mock template content
      mockTemplateRenderer.render.mockImplementation((template: string) => {
        return 'rendered ' + template;
      });


      const mockEventGenerator = {
        generateEventFiles: jest.fn().mockResolvedValue(undefined)
      };
      
      // Inject mocked dependencies
      (generator as any).eventGenerator = mockEventGenerator;


      
      // Mock file system operations
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      (fs.rmdirSync as jest.Mock).mockReturnValue(undefined);

      // Mock execSync
      (execSync as jest.Mock).mockReturnValue('');

      const outputPath = '/test/output';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (execSync as jest.Mock).mockReturnValue('');

      await generator.generate(outputPath);
      
      expect(mockFileSystem.createDirectory).toHaveBeenCalled();
      expect(mockFileSystem.writeFile).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();

      expect(execSync).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      const outputPath = '/test/output';
      const mockError = new Error('Generation failed');
      (execSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(generator.generate(outputPath)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('buildAdditionalProperties', () => {
    it('should build properties string correctly', () => {
      const generator = new OpenAPITypeScriptGenerator(mockDocument, {
        npmPackageName: '@test/package',
        npmVersion: '2.0.0'
      });

      const props = (generator as any).buildAdditionalProperties();
      expect(props).toContain('supportsES6=true');
      expect(props).toContain('npmName=@test/package');
      expect(props).toContain('npmVersion=2.0.0');
    });
  });
});
