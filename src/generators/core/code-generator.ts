import { OpenAPIV3 } from 'openapi-types';
import { execSync } from 'child_process';
import { join } from 'path';
import { readdirSync } from 'fs';
import pino, { Logger } from 'pino';
import { GeneratorConfig, GeneratorOptions, LanguageConfig, CleanupConfig } from './types';
import { HandlebarsTemplateRenderer } from '../typescript/services/template-renderer';
import { FileSystem, NodeFileSystem } from '../typescript/services/file-system';
import { OpenAPISchemaValidator } from '../typescript/services/schema-validator';
import { EventBridgeGenerator } from '../typescript/services/event-generator';

/**
 * Generator class that converts OpenAPI specifications into code with EventBridge integration.
 * This class handles the entire process of generating code from OpenAPI schemas, including:
 * - Validating the OpenAPI document
 * - Generating models for both TypeScript and Python
 * - Generating EventBridge publishers and consumers
 * - Cleaning up temporary files and folders
 *
 * The generator supports both TypeScript and Python code generation with appropriate
 * configurations and cleanup for each language.
 *
 * @example
 * ```typescript
 * const generator = new OpenAPIGenerator(openApiDoc, {
 *   npmPackageName: '@my-org/schema-registry',
 *   region: 'us-west-2',
 *   language: 'typescript' // or 'python'
 * });
 * await generator.generate('./output');
 * ```
 */
export class OpenAPIGenerator {
  /**
   * Configuration for cleaning up generated files.
   * Specifies which files and folders should be removed after code generation
   * for each supported language.
   */
  private static readonly CLEANUP_CONFIG: LanguageConfig<CleanupConfig> = {
    typescript: {
      files: [
        'git_push.sh', '.gitignore', '.npmignore', '.openapi-generator-ignore',
        'api.ts', 'configuration.ts', 'base.ts', 'common.ts', 'servers.ts',
        'README.md', 'package.json', 'tsconfig.json', '.eslintrc.js',
        'runtime.ts', '.gitattributes', 'index.ts', 'middleware.ts',
        'rxjsStub.ts', 'util.ts'
      ],
      folders: [
        '.openapi-generator', 'apis', 'http', 'auth', 'types'
      ]
    },
    python: {
      files: [
        'git_push.sh', '.gitignore', '.npmignore', '.openapi-generator-ignore',
        'README.md', 'setup.py', 'tox.ini', 'test-requirements.txt',
        'requirements.txt', '.travis.yml', '.gitlab-ci.yml'
      ],
      folders: [
        '.openapi-generator', 'test', 'docs', '.pytest_cache',
        '__pycache__', '*.egg-info', 'Bills'
      ]
    }
  } as const;

  /**
   * Configuration for the OpenAPI Generator CLI.
   * These settings control how the TypeScript code is generated:
   * - Generates only models and supporting files
   * - Uses ES6 features
   * - Preserves original property naming
   * - Disables unnecessary feature generation
   */
  private static readonly OPENAPI_GENERATOR_CONFIG: LanguageConfig<GeneratorConfig> = {
    typescript: {
      globalProperty: 'models,supportingFiles',
      additionalProperties: {
        supportsES6: true,
        modelPropertyNaming: 'original',
        withInterfaces: true,
        generateApis: false,
        generateApiDocumentation: false,
        generateModelDocumentation: false,
        generateGitIgnore: false,
        snapshot: false,
        supportsMultipleInheritance: true,
        enumPropertyNaming: 'original',
        removeEnumValuePrefix: true,
        generateClient: false,
        useSingleRequestParameter: true,
        withoutHttpFiles: true,
        useObjectParameters: false
      }
    },
    python: {
      globalProperty: 'models',
      additionalProperties: {
        generateSourceCodeOnly: true,
        pythonVersion: '3.9',
        generateModelDocumentation: false,
        generateGitIgnore: false,
        useDateTime: true,
        useType: true,
        generateClient: false,
        withoutHttpFiles: true,
        hideGenerationTimestamp: true,
        packageName: '.',
        projectName: '.',
        packageVersion: '1.0.0'
      }
    }
  } as const;

