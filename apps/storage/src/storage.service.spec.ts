import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { STORAGE_STRATEGY } from './strategies/storage-strategy.interface';

describe('StorageService', () => {
  let service: StorageService;
  let strategy: {
    getUploadSignedUrl: jest.Mock;
    getDownloadSignedUrl: jest.Mock;
    uploadFile: jest.Mock;
    listFiles: jest.Mock;
    deleteFile: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    strategy = {
      getUploadSignedUrl: jest.fn(),
      getDownloadSignedUrl: jest.fn(),
      uploadFile: jest.fn(),
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: STORAGE_STRATEGY, useValue: strategy },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  it('returns a presigned upload URL and key', async () => {
    strategy.getUploadSignedUrl.mockResolvedValue('https://upload');
    const result = await service.getPresignedUploadUrl(
      'snaps/2026-09-03/u1/file.jpg',
      'image/jpeg',
    );
    expect(result).toEqual({
      uploadUrl: 'https://upload',
      key: 'snaps/2026-09-03/u1/file.jpg',
    });
  });

  it('uses cached signed download URLs', async () => {
    cache.get.mockResolvedValue('https://cached');
    const url = await service.getSignedUrlForFile('profile/u1/a.jpg');
    expect(url).toBe('https://cached');
    expect(strategy.getDownloadSignedUrl).not.toHaveBeenCalled();
  });

  it('fetches and caches a signed download URL on miss', async () => {
    cache.get.mockResolvedValue(undefined);
    strategy.getDownloadSignedUrl.mockResolvedValue('https://fresh');
    const url = await service.getSignedUrlForFile('profile/u1/a.jpg');
    expect(url).toBe('https://fresh');
    expect(cache.set).toHaveBeenCalled();
  });

  it('throws when the strategy fails to presign', async () => {
    strategy.getUploadSignedUrl.mockRejectedValue(new Error('boom'));
    await expect(
      service.getPresignedUploadUrl('k', 'image/jpeg'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('deletes each key sequentially and invalidates cache', async () => {
    strategy.deleteFile.mockResolvedValue(undefined);
    cache.del.mockResolvedValue(undefined);

    await service.deleteFiles(['snaps/a.jpg', 'snaps/b.jpg']);

    expect(strategy.deleteFile.mock.calls).toEqual([
      ['snaps/a.jpg'],
      ['snaps/b.jpg'],
    ]);
    expect(cache.del).toHaveBeenCalledWith('snaps/a.jpg');
    expect(cache.del).toHaveBeenCalledWith('snaps/b.jpg');
  });

  it('ignores missing keys and still invalidates cache', async () => {
    strategy.deleteFile
      .mockRejectedValueOnce(new Error('NoSuchKey'))
      .mockResolvedValueOnce(undefined);
    cache.del.mockResolvedValue(undefined);

    await expect(
      service.deleteFiles(['missing.jpg', 'present.jpg']),
    ).resolves.toBeUndefined();

    expect(strategy.deleteFile).toHaveBeenCalledTimes(2);
    expect(cache.del).toHaveBeenCalledWith('missing.jpg');
    expect(cache.del).toHaveBeenCalledWith('present.jpg');
  });
});
