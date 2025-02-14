import { OpenAPIV3 } from 'openapi-types';
import { Logger } from 'pino';
import { HandlebarsTemplateRenderer } from '../../core/services/template-renderer';
import { FileSystem } from '../../core/services/file-system';
import { join } from 'path';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { GeneratorOptions } from '../../core/types';

/**
 * AWS EventBridge implementation of the event generator for Python.
 * This class generates Python code for publishing and consuming events using AWS EventBridge.
 */
export class PythonEventBridgeGenerator {
    constructor(
        private templateRenderer: HandlebarsTemplateRenderer,
        private fileSystem: FileSystem,
        private logger: Logger,
        private options: Required<GeneratorOptions>,
        private document: OpenAPIV3.Document
    ) {}

    /**
     * Resolves a reference object to its actual schema
     */
    private resolveReference(ref: OpenAPIV3.ReferenceObject): OpenAPIV3.SchemaObject {
        const refPath = ref.$ref.split('/').slice(1);
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
     * Convert a string to snake case (e.g., BillEvent -> bill_event)
     */
    private toSnakeCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }

    /**
     * Generates event files for all events defined in the schema.
     */
    async generateEventFiles(outputPath: string, schemas: { [key: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject }): Promise<void> {
        try {
            const events = Object.entries(schemas)
                .filter(([name]) => name.endsWith('Event'))
                .map(([name, schema]) => ({
                    name,
                    modelName: name,
                    snakeCase: (str: string) => this.toSnakeCase(str),
                    schema: this.isReferenceObject(schema) ? this.resolveReference(schema) : schema,
                }));

            this.logger.debug({ eventCount: events.length }, 'Found events to process');

            // Create models directory if it doesn't exist
            const modelsPath = join(outputPath, 'models');
            if (!this.fileSystem.exists(modelsPath)) {
                this.fileSystem.createDirectory(modelsPath);
            }

            // Create events directory
            const eventsPath = join(outputPath, 'events');
            this.fileSystem.createDirectory(eventsPath);

            // Load templates
            const publisherTemplate = readFileSync(join(__dirname, '../templates', 'event_publisher.py.hbs'), 'utf-8');
            const consumerTemplate = readFileSync(join(__dirname, '../templates', 'event_consumer.py.hbs'), 'utf-8');

            // Generate event files
            for (const event of events) {
                this.logger.debug({ event: event.name }, 'Generating Python event files');

                const templateData = {
                    ...event,
                    ...this.options,
                };

                // Generate publisher
                const publisherContent = this.templateRenderer.render(publisherTemplate, templateData);
                this.fileSystem.writeFile(join(eventsPath, `${this.toSnakeCase(event.name)}_publisher.py`), publisherContent);

                // Generate consumer
                const consumerContent = this.templateRenderer.render(consumerTemplate, templateData);
                this.fileSystem.writeFile(join(eventsPath, `${this.toSnakeCase(event.name)}_consumer.py`), consumerContent);

                this.logger.debug({ event: event.name }, 'Python event files generated successfully');
            }
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to generate Python EventBridge files');
            throw error;
        }
    }
}
