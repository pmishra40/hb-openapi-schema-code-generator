import { join } from 'path';
import { OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIGenerator } from '../code-generator';

/**
 * Loads and parses an OpenAPI document from the given schema path
 */
export async function loadOpenAPIDocument(schemaPath: string): Promise<OpenAPIV3.Document> {
  const parser = new SwaggerParser();
  return await parser.parse(schemaPath) as OpenAPIV3.Document;
}

/**
 * Main entry point for code generation.
 * This script:
 * 1. Takes a schema name as input
 * 2. Loads the OpenAPI document
 * 3. Configures and runs the code generator
 * 4. Generates code in the specified language (TypeScript or Python)
 */
export async function main() {
  const [, , schemaName, schemaFile] = process.argv;
  if (!schemaName) {
    throw new Error('Schema name is required');
  }
  if (!schemaFile) {
    throw new Error('Schema filename is required (e.g., tradeBill.yaml or journal.yaml)');
  }

  const schemaPath = join(process.cwd(), 'schemas', schemaName, schemaFile);
  console.log('Schema Path:', schemaPath);

  const baseSchemaDir = join(process.cwd(), 'schemas');
  console.log('Base Schema Dir:', baseSchemaDir);

  const dirnameOfSchemaPath = join(baseSchemaDir, schemaName);
  console.log('Dirname of Schema Path:', dirnameOfSchemaPath);

  const relativePath = schemaName;
  console.log('Relative Path:', relativePath);

  const outputDir = join(process.env.OUTPUT_DIR || 'generated', process.env.TARGET_LANGUAGE || 'typescript', relativePath);
  console.log('Final Output Dir:', outputDir);

  const document = await loadOpenAPIDocument(schemaPath);
  (document as any).source = schemaPath;

  const generator = new OpenAPIGenerator(document, {
    language: process.env.TARGET_LANGUAGE as 'typescript' | 'python' || 'typescript'
  });

  await generator.generate(outputDir);
}

main().catch(console.error);
