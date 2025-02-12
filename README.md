# HB Schema Registry OpenAPI Integration Generator

## Overview

The HB Schema Registry OpenAPI Integration Generator is a TypeScript code generator that transforms OpenAPI specifications into type-safe TypeScript code with seamless AWS EventBridge integration. This tool is designed to automate the creation of event publishers and consumers while maintaining strict type safety and ensuring consistent event schema validation.

## Architecture

### Core Components

1. **TypeScript Code Generator (`ts-code-generator.ts`)**
   - Main orchestrator for the code generation process
   - Handles OpenAPI document validation
   - Manages the generation of TypeScript models
   - Coordinates EventBridge integration code generation
   - Implements cleanup of temporary files

2. **Event Generator (`services/event-generator.ts`)**
   - Generates EventBridge publisher and consumer classes
   - Resolves schema references
   - Handles event type definitions
   - Manages AWS EventBridge integration points

3. **Template Renderer (`services/template-renderer.ts`)**
   - Implements Handlebars-based template rendering
   - Manages template compilation and data binding
   - Provides extensible template helper functions

4. **File System Service (`services/file-system.ts`)**
   - Handles file system operations
   - Manages directory creation and cleanup
   - Implements file reading and writing operations

5. **Schema Validator (`services/schema-validator.ts`)**
   - Validates OpenAPI document structure
   - Ensures schema compliance
   - Provides detailed validation error reporting

### Directory Structure

```
src/
├── generators/
│   └── typescript/
│       ├── __tests__/        # Unit tests
│       ├── services/         # Core services
│       ├── templates/        # Handlebars templates
│       ├── ts-code-generator.ts
│       └── types.ts
├── scripts/
│   └── ts-code-generate.ts   # CLI entry point
└── utils/
    └── openapi.ts           # OpenAPI utilities
```

## Technology Choices

### 1. TypeScript
- **Why**: Provides strong type safety and excellent IDE support
- **Benefits**:
  - Catch errors at compile time
  - Enhanced code documentation through types
  - Better refactoring support
  - Improved developer experience

### 2. OpenAPI (v3)
- **Why**: Industry standard for API specifications
- **Benefits**:
  - Widespread tooling support
  - Clear schema validation
  - Language-agnostic specification
  - Rich ecosystem of tools and libraries

### 3. Handlebars
- **Why**: Powerful templating engine with TypeScript support
- **Benefits**:
  - Advanced templating features (helpers, partials)
  - Clean separation of logic and presentation
  - Extensible through custom helpers
  - Strong community support
  - Better control flow than alternatives like Mustache

### 4. Jest
- **Why**: Comprehensive testing framework
- **Benefits**:
  - Rich mocking capabilities
  - Snapshot testing
  - Parallel test execution
  - Excellent TypeScript support
  - Built-in code coverage

### 5. AWS EventBridge
- **Why**: Serverless event bus with strong typing support
- **Benefits**:
  - Decoupled event-driven architecture
  - Schema validation
  - Cross-account event routing
  - Flexible event filtering

### 6. @openapitools/openapi-generator-cli
- **Why**: Industry-standard tool for generating code from OpenAPI specifications
- **Benefits**:
  - Multi-language support (TypeScript, Python, Java, etc.)
  - Consistent code generation across languages
  - Active community and regular updates
  - Extensive customization options
  - Production-ready code generation

#### Adapting OpenAPI Generator for Event Processing

Although the OpenAPI Generator CLI is primarily designed for REST API code generation, we've adapted it for event processing by:

1. **Selective Code Usage**:
   - The generator creates a full REST API client by default
   - We selectively use only the type definitions and models
   - Common practice to leverage the robust type generation while discarding unnecessary REST-specific code

2. **Cleanup Process**:
   - Automatically remove non-essential files (API clients, configuration, etc.)
   - Keep only the schema definitions needed for event processing
   - This approach is a well-established pattern in the industry when adapting OpenAPI tools for non-REST use cases

3. **Future Language Support**:
   - The generator's multi-language support is crucial for our roadmap
   - Enables future Python code generation without changing our architecture
   - Maintains consistency across different language implementations
   - Same cleanup pattern can be applied for any target language

4. **Type Safety Advantages**:
   - Leverages OpenAPI Generator's mature type generation
   - Ensures consistent types across publishers and consumers
   - Reduces manual type definition maintenance
   - Automatic type updates when schemas change

## Implementation Details

### Code Generation Process

1. **Initialization**
   ```typescript
   const generator = new OpenAPITypeScriptGenerator(openApiDoc, {
     npmPackageName: '@my-org/schema-registry',
     region: 'us-west-2'
   });
   ```

2. **Schema Validation**
   - Validates OpenAPI document structure
   - Ensures required components are present
   - Verifies schema compatibility

3. **TypeScript Model Generation**
   - Generates TypeScript interfaces from schemas
   - Handles nested object structures
   - Manages type imports and exports

4. **EventBridge Integration**
   - Creates publisher classes for event emission
   - Generates consumer classes for event handling
   - Implements type-safe event payload handling

5. **Code Organization**
   - Generates modular, maintainable code
   - Implements clean separation of concerns
   - Provides clear file organization

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

