import { join } from 'path';
import { loadOpenAPIDocument } from '../../../../src/generators/core/scripts/code-generate';
import { OpenAPIV3 } from 'openapi-types';
import * as fs from 'fs';

const mockGenerate = jest.fn().mockResolvedValue(undefined);
const mockGenerator = {
  generate: mockGenerate
};

jest.mock('../../../../src/generators/core/code-generator', () => ({
  OpenAPIGenerator: jest.fn().mockImplementation(() => mockGenerator)
}));

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockImplementation((path: string) => {
    if (path.includes('test-schema.yaml')) {
      return fs.readFileSync(join(__dirname, '__fixtures__/test-schema.yaml'));
    }
    throw new Error(`File not found: ${path}`);
  })
}));

describe('code-generate', () => {
  const originalArgv = process.argv;
  const originalCwd = process.cwd;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.argv = [...originalArgv];
    process.cwd = jest.fn().mockReturnValue(join(__dirname, '__fixtures__'));
    process.env = { ...originalEnv };
    mockGenerate.mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.cwd = originalCwd;
    process.env = originalEnv;
  });

  describe('loadOpenAPIDocument', () => {
    it('should load and parse an OpenAPI document', async () => {
      const schemaPath = join(__dirname, '__fixtures__/test-schema.yaml');
      const document = await loadOpenAPIDocument(schemaPath);
      
      expect(document).toBeDefined();
      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Test API');
      expect(document.info.version).toBe('1.0.0');
      expect(document.components?.schemas?.TestEvent).toBeDefined();
    });

    it('should throw an error for invalid schema path', async () => {
      const invalidPath = join(__dirname, '__fixtures__/non-existent.yaml');
      await expect(loadOpenAPIDocument(invalidPath)).rejects.toThrow();
    });

    it('should throw an error for invalid schema content', async () => {
      const invalidSchemaPath = join(__dirname, '__fixtures__/invalid-schema.yaml');
      await expect(loadOpenAPIDocument(invalidSchemaPath)).rejects.toThrow();
    });
  });

  describe('main', () => {
    it('should throw error if schema name is missing', async () => {
      process.argv = ['node', 'script.js'];
      const { main } = require('../../../../src/generators/core/scripts/code-generate');
      await expect(main()).rejects.toThrow('Schema name is required');
    });

    it('should throw error if schema file is missing', async () => {
      process.argv = ['node', 'script.js', 'test-schema'];
      const { main } = require('../../../../src/generators/core/scripts/code-generate');
      await expect(main()).rejects.toThrow('Schema filename is required');
    });

    it('should generate code with default options', async () => {
      process.argv = ['node', 'script.js', 'test-schema', 'test-schema.yaml'];

      const { main } = require('../../../../src/generators/core/scripts/code-generate');
      await main();

      const { OpenAPIGenerator } = require('../../../../src/generators/core/code-generator');
      expect(OpenAPIGenerator).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          language: 'typescript'
        })
      );
      expect(mockGenerate).toHaveBeenCalledWith(expect.stringContaining('test-schema'));
    });

    it('should use custom language and output directory', async () => {
      process.env.TARGET_LANGUAGE = 'python';
      process.env.OUTPUT_DIR = 'custom-output';
      process.argv = ['node', 'script.js', 'test-schema', 'test-schema.yaml'];

      jest.resetModules();
      const { main } = require('../../../../src/generators/core/scripts/code-generate');
      await main();

      const { OpenAPIGenerator } = require('../../../../src/generators/core/code-generator');
      expect(OpenAPIGenerator).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          language: 'python'
        })
      );
      expect(mockGenerate).toHaveBeenCalledWith(expect.stringContaining('custom-output'));
    });
  });
});

