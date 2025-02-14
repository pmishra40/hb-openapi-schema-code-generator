import { FileSystem } from '../../../../src/generators/core/services/file-system';
import * as fs from 'fs';
import { Dirent } from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('FileSystem', () => {
  let fileSystem: FileSystem;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    fileSystem = new FileSystem();
  });

  describe('createDirectory', () => {
    it('should create directory with recursive option', () => {
      const testPath = '/test/dir';
      fileSystem.createDirectory(testPath);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testPath, { recursive: true });
    });

    it('should handle errors when creating directory', () => {
      const testPath = '/test/dir';
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Directory creation failed');
      });
      expect(() => fileSystem.createDirectory(testPath)).toThrow('Directory creation failed');
    });
  });

  describe('writeFile', () => {
    it('should write content to file', () => {
      const testPath = '/test/file.txt';
      const testContent = 'test content';
      mockFs.existsSync.mockReturnValue(true);
      mockPath.dirname.mockReturnValue('/test');

      fileSystem.writeFile(testPath, testContent);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(testPath, testContent);
    });

    it('should create parent directory if it does not exist', () => {
      const testPath = '/test/file.txt';
      const testContent = 'test content';
      mockFs.existsSync.mockReturnValue(false);
      mockPath.dirname.mockReturnValue('/test');

      // Reset the mock implementation for mkdirSync
      mockFs.mkdirSync.mockImplementation(() => undefined);

      fileSystem.writeFile(testPath, testContent);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(testPath, testContent);
    });

    it('should handle errors when writing file', () => {
      const testPath = '/test/file.txt';
      const testContent = 'test content';
      mockFs.existsSync.mockReturnValue(true);
      mockPath.dirname.mockReturnValue('/test');
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => fileSystem.writeFile(testPath, testContent)).toThrow('Write failed');
    });
  });

  describe('readdir', () => {
    it('should read directory contents', () => {
      const testPath = '/test/dir';
      const mockFiles = ['file1.txt', 'file2.txt'];
      const mockDirents = mockFiles.map(file => ({
        name: file,
        isFile: () => true,
        isDirectory: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isFIFO: () => false,
        isSocket: () => false
      } as Dirent));
      
      mockFs.readdirSync.mockReturnValue(mockDirents);

      expect(fileSystem.readdir(testPath)).toEqual(mockFiles);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(testPath, { withFileTypes: true });
    });

    it('should handle readdir errors', () => {
      const testPath = '/test/dir';
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Failed to read directory');
      });

      expect(() => fileSystem.readdir(testPath)).toThrow('Failed to read directory');
    });
  });

  describe('exists', () => {
    it('should return true when path exists', () => {
      const testPath = '/test/file.txt';
      mockFs.existsSync.mockReturnValue(true);

      expect(fileSystem.exists(testPath)).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith(testPath);
    });

    it('should return false when path does not exist', () => {
      const testPath = '/test/file.txt';
      mockFs.existsSync.mockReturnValue(false);

      expect(fileSystem.exists(testPath)).toBe(false);
      expect(mockFs.existsSync).toHaveBeenCalledWith(testPath);
    });
  });
});
