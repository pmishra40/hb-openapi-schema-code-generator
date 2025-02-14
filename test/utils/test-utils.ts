import { OpenAPIV3 } from 'openapi-types';
import { Logger } from 'pino';

export const createMockLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn().mockReturnThis(),
  error: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  debug: jest.fn().mockReturnThis(),
  trace: jest.fn().mockReturnThis(),
  fatal: jest.fn().mockReturnThis(),
  child: jest.fn().mockReturnThis(),
  level: 'info',
} as unknown as jest.Mocked<Logger>);

export const createMockOpenAPIDocument = (): OpenAPIV3.Document => ({
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      TestEvent: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      }
    }
  }
});
