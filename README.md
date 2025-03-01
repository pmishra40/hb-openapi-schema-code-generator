# HB Schema Registry - OpenAPI Generator

## Overview

The HB Schema Registry OpenAPI Integration Generator is a powerful tool that transforms OpenAPI specifications into type-safe code with seamless AWS EventBridge integration. It supports both TypeScript and Python, automating the creation of event publishers, consumers, and data models while ensuring strict type safety and schema validation.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Development](#development)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Integration Examples](#integration-examples)
9. [Contributing](#contributing)

## Features

### Core Capabilities

1. **Multi-Language Support**
   - TypeScript with full type safety
   - Python with Pydantic models
   - Language-specific best practices
   - Consistent patterns across languages

2. **AWS EventBridge Integration**
   - Automated event publisher generation
   - Type-safe event consumer classes
   - Configurable event bus settings
   - Source and detail-type customization
   - Cross-account event routing

3. **Schema Validation**
   - OpenAPI 3.x specification validation
   - Runtime type checking
   - Detailed error reporting
   - Schema compatibility verification

4. **Code Generation**
   - Clean, maintainable output
   - Customizable templates
   - Automatic cleanup
   - Support for nested schemas
   - Reference resolution

## Architecture

### Technology Stack

#### Core Technologies

1. **OpenAPI Generator CLI**
   The OpenAPI Generator CLI is a cornerstone of our code generation strategy, chosen for several key reasons:

   - **Robust Schema Parsing**
     ```yaml
     # OpenAPI schema
     components:
       schemas:
         UserEvent:
           type: object
           properties:
             userId:
               type: string
     ```
     The CLI provides battle-tested parsing of OpenAPI schemas, handling complex features like:
     - Nested references
     - Inheritance
     - Polymorphism
     - Type aliases
     - Complex validation rules

   - **Multi-Language Support**
     While we currently support TypeScript and Python, the CLI's architecture allows easy expansion to other languages:
     ```typescript
     // Language-specific generators
     class TypeScriptGenerator extends BaseGenerator {
       protected async generateTypes(): Promise<void> {
         // Use OpenAPI Generator for base types
         await this.generateBaseTypes();
         // Add EventBridge-specific code
         await this.generateEventCode();
       }
     }
     ```

   - **CLI Usage**
     The OpenAPI Generator can be used directly from the terminal:
     ```bash
     # Install globally
     npm install @openapitools/openapi-generator-cli -g

     # Generate TypeScript client
     openapi-generator-cli generate \
       -i path/to/schema.yaml \
       -g typescript-node \
       -o ./generated \
       --additional-properties=supportsES6=true,npmName=@org/events

     # Generate Python client with type hints
     openapi-generator-cli generate \
       -i path/to/schema.yaml \
       -g python \
       -o ./generated \
       --additional-properties=packageName=myorg.events,pythonVersion=3.8

     # List available generators
     openapi-generator-cli list

     # Validate OpenAPI schema
     openapi-generator-cli validate -i path/to/schema.yaml
     ```

     The CLI supports numerous configuration options:
     ```bash
     # TypeScript configuration
     --additional-properties=\
     supportsES6=true,\
     modelPropertyNaming=camelCase,\
     enumPropertyNaming=UPPERCASE,\
     npmName=@org/events,\
     npmVersion=1.0.0

     # Python configuration
     --additional-properties=\
     packageName=myorg.events,\
     pythonVersion=3.8,\
     generateSourceCodeOnly=true,\
     useNose=true
     ```

   - **Type Generation**
     The CLI excels at generating accurate types:
     ```typescript
     // Generated TypeScript interfaces
     export interface UserEvent {
       userId: string;
       metadata?: EventMetadata;
       timestamp: string;
     }
     ```

2. **Handlebars Templating Engine**
   Handlebars was chosen as our templating engine for several compelling reasons:

   - **Powerful Helper System**
     ```handlebars
     {{!-- Custom helper for EventBridge --}}
     {{#eventType schema}}
       export class {{className}}Publisher {
         constructor(private config: EventBridgeConfig) {}
         
         async publish(event: {{className}}) {
           return this.eventBridge.putEvents({
             Entries: [{
               EventBusName: this.config.eventBusName,
               Source: {{source}},
               DetailType: {{detailType}},
               Detail: JSON.stringify(event)
             }]
           });
         }
       }
     {{/eventType}}
     ```

   - **Compile-time Template Validation**
     ```typescript
     // Template compilation and caching
     class TemplateRenderer {
       private readonly cache = new Map<string, HandlebarsTemplateDelegate>();

       async render(template: string, data: any): Promise<string> {
         let compiled = this.cache.get(template);
         if (!compiled) {
           compiled = Handlebars.compile(template);
           this.cache.set(template, compiled);
         }
         return compiled(data);
       }
     }
     ```

   - **Clean Separation of Logic**
     ```typescript
     // Template data preparation
     interface TemplateData {
       className: string;
       eventType: string;
       properties: PropertyDefinition[];
       imports: ImportDefinition[];
     }

     class TemplateDataBuilder {
       build(schema: OpenAPIV3.SchemaObject): TemplateData {
         // Extract and transform schema data
         return {
           className: this.getClassName(schema),
           eventType: this.getEventType(schema),
           properties: this.getProperties(schema),
           imports: this.getImports(schema)
         };
       }
     }
     ```

3. **Type Systems**

   - **TypeScript**
     ```typescript
     // Strong type checking at compile time
     interface EventBridgeConfig {
       readonly region: string;
       readonly eventBusName: string;
       readonly source?: string;
     }
     ```

   - **Pydantic (Python)**
     ```python
     # Runtime type validation
     class EventBridgeConfig(BaseModel):
         region: str
         event_bus_name: str
         source: Optional[str]
     ```

#### Code Generation Process

The code generation pipeline consists of several sophisticated steps:

1. **Schema Processing**
   ```typescript
   class SchemaProcessor {
     async process(schema: OpenAPIV3.Document): Promise<ProcessedSchema> {
       // 1. Validate schema
       await this.validateSchema(schema);

       // 2. Resolve references
       const resolved = await this.resolveReferences(schema);

       // 3. Extract event definitions
       const events = this.extractEvents(resolved);

       // 4. Generate type definitions
       const types = await this.generateTypes(events);

       return { events, types };
     }
   }
   ```

2. **Template Rendering**
   ```typescript
   class CodeGenerator {
     async generate(schema: ProcessedSchema): Promise<void> {
       // 1. Prepare template data
       const data = this.prepareTemplateData(schema);

       // 2. Render templates
       const files = await Promise.all([
         this.renderPublishers(data),
         this.renderConsumers(data),
         this.renderModels(data)
       ]);

       // 3. Write files
       await this.writeFiles(files);
     }
   }
   ```

3. **Post-Processing**
   ```typescript
   class PostProcessor {
     async process(files: GeneratedFile[]): Promise<void> {
       // 1. Format code
       await this.formatCode(files);

       // 2. Add headers
       await this.addHeaders(files);

       // 3. Organize imports
       await this.organizeImports(files);

       // 4. Validate output
       await this.validateOutput(files);
     }
   }
   ```

This architecture provides several key benefits:
- **Extensibility**: New languages can be added by implementing language-specific generators
- **Maintainability**: Clear separation of concerns between schema processing, code generation, and post-processing
- **Reliability**: Strong typing and validation at every step
- **Performance**: Template caching and parallel processing for efficient generation

### Project Structure

```
src/
├── generators/
│   ├── core/                 # Core generation logic
│   │   ├── code-generator.ts # Main generator
│   │   ├── services/        # Shared services
│   │   └── scripts/         # CLI scripts
│   ├── typescript/          # TypeScript specific
│   │   ├── services/        # TS services
│   │   ├── templates/       # TS templates
│   │   └── types.ts         # TS type definitions
│   └── python/             # Python specific
│       ├── services/        # Python services
│       └── templates/       # Python templates
test/                       # Test suite
└── generators/             # Generator tests
    ├── core/               # Core tests
    ├── typescript/         # TS tests
    └── python/            # Python tests
```

### Core Components

1. **OpenAPI Generator (`core/code-generator.ts`)**
   - Central orchestrator for code generation
   - Validates OpenAPI documents
   - Manages multi-language code generation
   - Handles file system operations
   - Implements cleanup procedures

2. **Language-Specific Generators**
   - **TypeScript Generator**:
     - Generates TypeScript interfaces and types
     - Creates EventBridge integration classes
     - Implements TypeScript-specific validations
   - **Python Generator**:
     - Generates Pydantic models
     - Creates Python EventBridge classes
     - Implements Python-specific validations

3. **Event Generators**
   - Resolves schema references
   - Generates event publisher classes
   - Creates event consumer implementations
   - Handles AWS EventBridge integration

4. **Template System**
   - Handlebars-based templating
   - Language-specific templates
   - Extensible helper functions
   - Template caching for performance

## Installation

### Prerequisites

1. **Node.js and npm**
   ```bash
   # Check versions
   node --version  # >= 14.x
   npm --version   # >= 6.x
   ```

2. **Python (for Python generation)**
   ```bash
   # Check version
   python --version  # >= 3.8
   ```

### Setup

1. **Install Package Dependencies**
   ```bash
   # Install npm packages
   npm install

   # Install OpenAPI generator CLI
   npm install @openapitools/openapi-generator-cli -g
   ```

2. **Configure AWS Credentials**
   ```bash
   # Set up AWS credentials for EventBridge
   aws configure
   ```

## Usage

### Code Generation

1. **TypeScript Generation**
   ```bash
   # Generate TypeScript code
   npm run generate -- \
     --schema=path/to/schema.yaml \
     --language=typescript \
     --eventBus=my-event-bus \
     --region=us-west-2
   ```

   **Generated Output:**
   - Type definitions (`*.types.ts`)
   - Event publishers (`*.publisher.ts`)
   - Event consumers (`*.consumer.ts`)
   - Model interfaces

2. **Python Generation**
   ```bash
   # Generate Python code
   npm run generate -- \
     --schema=path/to/schema.yaml \
     --language=python \
     --eventBus=my-event-bus \
     --region=us-west-2
   ```

   **Generated Output:**
   - Pydantic models (`models/*.py`)
   - Event publishers (`events/*_publisher.py`)
   - Event consumers (`events/*_consumer.py`)
   - Type hints

### Configuration

1. **Generator Options**
   ```typescript
   interface GeneratorOptions {
     // Required
     language: 'typescript' | 'python';
     schemaPath: string;
     
     // Optional
     eventBusName?: string;     // AWS EventBridge bus
     region?: string;           // AWS region
     source?: string;           // Event source prefix
     outputDir?: string;        // Output directory
     clean?: boolean;           // Clean output dir
     debug?: boolean;           // Debug logging
   }
   ```

2. **AWS Configuration**
   ```typescript
   interface AWSConfig {
     region: string;
     eventBusName: string;
     source?: string;
     credentials?: {
       accessKeyId: string;
       secretAccessKey: string;
     };
   }
   ```

## Development

### Local Development

1. **Setup Development Environment**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/schema-registry.git
   cd schema-registry

   # Install dependencies
   npm install

   # Build project
   npm run build
   ```

2. **Run Tests**
   ```bash
   # Run all tests
   npm test

   # Run specific test suites
   npm test -- --testPathPattern=typescript
   npm test -- --testPathPattern=python

   # Run with coverage
   npm run test:coverage

   # Watch mode for development
   npm run test:watch
   ```

3. **Code Quality**
   ```bash
   # Run linter
   npm run lint

   # Run type checker
   npm run type-check

   # Format code
   npm run format
   ```

### Adding Features

1. **New Templates**
   ```typescript
   // 1. Add template file
   // src/generators/typescript/templates/new-template.ts.hbs
   export class {{className}} {
     // Template content
   }

   // 2. Register template
   // src/generators/typescript/services/template-registry.ts
   registerTemplate('new-template', {
     path: 'new-template.ts.hbs',
     output: '{{name}}.new.ts'
   });
   ```

2. **New Event Types**
   ```typescript
   // 1. Define event interface
   interface NewEvent {
     type: string;
     payload: any;
   }

   // 2. Add event generator
   class NewEventGenerator {
     generate(schema: OpenAPIV3.Document): string {
       // Generation logic
     }
   }
   ```

3. **Custom Generators**
   ```typescript
   // Extend base generator
   class CustomGenerator extends BaseGenerator {
     protected async generateCode(): Promise<void> {
       // Custom generation logic
     }
   }
   ```

## Error Handling

### Schema Validation

1. **OpenAPI Validation**
   ```yaml
   # Valid schema
   openapi: 3.0.0
   info:
     title: API Title
     version: 1.0.0
   components:
     schemas:
       UserEvent:
         type: object
         properties:
           userId:
             type: string
   ```

2. **Common Errors**
   ```typescript
   // 1. Invalid schema version
   Error: Schema validation failed: Invalid OpenAPI version

   // 2. Missing required fields
   Error: Schema validation failed: Missing required field 'info.title'

   // 3. Invalid event name
   Error: Invalid event name 'User'. Must end with 'Event'
   ```

### Runtime Errors

1. **AWS Integration**
   ```typescript
   try {
     await publisher.publish(event);
   } catch (error) {
     if (error instanceof EventBridgeError) {
       // Handle AWS-specific errors
     }
     // Handle other errors
   }
   ```

2. **Code Generation**
   ```typescript
   // 1. Template errors
   Error: Failed to compile template: invalid syntax

   // 2. File system errors
   Error: Failed to write file: permission denied

   // 3. Reference errors
   Error: Unable to resolve reference '#/components/schemas/Missing'
   ```

### Error Recovery

1. **Automatic Cleanup**
   ```typescript
   try {
     await generator.generate();
   } catch (error) {
     // Cleanup temporary files
     await generator.cleanup();
     throw error;
   }
   ```

2. **Partial Success**
   ```typescript
   // Continue on non-fatal errors
   const results = await generator.generate({
     continueOnError: true
   });
   
   // Check for partial failures
   results.failures.forEach(failure => {
     console.error(`Failed to generate ${failure.file}`, failure.error);
   });
   ```
## Best Practices

### Schema Design

1. **Event Naming**
   ```yaml
   components:
     schemas:
       # Good - Clear event name
       UserCreatedEvent:
         type: object

       # Bad - Missing 'Event' suffix
       UserUpdated:
         type: object
   ```

2. **Property Naming**
   ```yaml
   # Good - Consistent casing
   UserEvent:
     type: object
     properties:
       userId: string      # camelCase for TS
       user_id: string     # snake_case for Python

   # Bad - Mixed casing
   UserEvent:
     properties:
       UserID: string      # Inconsistent casing
       User_Name: string   # Mixed convention
   ```

3. **Schema Organization**
   ```yaml
   # Good - Modular organization
   components:
     schemas:
       User:
         type: object
         properties:
           id: string
           name: string

       UserCreatedEvent:
         type: object
         properties:
           user:
             $ref: '#/components/schemas/User'
           timestamp: string
   ```

### Code Generation

1. **Output Structure**
   ```typescript
   // Organize by domain and type
   generated/
     ├── users/
     │   ├── models/
     │   │   └── user.ts
     │   └── events/
     │       ├── user-created.publisher.ts
     │       └── user-created.consumer.ts
     └── orders/
         └── ...
   ```

2. **Type Safety**
   ```typescript
   // Use strict types
   interface UserEvent {
     userId: string;        // Required field
     metadata?: EventMeta;  // Optional field
     timestamp: Date;       // Specific type
   }

   // Avoid any
   function handleEvent(event: UserEvent) {
     // Type-safe handling
   }
   ```

### AWS Integration

1. **Event Bus Configuration**
   ```typescript
   // Separate buses for environments
   const config = {
     development: {
       eventBusName: 'dev-events',
       region: 'us-west-2'
     },
     production: {
       eventBusName: 'prod-events',
       region: 'us-west-2'
     }
   };
   ```

2. **Error Handling**
   ```typescript
   // Implement retries
   const publisher = new EventPublisher({
     maxRetries: 3,
     retryDelay: 1000,
     errorHandler: (error) => {
       // Custom error handling
     }
   });
   ```

## Integration Examples

### AWS Lambda Integration

1. **TypeScript Lambda**
   ```typescript
   import { UserEventConsumer } from './generated/users';

   export const handler = async (event: any) => {
     const consumer = new UserEventConsumer();
     
     if (consumer.isUserCreatedEvent(event)) {
       const { userId, metadata } = event.detail;
       // Handle user creation
       return {
         statusCode: 200,
         body: JSON.stringify({ userId })
       };
     }
     
     return {
       statusCode: 400,
       body: 'Unsupported event type'
     };
   };
   ```

2. **Python Lambda**
   ```python
   from generated.users import UserEventConsumer
   import json

   def handler(event, context):
       consumer = UserEventConsumer()
       
       if consumer.is_user_created_event(event):
           user_id = event['detail']['user_id']
           # Handle user creation
           return {
               'statusCode': 200,
               'body': json.dumps({'user_id': user_id})
           }
       
       return {
           'statusCode': 400,
           'body': 'Unsupported event type'
       }
   ```

### Testing Examples

1. **Unit Testing Publishers**
   ```typescript
   describe('UserEventPublisher', () => {
     let publisher: UserEventPublisher;
     let mockEventBridge: jest.Mock;

     beforeEach(() => {
       mockEventBridge = jest.fn();
       publisher = new UserEventPublisher({
         eventBridge: mockEventBridge
       });
     });

     it('publishes user created events', async () => {
       await publisher.publishUserCreated({
         userId: '123',
         metadata: { source: 'test' }
       });

       expect(mockEventBridge).toHaveBeenCalledWith({
         EventBusName: 'test-bus',
         Source: 'com.myapp.users',
         DetailType: 'UserCreatedEvent',
         Detail: expect.any(String)
       });
     });
   });
   ```

2. **Integration Testing**
   ```typescript
   describe('User API Integration', () => {
     it('creates user and publishes event', async () => {
       // Create user
       const response = await request(app)
         .post('/users')
         .send({
           name: 'Test User',
           email: 'test@example.com'
         });

       expect(response.status).toBe(201);

       // Verify event was published
       const events = await getEventsFromBus();
       expect(events).toContainEqual({
         detail_type: 'UserCreatedEvent',
         detail: {
           user_id: response.body.id
         }
       });
     });
   });
   ```

### Schema Validation Errors

The generator performs strict validation of your OpenAPI schemas:

1. **OpenAPI Version**
   ```yaml
   openapi: 3.0.0  # Must be OpenAPI 3.x
   ```

2. **Required Fields**
   ```yaml
   info:
     title: Your API Title    # Required
     version: 1.0.0          # Required
   components:
     schemas:                # Required
       YourSchema:
         type: object
   ```

3. **Event Schema Requirements**
   ```yaml
   components:
     schemas:
       BillCreatedEvent:     # Must end with 'Event'
         type: object
         properties:
           billId:
             type: string
   ```

### Common Errors and Solutions

1. **Invalid Schema Structure**
   ```
   Error: Schema validation failed: Missing required field 'info.title'
   Solution: Ensure your OpenAPI schema has all required fields
   ```

2. **Event Naming**
   ```
   Error: Schema 'BillCreated' is not a valid event (must end with 'Event')
   Solution: Rename schema to 'BillCreatedEvent'
   ```

3. **Reference Resolution**
   ```
   Error: Unable to resolve reference '#/components/schemas/NonExistentType'
   Solution: Ensure all referenced types exist in your schema
   ```

## Troubleshooting

### Common Issues

1. **Generated Code Not Found**
   - Check the output directory specified
   - Ensure schema file path is correct
   - Verify file permissions

2. **Type Errors in Generated Code**
   - Validate schema types are correct
   - Check for circular references
   - Ensure all required properties are defined

3. **EventBridge Integration Issues**
   - Verify AWS credentials are set up
   - Check region configuration
   - Ensure event bus exists
   - Validate event patterns

### Debug Mode

Enable debug logging for detailed output:

```bash
# TypeScript generation with debug
npm run generate -- --schema=path/to/schema.yaml --language=typescript --debug

# Python generation with debug
npm run generate -- --schema=path/to/schema.yaml --language=python --debug
```

### Logging

The generator uses Pino for logging. Configure log levels in your options:

```typescript
const generator = new OpenAPIGenerator(document, {
  logger: pino({ level: 'debug' })
});
```

## Performance Optimization

### Template Caching

The template renderer caches compiled templates for better performance:

```typescript
// Templates are compiled once and cached
const renderer = new HandlebarsTemplateRenderer();
await renderer.render('event_publisher', data); // First call compiles
await renderer.render('event_publisher', data); // Uses cached template
```

### Parallel Processing

For multiple schemas, use parallel processing:

```bash
# Process multiple schemas in parallel
npm run generate-all -- --schemas="schemas/*.yaml" --parallel
```

## Integration Examples

### AWS Lambda Integration

1. **TypeScript Lambda**
```typescript
import { BillEventConsumer } from './generated/typescript/bills';

export const handler = async (event: any) => {
  const consumer = new BillEventConsumer();
  
  if (consumer.isBillCreatedEvent(event)) {
    // Type-safe event handling
    const { billId, amount } = event.detail;
    // Process the bill...
  }
};
```

2. **Python Lambda**
```python
from generated.python.bills import BillEventConsumer

def handler(event, context):
    consumer = BillEventConsumer()
    
    if consumer.is_bill_created_event(event):
        # Type-safe event handling
        bill_id = event['detail']['bill_id']
        amount = event['detail']['amount']
        # Process the bill...
```

### Event Handling

```typescript
// Generated Publisher Example
const publisher = new TestEventPublisher();
await publisher.publish({
  id: "123",
  data: "test"
});

// Generated Consumer Example
const consumer = new TestEventConsumer();
consumer.on("TestEvent", (event) => {
  // Type-safe event handling
  console.log(event.id);
});
```

## Usage

### TypeScript Generation
```bash
# Generate TypeScript code for Bills schema
npm run generate:bills

# Generate TypeScript code for Journals schema
npm run generate:journals
```

### Python Generation
```bash
# Generate Python code for Bills schema
npm run generate:bills:python

# Generate Python code for Journals schema
npm run generate:journals:python
```

### Output Directory Configuration

By default, code is generated in the `generated` directory with the following structure:
```
generated/
├── python/
│   ├── Bills/
│   └── Journals/
└── typescript/
    ├── Bills/
    └── Journals/
```

You can customize the output directory using the `OUTPUT_DIR` environment variable:

```bash
# Generate in a custom directory
OUTPUT_DIR=/path/to/output npm run generate:bills

# Generate Python code in a custom directory
OUTPUT_DIR=/path/to/output npm run generate:bills:python
```

The code will be generated in:
- TypeScript: `$OUTPUT_DIR/typescript/<Schema>`
- Python: `$OUTPUT_DIR/python/<Schema>`

Note: The clean scripts (`clean:bills` and `clean:journals`) will also use the specified output directory.

## Testing Strategy

1. **Unit Tests**
   - Comprehensive test coverage
   - Mock implementations for external dependencies
   - Snapshot testing for generated code
   - Isolated component testing

2. **Integration Tests**
   - End-to-end code generation testing
   - EventBridge integration verification
   - Template rendering validation

## Best Practices

1. **Code Generation**
   - Clear separation of concerns
   - Modular architecture
   - Extensive error handling
   - Comprehensive logging

2. **Type Safety**
   - Strict TypeScript configuration
   - Extensive type checking
   - Runtime type validation

3. **Error Handling**
   - Detailed error messages
   - Proper error propagation
   - Comprehensive error logging

## Usage

```bash
# Install dependencies
npm install

# Generate code from OpenAPI spec
npm run generate -- --schema path/to/schema.yaml --output ./generated

# Run tests
npm test
```

## Configuration Options

```typescript
interface GeneratorOptions {
  npmPackageName?: string;
  npmVersion?: string;
  region?: string;
  eventBusName?: string;
  defaultSource?: string;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

