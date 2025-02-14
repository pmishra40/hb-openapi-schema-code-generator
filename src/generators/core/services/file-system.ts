import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Service for handling file system operations.
 * This provides a common interface for both Python and TypeScript generators
 * to perform file operations.
 */
export class FileSystem {
  /**
   * Creates a directory and any necessary parent directories
   * 
   * @param path - Path to create
   */
  createDirectory(path: string): void {
    mkdirSync(path, { recursive: true });
  }

  /**
   * Writes content to a file, creating parent directories if needed
   * 
   * @param path - Path to write to
   * @param content - Content to write
   */
  writeFile(path: string, content: string): void {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      this.createDirectory(dir);
    }
    writeFileSync(path, content);
  }

  /**
   * Checks if a path exists
   * 
   * @param path - Path to check
   * @returns true if path exists
   */
  exists(path: string): boolean {
    return existsSync(path);
  }

  /**
   * Lists contents of a directory
   * 
   * @param path - Path to read
   * @returns Array of file/directory names
   */
  readdir(path: string): string[] {
    const entries = readdirSync(path, { withFileTypes: true });
    return entries.map(entry => entry.name);
  }
}
