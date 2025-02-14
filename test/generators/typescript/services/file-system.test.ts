import { NodeFileSystem } from '../../../../src/generators/typescript/services/file-system';
import { createMockLogger } from '../../../../test/utils/test-utils';
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
    mockFs.writeFileSync.mockImplementation(() => undefined);
    mockFs.readFileSync.mockImplementation(() => '');
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.existsSync.mockImplementation(() => false);
    mockFs.unlinkSync.mockImplementation(() => undefined);
    mockFs.rmSync.mockImplementation(() => undefined);
    mockFs.readdirSync.mockImplementation(() => []);
    fileSystem = new NodeFileSystem(mockLogger);
  });

  describe('writeFile', () => {
    it('should write content to a file', () => {
      const mockPath = '/test/file.txt';
      const mockContent = 'test content';

      fileSystem.writeFile(mockPath, mockContent);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockPath, mockContent);
      expect(mockLogger.debug).toHaveBeenCalledWith({ path: mockPath }, 'Writing file');
    });

    it('should handle write errors', () => {
      const mockPath = '/test/file.txt';
      const mockContent = 'test content';
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => fileSystem.writeFile(mockPath, mockContent)).toThrow('Write error');
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

      // Mock existsSync to return true for all paths
      mockFs.existsSync.mockImplementation((path) => true);

      fileSystem.cleanup(mockFiles, mockDirs);

      mockFiles.forEach(file => {
        expect(mockFs.unlinkSync).toHaveBeenCalledWith(file);
      });
      mockDirs.forEach(dir => {
        expect(mockFs.rmSync).toHaveBeenCalledWith(dir, { recursive: true, force: true });
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { files: mockFiles.length, directories: mockDirs.length },
        'Cleaning up generated files'
      );
    });
  });

  describe('createFolder', () => {
    it('should create a folder with recursive option', () => {
      const mockPath = '/test/folder';
      fileSystem.createFolder(mockPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockPath, { recursive: true });
      expect(mockLogger.debug).toHaveBeenCalledWith({ path: mockPath }, 'Creating folder');
    });

    it('should handle folder creation errors', () => {
      const mockPath = '/test/folder';
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Folder creation failed');
      });
      expect(() => fileSystem.createFolder(mockPath)).toThrow('Folder creation failed');
    });
  });

  describe('moveFile', () => {
    it('should move a file from source to target', () => {
      const sourcePath = '/test/source.txt';
      const targetPath = '/test/target.txt';
      const fileContent = 'test content';
      (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

      fileSystem.moveFile(sourcePath, targetPath);

      expect(fs.readFileSync).toHaveBeenCalledWith(sourcePath);
      expect(fs.writeFileSync).toHaveBeenCalledWith(targetPath, fileContent);
      expect(fs.unlinkSync).toHaveBeenCalledWith(sourcePath);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { sourcePath, targetPath },
        'Moving file'
      );
    });

    it('should handle move errors', () => {
      const sourcePath = '/test/source.txt';
      const targetPath = '/test/target.txt';
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Move failed');
      });
      expect(() => fileSystem.moveFile(sourcePath, targetPath)).toThrow('Move failed');
    });
  });

  describe('readdir', () => {
    it('should read directory contents', () => {
      const mockPath = '/test/dir';
      const mockFiles = ['file1.txt', 'file2.txt'];
      (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);

      const result = fileSystem.readdir(mockPath);

      expect(result).toEqual(mockFiles);
      expect(fs.readdirSync).toHaveBeenCalledWith(mockPath);
      expect(mockLogger.debug).toHaveBeenCalledWith({ path: mockPath }, 'Reading directory');
    });

    it('should handle readdir errors', () => {
      const mockPath = '/test/dir';
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read directory failed');
      });
      expect(() => fileSystem.readdir(mockPath)).toThrow('Read directory failed');
    });
  });
});
