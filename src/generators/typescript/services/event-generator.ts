import { OpenAPIV3 } from 'openapi-types';
import { Logger } from 'pino';
import { TemplateRenderer } from './template-renderer';
import { FileSystem } from './file-system';
import { join } from 'path';
import { GeneratorOptions } from '../types';

/**
 * Represents an event definition from the OpenAPI schema
 * @interface EventDefinition
 */
export interface EventDefinition {
    /** The name of the event */
    name: string;
    /** The schema definition for the event, can be either a direct schema or a reference */
    schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
}

/**
 * Interface for event code generation
 */
/**
 * Interface for event code generation
 * Implementations of this interface handle the generation of event-related code,
 * such as publishers and consumers for event-driven architectures.
 */
export interface EventGenerator {
    /**
     * Generate event files for all events in the schema
     * @param outputPath Output directory path
     * @param schemas OpenAPI schemas
     */
    generateEventFiles(outputPath: string, schemas: { [key: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject }): Promise<void>;
}

/**
 * EventBridge implementation of event generator
 */
/**
 * AWS EventBridge implementation of the event generator.
 * This class generates TypeScript code for publishing and consuming events using AWS EventBridge.
 * It handles:
 * - Generation of publisher classes for sending events to EventBridge
 * - Generation of consumer classes for receiving events from EventBridge
 * - Resolution of schema references
 * - Template-based code generation
 */
export class EventBridgeGenerator implements EventGenerator {
    /**
     * Creates a new instance of EventBridgeGenerator
     * @param {TemplateRenderer} templateRenderer - Service for rendering Handlebars templates
     * @param {FileSystem} fileSystem - Service for file system operations
     * @param {Logger} logger - Logger instance for debugging and error reporting
     * @param {Required<GeneratorOptions>} options - Configuration options
     * @param {OpenAPIV3.Document} document - The complete OpenAPI document for reference resolution
     */
    constructor(
        private templateRenderer: TemplateRenderer,
        private fileSystem: FileSystem,
        private logger: Logger,
        private options: Required<GeneratorOptions>,
        private document: OpenAPIV3.Document
    ) {}

    /**
     * Resolves a reference object to its actual schema
     * @param ref Reference object to resolve
     * @returns Resolved schema object
     * @throws Error if reference cannot be resolved
     */
    private resolveReference(ref: OpenAPIV3.ReferenceObject): OpenAPIV3.SchemaObject {
        const refPath = ref.$ref.split('/').slice(1); // Remove the leading '#'
        let current: any = this.document;
        
        for (const segment of refPath) {
            current = current[segment];
            if (!current) {
                throw new Error(`Could not resolve reference: ${ref.$ref}`);
            }
        }

        if (this.isReferenceObject(current)) {
            return this.resolveReference(current);
        }

        return current as OpenAPIV3.SchemaObject;
    }

    /**
     * Type guard to check if an object is a reference
     */
    private isReferenceObject(obj: any): obj is OpenAPIV3.ReferenceObject {
        return obj && typeof obj === 'object' && '$ref' in obj;
    }

    /**
     * Generates event files for all events defined in the schema.
     * For each event schema:
     * 1. Creates a publisher class for sending events to EventBridge
     * 2. Creates a consumer class for receiving events from EventBridge
     * 3. Resolves any schema references to their concrete implementations
     * 
     * @param {string} outputPath - Directory where event files will be generated
     * @param {{ [key: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject }} schemas - Map of schema names to their definitions
     * @throws {Error} If file generation fails or schema references cannot be resolved
     */
    async generateEventFiles(outputPath: string, schemas: { [key: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject }): Promise<void> {
        try {
            const events = Object.entries(schemas)
                .filter(([name]) => name.endsWith('Event'))
                .map(([name, schema]) => ({
                    name,
                    schema: this.isReferenceObject(schema) ? this.resolveReference(schema) : schema,
                }));

            this.logger.debug({ eventCount: events.length }, 'Found events to process');

            // Create events directory
            const eventsPath = join(outputPath, 'events');
            this.fileSystem.createDirectory(eventsPath);

            // Load templates
            const publisherTemplate = this.fileSystem.readFile(join(__dirname, '../templates', 'eventbridge-publisher.hbs'));
            const consumerTemplate = this.fileSystem.readFile(join(__dirname, '../templates', 'eventbridge-consumer.hbs'));

            // Generate event files
            for (const event of events) {
                this.logger.debug({ event: event.name }, 'Generating event files');

                const templateData = {
                    ...event,
                    importPath: '../models',
                    toLowerCase: (str: string) => str.toLowerCase(),
                    options: this.options
                };

                // Generate publisher
                const publisherContent = this.templateRenderer.render(publisherTemplate, templateData);
                this.fileSystem.writeFile(join(eventsPath, `${event.name}.publisher.ts`), publisherContent);

                // Generate consumer
                const consumerContent = this.templateRenderer.render(consumerTemplate, templateData);
                this.fileSystem.writeFile(join(eventsPath, `${event.name}.consumer.ts`), consumerContent);

                this.logger.debug({ event: event.name }, 'Event files generated successfully');
            }
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to generate EventBridge files');
            throw error;
        }
    }
}
