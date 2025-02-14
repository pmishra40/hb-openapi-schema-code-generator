import { OpenAPIV3 } from 'openapi-types';
import { OpenAPISchemaValidator } from '../../../../src/generators/typescript/services/schema-validator';
import pino from 'pino';

describe('OpenAPISchemaValidator', () => {
  let validator: OpenAPISchemaValidator;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    validator = new OpenAPISchemaValidator(mockLogger);
  });

  describe('validate', () => {
    it('should throw error if document is null', () => {
      expect(() => validator.validate(null as any)).toThrow('OpenAPI document is required');
    });

    it('should throw error if openapi version is missing', () => {
      const doc = {} as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('OpenAPI version is required');
    });

    it('should throw error if openapi version is not 3.x', () => {
      const doc = {
        openapi: '2.0.0'
      } as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('Invalid OpenAPI version. Expected 3.x.x but got 2.0.0');
    });

    it('should throw error if components.schemas is missing', () => {
      const doc = {
        openapi: '3.0.0'
      } as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('OpenAPI document must contain components.schemas');
    });

    it('should throw error if info section is missing', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {}
        }
      } as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('OpenAPI info section is required');
    });

    it('should throw error if info.title is missing', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {}
        },
        info: {}
      } as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('OpenAPI info.title is required');
    });

    it('should throw error if info.version is missing', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {}
        },
        info: {
          title: 'Test API'
        }
      } as OpenAPIV3.Document;
      expect(() => validator.validate(doc)).toThrow('OpenAPI info.version is required');
    });

    it('should validate a valid OpenAPI document', () => {
      const doc: OpenAPIV3.Document = {
        openapi: '3.0.0',
        components: {
          schemas: {
            TestSchema: {
              type: 'object',
              properties: {
                test: { type: 'string' }
              }
            }
          }
        },
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {}
      };

      expect(() => validator.validate(doc)).not.toThrow();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        {
          title: 'Test API',
          version: '1.0.0'
        },
        'OpenAPI document validated successfully'
      );
    });
  });
});