  /**
   * Default options for the generator.
   * These values will be used if not overridden in the constructor options.
   */
  private static readonly DEFAULT_OPTIONS: Required<GeneratorOptions> = {
    logger: OpenAPIGenerator.createDefaultLogger(),
    npmPackageName: '@homebound/schema-registry',
    npmVersion: '1.0.0',
    region: 'us-west-2',
    eventBusName: 'homebound-events',
    defaultSource: 'com.homebound',
    language: 'typescript'
  } as const;

  private readonly logger: Logger;
  private readonly fileSystem: FileSystem;
  private readonly templateRenderer: HandlebarsTemplateRenderer;
  private readonly options: Required<GeneratorOptions>;

  constructor(
    private readonly document: OpenAPIV3.Document,
    options: GeneratorOptions = {}
  ) {
    this.options = {
      ...OpenAPIGenerator.DEFAULT_OPTIONS,
      ...options
    };
    
    this.logger = this.options.logger;
    this.fileSystem = new NodeFileSystem(this.logger);
    this.templateRenderer = new HandlebarsTemplateRenderer();

    // Validate the OpenAPI document
    this.validateSchema();
  }

  /**
   * Creates a default Pino logger instance with pretty printing enabled.
   * This logger is used if no custom logger is provided in the options.
   * 
   * @returns {Logger} Configured Pino logger instance
   */
  private static createDefaultLogger(): Logger {
    return pino({
      transport: {
        target: 'pino-pretty'
      },
      level: process.env.LOG_LEVEL || 'info'
    });
  }

  /**
   * Validates the OpenAPI document structure and required fields.
   * Ensures that the document contains all necessary components for code generation.
   * 
   * @throws {Error} If the document is invalid or missing required fields
   */
  private validateSchema(): void {
    const validator = new OpenAPISchemaValidator(this.logger);
    validator.validate(this.document);
  }

  /**
   * Generates code from the OpenAPI document.
   * This is the main method that orchestrates the entire code generation process:
   * 1. Creates output directory
   * 2. Generates models using OpenAPI generator
   * 3. Processes generated files to remove unnecessary imports
   * 4. Generates EventBridge integration code
   * 5. Cleans up temporary files
   * 
   * @param {string} outputPath - Directory path where the generated code will be written
   * @throws {Error} If code generation fails at any step
   */
  async generate(outputPath: string): Promise<void> {
    try {
      this.logger.info({ path: outputPath }, 'Starting code generation');

      // Create output directory if it doesn't exist
      this.fileSystem.createDirectory(outputPath);

      // Write OpenAPI spec to temp file
      const tempSpecPath = join(outputPath, '_temp_spec.json');
      this.logger.debug({ path: tempSpecPath }, 'Writing temporary OpenAPI spec');
      this.fileSystem.writeFile(tempSpecPath, JSON.stringify(this.document));

      // Generate using openapi-generator
      this.logger.info('Running OpenAPI generator');
      const generatorConfig = OpenAPIGenerator.OPENAPI_GENERATOR_CONFIG[this.options.language];
      const command = `npx @openapitools/openapi-generator-cli generate -i ${tempSpecPath} -g ${this.options.language} -o ${outputPath} --global-property ${generatorConfig.globalProperty} --additional-properties ${this.buildAdditionalProperties()} --skip-validate-spec`;
      execSync(command, { stdio: 'inherit' });

      // Process model files based on language
      await this.processGeneratedFiles(outputPath);

      // Clean up temp file
      if (this.fileSystem.exists(tempSpecPath)) {
        this.logger.debug({ path: tempSpecPath }, 'Removing temporary spec file');
        this.fileSystem.cleanup([tempSpecPath], []);
      }

      // Generate EventBridge files
      this.logger.info('Generating EventBridge files');
      await this.generateEventBridgeFiles(outputPath);

      // Clean up generated files and folders
      const cleanupConfig = OpenAPIGenerator.CLEANUP_CONFIG[this.options.language];
      this.logger.debug({ files: cleanupConfig.files.length, folders: cleanupConfig.folders.length }, 'Cleaning up generated files');
      
      const filesToClean = cleanupConfig.files.map((file: string) => join(outputPath, file));
      const foldersToClean = cleanupConfig.folders.map((folder: string) => join(outputPath, folder));
      this.fileSystem.cleanup(filesToClean, foldersToClean);

      this.logger.info('Code generation completed successfully');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to generate code');
      throw error;
    }
  }

