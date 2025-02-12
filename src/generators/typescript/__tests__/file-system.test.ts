import { NodeFileSystem } from '../services/file-system';
import { createMockLogger } from './test-utils';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('NodeFileSystem', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  let fileSystem: NodeFileSystem;
  const mockLogger = createMockLogger();

  beforeEach(() => {
    jest.clearAllMocks();
    fileSystem = new NodeFileSystem(mockLogger);
  });

  describe('writeFile', () => {
    it('should write content to a file', () => {
      mockLogger.info.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const mockPath = '/test/file.txt';
      const mockContent = 'test content';

      fileSystem.writeFile(mockPath, mockContent);
      expect(mockLogger.info).toHaveBeenCalled();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockPath, mockContent);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle write errors', () => {
      mockLogger.error.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });
      mockLogger.error.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const mockPath = '/test/file.txt';
      const mockError = new Error('Write error');
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      fileSystem.writeFile(mockPath, 'content');
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('readFile', () => {
    it('should read content from a file', () => {
      const mockPath = '/test/file.txt';
      const mockContent = 'test content';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = fileSystem.readFile(mockPath);

      expect(result).toBe(mockContent);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf-8');
    });
  });

  describe('createDirectory', () => {
    it('should create a directory', () => {
      const mockPath = '/test/dir';

      fileSystem.createDirectory(mockPath);

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockPath, { recursive: true });
    });
  });

  describe('exists', () => {
    it('should check if path exists', () => {
      const mockPath = '/test/file.txt';
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = fileSystem.exists(mockPath);

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    });
  });

  describe('cleanup', () => {
    it('should remove files and directories', () => {
      const mockFiles = ['/test/file1.txt', '/test/file2.txt'];
      const mockDirs = ['/test/dir1', '/test/dir2'];

      fileSystem.cleanup(mockFiles, mockDirs);

      mockFiles.forEach(file => {
        expect(fs.unlinkSync).toHaveBeenCalledWith(file);
      });
      mockDirs.forEach(dir => {
        expect(fs.rmdirSync).toHaveBeenCalledWith(dir, { recursive: true });
      });
    });
  });
});
