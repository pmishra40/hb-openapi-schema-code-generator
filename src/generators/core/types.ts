import { Logger } from 'pino';

/**
 * Configuration options for the OpenAPI code generator
 */
export interface GeneratorOptions {
  /** Optional Pino logger instance. If not provided, a default logger will be created */
  logger?: Logger;
  /** NPM package name for the generated code */
  npmPackageName?: string;
  /** NPM package version for the generated code */
  npmVersion?: string;
  /** AWS region for EventBridge integration */
  region?: string;
  /** EventBridge event bus name */
  eventBusName?: string;
  /** Default source for EventBridge events */
  defaultSource?: string;
  /** Target programming language for code generation. Defaults to typescript */
  language?: 'typescript' | 'python';
}

/**
 * Generator configuration for OpenAPI generator
 * Controls how code is generated for each language
 */
export interface GeneratorConfig {
  /** Global properties to pass to the OpenAPI generator */
  globalProperty: string;
  /** Additional properties to configure code generation */
  additionalProperties: Record<string, string | boolean | number>;
}

/**
 * Cleanup configuration for generated files
 * Specifies which files and folders should be removed after code generation
 */
export interface CleanupConfig {
  /** List of files to clean up */
  files: string[];
  /** List of folders to clean up */
  folders: string[];
}

/**
 * Language-specific configurations
 * Maps each supported language to its specific configuration
 */
export type LanguageConfig<T> = {
  [K in Required<GeneratorOptions>['language']]: T;
};