  /**
   * Builds additional properties string for OpenAPI Generator CLI.
   * Converts the configuration object into a comma-separated string of key=value pairs
   * that can be passed to the CLI tool.
   * 
   * @returns {string} Formatted string of additional properties
   */
  private buildAdditionalProperties(): string {
    const generatorConfig = OpenAPIGenerator.OPENAPI_GENERATOR_CONFIG[this.options.language];
    const props = {
      ...generatorConfig.additionalProperties,
      npmName: this.options.npmPackageName,
      npmVersion: this.options.npmVersion
    };
    return Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  /**
   * Generates EventBridge publisher and consumer files for event schemas.
   * Creates TypeScript classes that integrate with AWS EventBridge for event
   * publishing and consumption.
   * 
   * @param {string} outputPath - Directory path where event files will be generated
   * @throws {Error} If EventBridge file generation fails
   */
  /**
   * Process generated files based on the target language
   * @param outputPath - Directory path where files were generated
   */
  private async processGeneratedFiles(outputPath: string): Promise<void> {
    const modelsPath = join(outputPath, 'models');
    if (!this.fileSystem.exists(modelsPath)) return;

    if (this.options.language === 'typescript') {
      const modelFiles = this.fileSystem.readdir(modelsPath).filter(f => f.endsWith('.ts'));
      this.logger.debug({ fileCount: modelFiles.length }, 'Processing TypeScript model files');
      
      for (const file of modelFiles) {
        const filePath = join(modelsPath, file);
        this.logger.debug({ file }, 'Removing HTTP imports');
        let content = this.fileSystem.readFile(filePath);
        content = content.replace(/import \{ HttpFile \} from '\.\.\/http\/http';\n*/g, '');
        this.fileSystem.writeFile(filePath, content);
      }
    } else if (this.options.language === 'python') {
      this.logger.debug('Processing Python model files');
      const sourceDir = join(outputPath, 'models', 'models');
      if (this.fileSystem.exists(sourceDir)) {
        const files = this.fileSystem.readdir(sourceDir);
        this.logger.debug({ fileCount: files.length }, 'Moving Python model files');
        
        // Create models directory if it doesn't exist
        const targetDir = join(outputPath, 'models');
        if (!this.fileSystem.exists(targetDir)) {
          this.fileSystem.createDirectory(targetDir);
        }

        // Move each file
        for (const file of files) {
          const sourcePath = join(sourceDir, file);
          const targetPath = join(targetDir, file);
          this.logger.debug({ file, from: sourcePath, to: targetPath }, 'Moving file');
          this.fileSystem.moveFile(sourcePath, targetPath);
        }

        // Clean up extra directories
        const extraDirs = ['docs', 'test'];
        for (const dir of extraDirs) {
          const dirPath = join(outputPath, 'models', dir);
          if (this.fileSystem.exists(dirPath)) {
            this.fileSystem.cleanup([], [dirPath]);
          }
        }
        // Remove the nested models directory
        this.fileSystem.cleanup([], [sourceDir]);
      }
    }
  }

  /**
   * Generate EventBridge files based on the target language
   * @param outputPath - Directory path where files should be generated
   */
  private async generateEventBridgeFiles(outputPath: string): Promise<void> {
    if (this.options.language === 'python') {
      const { PythonEventBridgeGenerator } = require('../python/services/event-generator');
      const generator = new PythonEventBridgeGenerator(
        this.templateRenderer,
        this.fileSystem,
        this.logger,
        this.options,
        this.document
      );
      await generator.generateEventFiles(outputPath, this.document.components?.schemas || {});
    } else {
      const generator = new EventBridgeGenerator(
        this.templateRenderer,
        this.fileSystem,
        this.logger,
        this.options,
        this.document
      );
      await generator.generateEventFiles(outputPath, this.document.components?.schemas || {});
    }
  }
}
