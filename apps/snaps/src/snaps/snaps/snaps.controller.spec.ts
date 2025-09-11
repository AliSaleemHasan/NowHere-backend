import { SnapsController } from './snaps.controller';

describe('SnapsController', () => {
  let controller: SnapsController;
  let service: any;

  beforeEach(() => {
    service = { create: jest.fn(), findAll: jest.fn() };
    controller = new SnapsController(service as any);
  });

  it('should call service.create on create', async () => {
    const dto = { location: [0, 0] };
    await controller.create('u1', [], dto as any);
    expect(service.create).toHaveBeenCalledWith('u1', [], dto);
  });
});
