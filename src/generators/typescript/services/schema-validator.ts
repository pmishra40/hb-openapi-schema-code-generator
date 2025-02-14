import { OpenAPIV3 } from 'openapi-types';
import { Logger } from 'pino';

/**
 * Interface for OpenAPI schema validation
 */
export interface SchemaValidator {
    /**
     * Validates an OpenAPI document
     * @param document OpenAPI document to validate
     * @throws Error if document is invalid
     */
    validate(document: OpenAPIV3.Document): void;
}

/**
 * OpenAPI schema validator implementation
 */
export class OpenAPISchemaValidator implements SchemaValidator {
    constructor(private logger: Logger) {}

    validate(document: OpenAPIV3.Document): void {
        if (!document) {
            throw new Error('OpenAPI document is required');
        }
        
        // Validate OpenAPI version first
        if (!document.openapi) {
            throw new Error('OpenAPI version is required');
        }
        if (!document.openapi.startsWith('3.')) {
            throw new Error(`Invalid OpenAPI version. Expected 3.x.x but got ${document.openapi}`);
        }

        // Validate required document structure
        if (!document.components?.schemas) {
            throw new Error('OpenAPI document must contain components.schemas');
        }
        if (!document.info) {
            throw new Error('OpenAPI info section is required');
        }
        if (!document.info.title) {
            throw new Error('OpenAPI info.title is required');
        }
        if (!document.info.version) {
            throw new Error('OpenAPI info.version is required');
        }
    
        this.logger.debug({ 
            title: document.info.title,
            version: document.info.version
        }, 
        'OpenAPI document validated successfully');
    }
}
