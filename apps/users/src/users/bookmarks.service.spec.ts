import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarksService } from './bookmarks.service';
import { SnapBookmark } from './entities/snap-bookmark.entity';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let repo: jest.Mocked<
    Pick<
      Repository<SnapBookmark>,
      'findOne' | 'find' | 'save' | 'create' | 'delete'
    >
  >;

  const existing: SnapBookmark = {
    userId: 'u1',
    snapId: 's1',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(SnapBookmark), useValue: repo },
      ],
    }).compile();

    service = module.get(BookmarksService);
  });

  it('creates a unique bookmark', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(existing);
    repo.save.mockResolvedValue(existing);

    const result = await service.addBookmark('u1', 's1');

    expect(repo.create).toHaveBeenCalledWith({ userId: 'u1', snapId: 's1' });
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(result).toEqual(existing);
  });

  it('treats adding the same bookmark twice as idempotent success', async () => {
    repo.findOne.mockResolvedValue(existing);

    const result = await service.addBookmark('u1', 's1');

    expect(result).toEqual(existing);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns the existing row when a unique-index race occurs', async () => {
    repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    repo.create.mockReturnValue(existing);
    repo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });

    const result = await service.addBookmark('u1', 's1');

    expect(result).toEqual(existing);
  });

  it('lists bookmarks for the user', async () => {
    repo.find.mockResolvedValue([existing]);
    const result = await service.listBookmarks('u1');
    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([existing]);
  });

  it('removes a bookmark', async () => {
    repo.delete.mockResolvedValue({ affected: 1, raw: {} });
    await expect(service.removeBookmark('u1', 's1')).resolves.toEqual({
      success: true,
    });
    expect(repo.delete).toHaveBeenCalledWith({ userId: 'u1', snapId: 's1' });
  });
});
