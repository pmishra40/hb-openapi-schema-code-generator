import { loadOpenAPIDocument } from '../utils/openapi';
import { OpenAPITypeScriptGenerator } from '../generators/typescript/ts-code-generator';
import { join, dirname, relative } from 'path';
import { readdirSync, existsSync, mkdirSync } from 'fs';

async function generateForSchema(schemaPath: string, baseSchemaDir: string) {
  const document = await loadOpenAPIDocument(schemaPath);
  const generator = new OpenAPITypeScriptGenerator(document);
  
  const relativePath = relative(baseSchemaDir, dirname(schemaPath));
  const outputDir = join('generated/typescript', relativePath);
  mkdirSync(outputDir, { recursive: true });
  
  await generator.generate(outputDir);
}

async function main() {
  const schemasDir = join(__dirname, '../../schemas');
  const schemaArg = process.argv.find(arg => arg.includes('Bills') || arg.includes('Journals'));
  
  if (!schemaArg) {
    throw new Error('Please specify a schema folder (Bills or Journals)');
  }

  const schemaFolder = schemaArg;
  const folderPath = join(schemasDir, schemaFolder);
  
  if (!existsSync(folderPath)) {
    throw new Error(`Schema folder ${schemaFolder} not found`);
  }
  
  const schemas = readdirSync(folderPath)
    .filter((file): file is string => typeof file === 'string')
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map(file => join(folderPath, file));
    
  for (const schema of schemas) {
    console.log(`Generating code for schema: ${schema}`);
    await generateForSchema(schema, schemasDir);
  }
}

main().catch(console.error);