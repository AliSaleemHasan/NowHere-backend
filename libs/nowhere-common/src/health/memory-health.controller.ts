import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { HEALTH_HEAP_LIMIT_BYTES } from './constants';

@SkipThrottle()
@Controller('health')
export class MemoryHealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', HEALTH_HEAP_LIMIT_BYTES),
    ]);
  }
}
