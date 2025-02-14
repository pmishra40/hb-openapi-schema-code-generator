import { OpenAPIGenerator } from '../../../src/generators/core/code-generator';
import { OpenAPIV3 } from 'openapi-types';
import { NodeFileSystem } from '../../../src/generators/typescript/services/file-system';
import { HandlebarsTemplateRenderer } from '../../../src/generators/typescript/services/template-renderer';
import { EventBridgeGenerator } from '../../../src/generators/typescript/services/event-generator';
import { OpenAPISchemaValidator } from '../../../src/generators/typescript/services/schema-validator';
import { PythonEventBridgeGenerator } from '../../../src/generators/python/services/event-generator';
import { join } from 'path';
import { execSync } from 'child_process';
import pino, { Logger } from 'pino';

type FileSystem = {
  exists: (path: string) => Promise<boolean>;
  readdir: (path: string) => Promise<string[]>;
  createDirectory: (path: string) => Promise<void>;
  moveFile: (sourcePath: string, targetPath: string) => Promise<void>;
  removeDirectory: (path: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  cleanup: () => Promise<void>;
};

// Mock dependencies
jest.mock('child_process');
jest.mock('../../../src/generators/typescript/services/file-system');
jest.mock('../../../src/generators/typescript/services/template-renderer');
jest.mock('../../../src/generators/typescript/services/event-generator');
jest.mock('../../../src/generators/typescript/services/schema-validator');
jest.mock('../../../src/generators/python/services/event-generator');

describe('OpenAPIGenerator', () => {
  let generator: OpenAPIGenerator;
  let mockDocument: OpenAPIV3.Document;
  let mockLogger: jest.Mocked<Logger>;
  let mockFileSystem: jest.Mocked<NodeFileSystem>;
  let mockTemplateRenderer: jest.Mocked<HandlebarsTemplateRenderer>;
  let mockEventBridgeGenerator: jest.Mocked<EventBridgeGenerator>;
  let mockSchemaValidator: jest.Mocked<OpenAPISchemaValidator>;
  let mockPythonEventBridgeGenerator: jest.Mocked<PythonEventBridgeGenerator>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      fatal: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(),
      level: 'info'
    } as unknown as jest.Mocked<Logger>;

    // Setup mock document
    mockDocument = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          TestEvent: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            }
          }
        }
      }
    };

    // Setup mock file system
    mockFileSystem = {
      exists: jest.fn().mockReturnValue(true),
      readFile: jest.fn().mockReturnValue('test content'),
      createDirectory: jest.fn().mockReturnValue(undefined),
      writeFile: jest.fn().mockReturnValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined),
      moveFile: jest.fn().mockReturnValue(undefined),
      readdir: jest.fn().mockImplementation((path) => {
        if (path.endsWith('models')) {
          return ['test.ts', 'test2.ts'];
        } else if (path.endsWith('models/models')) {
          return ['test.py', 'test2.py'];
        }
        return [];
      }),
      removeDirectory: jest.fn().mockReturnValue(undefined)
    } as unknown as jest.Mocked<NodeFileSystem>;
    
    // Setup mock template renderer
    mockTemplateRenderer = {
      render: jest.fn().mockReturnValue('rendered content')
    } as jest.Mocked<HandlebarsTemplateRenderer>;
    
    // Setup mock EventBridgeGenerator
    mockEventBridgeGenerator = {
      generateEventFiles: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBridgeGenerator>;
    
    // Setup mock schema validator
    mockSchemaValidator = {
      validate: jest.fn().mockImplementation((doc) => {
        if (doc.openapi && !doc.openapi.startsWith('3.')) {
          throw new Error(`Invalid OpenAPI version. Expected 3.x.x but got ${doc.openapi}`);
        }
      })
    } as unknown as jest.Mocked<OpenAPISchemaValidator>;
    
    // Setup mock Python EventBridgeGenerator
    mockPythonEventBridgeGenerator = {
      generateEventFiles: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<PythonEventBridgeGenerator>;
    
    // Setup mock implementations
    (NodeFileSystem as jest.Mock).mockImplementation(() => mockFileSystem);
    (HandlebarsTemplateRenderer as jest.Mock).mockImplementation(() => mockTemplateRenderer);
    (EventBridgeGenerator as jest.Mock).mockImplementation(() => mockEventBridgeGenerator);
    (OpenAPISchemaValidator as jest.Mock).mockImplementation(() => mockSchemaValidator);
    (PythonEventBridgeGenerator as jest.Mock).mockImplementation(() => mockPythonEventBridgeGenerator);

    // Create generator instance with mocks
    generator = new OpenAPIGenerator(mockDocument, {
      logger: mockLogger
    });
  });

  describe('constructor', () => {
    it('should initialize with default options when none provided', () => {
      const defaultGenerator = new OpenAPIGenerator(mockDocument);
      expect(defaultGenerator).toBeDefined();
    });

    it('should throw error for invalid OpenAPI document', () => {
      const invalidDoc = { ...mockDocument, openapi: '2.0.0' };
      expect(() => new OpenAPIGenerator(invalidDoc as any)).toThrow('Invalid OpenAPI version. Expected 3.x.x but got 2.0.0');
    });
  });

  describe('processGeneratedFiles', () => {
    const outputPath = '/test/output';
    const sourceDir = join(outputPath, 'models', 'models');
    const targetDir = join(outputPath, 'models');

    beforeEach(() => {
      // Create generator instance with logger
      generator = new OpenAPIGenerator(mockDocument, {
        logger: mockLogger,
        language: 'python'
      });

      // Reset mock implementations
      let existsCalls = 0;
      mockFileSystem.exists.mockImplementation((path: string) => {
        if (path === join(outputPath, 'models', 'models')) return true;
        if (path === join(outputPath, 'models')) {
          existsCalls++;
          return existsCalls === 1; // First call returns true, second call returns false
        }
        return true;
      });

      mockFileSystem.readdir.mockReturnValue(['model1.py', 'model2.py']);
      mockFileSystem.moveFile.mockReturnValue(undefined);
      mockFileSystem.createDirectory.mockReturnValue(undefined);
      mockFileSystem.cleanup.mockReturnValue(undefined);

      // Reset logger mock
      mockLogger.error.mockClear();
    });

    it('should move Python model files and clean up extra directories', async () => {
      await (generator as any).processGeneratedFiles(outputPath);

      expect(mockFileSystem.createDirectory).toHaveBeenCalledWith(targetDir);
      expect(mockFileSystem.moveFile).toHaveBeenCalledWith(
        join(sourceDir, 'model1.py'),
        join(targetDir, 'model1.py')
      );
      expect(mockFileSystem.moveFile).toHaveBeenCalledWith(
        join(sourceDir, 'model2.py'),
        join(targetDir, 'model2.py')
      );
    });

    it('should handle missing output directory', async () => {
      mockFileSystem.exists.mockReturnValue(false);
      await (generator as any).processGeneratedFiles('/test/output');
      expect(mockFileSystem.createDirectory).not.toHaveBeenCalled();
    });

    it('should handle errors during file processing', async () => {
      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readdir.mockImplementation(() => {
        const error = new Error('File read error');
        mockLogger.error.mockImplementation((data: any) => {
          expect(data).toEqual({
            error,
            msg: 'Error processing files'
          });
        });
        throw error;
      });
      await expect((generator as any).processGeneratedFiles('/test/output')).rejects.toThrow('File read error');
    });
  });

  describe('generate', () => {
    const outputPath = '/test/output';
    const tempSpecPath = join(outputPath, '_temp_spec.json');

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();

      // Mock NodeFileSystem methods
      mockFileSystem.exists.mockImplementation((path: string) => {
        return path === join(outputPath, 'models') || path === outputPath || path.endsWith('_temp_spec.json');
      });

      mockFileSystem.readdir.mockImplementation((path: string) => {
        if (path === join(outputPath, 'models')) {
          return ['test.ts', 'test2.ts'];
        } else if (path === join(outputPath, 'models', 'models')) {
          return ['test.py', 'test2.py'];
        }
        return [];
      });

      mockFileSystem.readFile.mockReturnValue('test content');
      mockFileSystem.createDirectory.mockReturnValue(undefined);
      mockFileSystem.writeFile.mockReturnValue(undefined);
      mockFileSystem.cleanup.mockReturnValue(undefined);
      (execSync as jest.Mock).mockReturnValue(Buffer.from(''));

      // Create generator instance
      generator = new OpenAPIGenerator(mockDocument, {
        logger: mockLogger
      });
    });

    it('should generate code for the specified output directory', async () => {
      await generator.generate(outputPath);

      // Verify directory creation
      expect(mockFileSystem.createDirectory).toHaveBeenCalledWith(outputPath);

      // Verify temp file operations
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        tempSpecPath,
        JSON.stringify(mockDocument)
      );

      // Verify OpenAPI generator execution
      const expectedCommand = `npx @openapitools/openapi-generator-cli generate -i ${tempSpecPath} -g typescript -o ${outputPath} --global-property models,supportingFiles --additional-properties supportsES6=true,modelPropertyNaming=original,withInterfaces=true,generateApis=false,generateApiDocumentation=false,generateModelDocumentation=false,generateGitIgnore=false,snapshot=false,supportsMultipleInheritance=true,enumPropertyNaming=original,removeEnumValuePrefix=true,generateClient=false,useSingleRequestParameter=true,withoutHttpFiles=true,useObjectParameters=false,npmName=@homebound/schema-registry,npmVersion=1.0.0 --skip-validate-spec`;

      expect(execSync).toHaveBeenCalledWith(expectedCommand, { stdio: 'inherit' });
    });

    it('should handle errors during code generation', async () => {
      const error = new Error('Generation failed');
      (execSync as jest.Mock).mockImplementation(() => { throw error; });

      await expect(generator.generate(outputPath)).rejects.toThrow('Generation failed');
    });

    it('should handle cleanup after generation', async () => {
      await generator.generate(outputPath);

      // Verify cleanup operations
      expect(mockFileSystem.cleanup).toHaveBeenCalled();
    });

    it('should process TypeScript files correctly', async () => {
      const fileContent = 'import { HttpFile } from \'../http/http\';\nconst test = 1;';

      mockFileSystem.readFile.mockReturnValue(fileContent);
      
      await generator.generate(outputPath);

      // Verify file content processing
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'const test = 1;'
      );
    });
  });

  describe('generateEventBridgeFiles', () => {
    const outputPath = '/test/output';

    it('should generate TypeScript EventBridge files', async () => {
      await generator.generate(outputPath);

      expect(mockEventBridgeGenerator.generateEventFiles).toHaveBeenCalledWith(
        outputPath,
        mockDocument.components?.schemas || {}
      );
    });

    it('should generate Python EventBridge files when language is python', async () => {
      // Create a new generator instance with Python language option
      generator = new OpenAPIGenerator(mockDocument, {
        language: 'python',
        npmPackageName: '@test/schema-registry',
        npmVersion: '1.0.0',
        region: 'us-west-2',
        eventBusName: 'test-events',
        logger: mockLogger
      });

      await generator.generate(outputPath);

      expect(mockPythonEventBridgeGenerator.generateEventFiles).toHaveBeenCalledWith(
        outputPath,
        mockDocument.components?.schemas || {}
      );

      // Verify OpenAPI generator execution for Python
      const expectedCommand = `npx @openapitools/openapi-generator-cli generate -i ${join(outputPath, '_temp_spec.json')} -g python -o ${outputPath} --global-property models --additional-properties generateSourceCodeOnly=true,pythonVersion=3.9,generateModelDocumentation=false,generateGitIgnore=false,useDateTime=true,useType=true,generateClient=false,withoutHttpFiles=true,hideGenerationTimestamp=true,packageName=.,projectName=.,packageVersion=1.0.0,npmName=@test/schema-registry,npmVersion=1.0.0 --skip-validate-spec`;
      expect(execSync).toHaveBeenCalledWith(expectedCommand, { stdio: 'inherit' });
    });
  });
});
