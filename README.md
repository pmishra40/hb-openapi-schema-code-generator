# HB Schema Registry OpenAPI Integration Generator

## Overview

The HB Schema Registry OpenAPI Integration Generator is a powerful tool that transforms OpenAPI specifications into type-safe code with seamless AWS EventBridge integration. It supports both TypeScript and Python, automating the creation of event publishers, consumers, and data models while ensuring strict type safety and schema validation.

## Features

### Core Features
1. **Multi-Language Support**
   - TypeScript code generation with full type safety
   - Python code generation with Pydantic models
   - Language-specific best practices and patterns

2. **AWS EventBridge Integration**
   - Automated event publisher generation
   - Type-safe event consumer classes
   - Configurable event bus settings
   - Source and detail-type customization

3. **Schema Validation**
   - OpenAPI 3.x specification validation
   - Runtime schema validation
   - Detailed error reporting

4. **Code Generation**
   - Clean, maintainable code output
   - Customizable templates
   - Automatic cleanup of temporary files
   - Support for nested schemas and references

## Architecture

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

### Directory Structure

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

## Usage

### Installation

```bash
# Install dependencies
npm install

# Install OpenAPI generator CLI
npm install @openapitools/openapi-generator-cli -g
```

### Generating Code

1. **TypeScript Generation**
```bash
npm run generate -- --schema=path/to/schema.yaml --language=typescript
```

This generates:
- TypeScript interfaces for all schemas
- EventBridge publisher classes
- EventBridge consumer classes
- Type-safe event handling utilities

Example TypeScript usage:
```typescript
import { BillEventPublisher } from './generated/typescript/bills';

const publisher = new BillEventPublisher({
  region: 'us-west-2',
  eventBusName: 'homebound-events',
  source: 'com.homebound'
});

await publisher.publishBillCreated({
  billId: '123',
  amount: 100.50
});
```

2. **Python Generation**
```bash
npm run generate -- --schema=path/to/schema.yaml --language=python
```

This generates:
- Pydantic models for all schemas
- Python EventBridge publisher classes
- Python EventBridge consumer classes
- Type-safe event handling utilities

Example Python usage:
```python
from generated.python.bills import BillEventPublisher, BillCreatedEvent

publisher = BillEventPublisher(
    region='us-west-2',
    event_bus_name='homebound-events',
    source='com.homebound'
)

await publisher.publish_bill_created(BillCreatedEvent(
    bill_id='123',
    amount=100.50
))
```

### Configuration Options

```typescript
interface GeneratorOptions {
  language: 'typescript' | 'python';
  npmPackageName?: string;        // For TypeScript
  npmVersion?: string;            // For TypeScript
  region?: string;                // AWS region
  eventBusName?: string;          // EventBridge bus
  defaultSource?: string;         // Event source
}
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test test/generators/typescript
npm test test/generators/python

# Run with coverage
npm run test:coverage
```

### Adding New Features

1. **Adding New Templates**
   - Add templates to `src/generators/{language}/templates/`
   - Update template renderer in `services/template-renderer.ts`
   - Add tests in `test/generators/{language}/services/`

2. **Adding New Event Types**
   - Update event generator in `services/event-generator.ts`
   - Add corresponding templates
   - Update tests

### Best Practices

1. **Schema Design**
   - Use OpenAPI 3.x specification
   - Define clear schema references
   - Include comprehensive descriptions
   - Use appropriate data types

2. **Code Generation**
   - Keep generated code clean and maintainable
   - Follow language-specific conventions
   - Implement proper error handling
   - Include documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Error Handling and Validation

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

### API Integration

1. **Express.js API**
```typescript
import express from 'express';
import { BillEventPublisher } from './generated/typescript/bills';

const app = express();
const publisher = new BillEventPublisher({
  region: 'us-west-2',
  eventBusName: 'homebound-events'
});

app.post('/bills', async (req, res) => {
  try {
    await publisher.publishBillCreated({
      billId: req.body.id,
      amount: req.body.amount
    });
    res.status(200).json({ message: 'Bill created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **FastAPI Integration**
```python
from fastapi import FastAPI
from generated.python.bills import BillEventPublisher, BillCreatedEvent

app = FastAPI()
publisher = BillEventPublisher(
    region='us-west-2',
    event_bus_name='homebound-events'
)

@app.post('/bills')
async def create_bill(bill_data: dict):
    try:
        await publisher.publish_bill_created(BillCreatedEvent(
            bill_id=bill_data['id'],
            amount=bill_data['amount']
        ))
        return {'message': 'Bill created'}
    except Exception as e:
        return {'error': str(e)}, 500
```

## Security Considerations

1. **AWS Credentials**
   - Use IAM roles with minimal permissions
   - Never hardcode credentials
   - Rotate access keys regularly

2. **Event Data**
   - Validate all event data
   - Sanitize sensitive information
   - Use appropriate data types

3. **Schema Security**
   - Keep schemas in version control
   - Review schema changes
   - Document security requirements

## Support and Community

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive API docs available
- **Examples**: Sample projects in `/examples`
- **Contributing**: See CONTRIBUTING.md

## Roadmap

1. **Short Term**
   - Additional language support
   - Enhanced schema validation
   - Performance improvements

2. **Medium Term**
   - Custom template support
   - Schema versioning
   - Event pattern validation

3. **Long Term**
   - GraphQL support
   - Schema registry integration
   - Code generation plugins

## License

MIT License - See LICENSE file for details
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

