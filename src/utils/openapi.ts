import { OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';

export async function loadOpenAPIDocument(schemaPath: string): Promise<OpenAPIV3.Document> {
  const parser = new SwaggerParser();
  return await parser.parse(schemaPath) as OpenAPIV3.Document;
}