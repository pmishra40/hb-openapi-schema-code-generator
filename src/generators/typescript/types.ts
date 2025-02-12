import { Logger } from 'pino';

/**
 * Configuration options for the OpenAPI TypeScript code generator
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
}
