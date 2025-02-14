import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { Logger } from 'pino';

/**
 * Interface for file system operations
 */
/**
 * Interface for file system operations.
 * This abstraction allows for different implementations of file system operations,
 * making the code more testable and platform-independent.
 */
export interface FileSystem {
    /**
     * Write content to a file
     * @param path File path
     * @param content Content to write
     */
    /**
     * Write content to a file
     * @param {string} path - Absolute or relative path to the file
     * @param {string} content - Content to write to the file
     * @throws {Error} If writing fails or path is invalid
     */
    writeFile(path: string, content: string): void;

    /**
     * Read content from a file
     * @param path File path
     * @returns File content
     */
    /**
     * Read content from a file
     * @param {string} path - Absolute or relative path to the file
     * @returns {string} Content of the file
     * @throws {Error} If reading fails or file doesn't exist
     */
    readFile(path: string): string;

    /**
     * Create a directory
     * @param path Directory path
     */
    /**
     * Create a directory and any necessary parent directories
     * @param {string} path - Path to the directory to create
     * @throws {Error} If directory creation fails
     */
    createDirectory(path: string): void;

    /**
     * Check if path exists
     * @param path Path to check
     * @returns true if exists
     */
    /**
     * Check if a path exists in the file system
     * @param {string} path - Path to check
     * @returns {boolean} True if path exists, false otherwise
     */
    exists(path: string): boolean;

    /**
     * Clean up files and directories
     * @param files Files to remove
     * @param directories Directories to remove
     */
    /**
     * Clean up files and directories
     * @param {string[]} files - List of file paths to remove
     * @param {string[]} directories - List of directory paths to remove recursively
     * @throws {Error} If cleanup operations fail
     */
    cleanup(files: string[], directories: string[]): void;

    /**
     * Create a folder and any necessary parent directories
     * @param {string} path - Path to the folder to create
     * @throws {Error} If folder creation fails
     */
    createFolder(path: string): void;

    /**
     * Move a file from one location to another
     * @param {string} sourcePath - Source file path
     * @param {string} targetPath - Target file path
     * @throws {Error} If file move fails
     */
    moveFile(sourcePath: string, targetPath: string): void;

    /**
     * Read directory contents
     * @param {string} path - Path to directory
     * @returns {string[]} List of file names in directory
     * @throws {Error} If directory read fails
     */
    readdir(path: string): string[];
}

/**
 * Node.js implementation of file system operations
 */
/**
 * Node.js implementation of the FileSystem interface.
 * Uses Node.js built-in 'fs' module for file system operations.
 * Includes logging for debugging and error tracking.
 */
export class NodeFileSystem implements FileSystem {
    /**
     * Creates a new instance of NodeFileSystem
     * @param {Logger} logger - Logger instance for operation tracking
     */
    constructor(private logger: Logger) {}

    writeFile(path: string, content: string): void {
        try {
            this.logger.debug({ path }, 'Writing file');
            writeFileSync(path, content);
        } catch (error) {
            this.logger.error({ path, error }, 'Error writing file');
            throw error;
        }
    }

    readFile(path: string): string {
        this.logger.debug({ path }, 'Reading file');
        return readFileSync(path, 'utf-8');
    }

    createDirectory(path: string): void {
        if (!this.exists(path)) {
            this.logger.debug({ path }, 'Creating directory');
            mkdirSync(path, { recursive: true });
        }
    }

    exists(path: string): boolean {
        return existsSync(path);
    }

    cleanup(files: string[], directories: string[]): void {
        this.logger.debug({ files: files.length, directories: directories.length }, 'Cleaning up generated files');

        files.forEach(file => {
            if (this.exists(file)) {
                this.logger.debug({ file }, 'Removing file');
                unlinkSync(file);
            }
        });

        directories.forEach(dir => {
            if (this.exists(dir)) {
                this.logger.debug({ dir }, 'Removing directory');
                rmSync(dir, { recursive: true, force: true });
            }
        });
    }

    createFolder(path: string): void {
        this.logger.debug({ path }, 'Creating folder');
        mkdirSync(path, { recursive: true });
    }

    moveFile(sourcePath: string, targetPath: string): void {
        this.logger.debug({ sourcePath, targetPath }, 'Moving file');
        writeFileSync(targetPath, readFileSync(sourcePath));
        unlinkSync(sourcePath);
    }

    readdir(path: string): string[] {
        this.logger.debug({ path }, 'Reading directory');
        return readdirSync(path);
    }
}
