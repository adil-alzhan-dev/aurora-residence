import {
  ConflictException,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ApiError } from '../src/common/api-error.js';
import { ERROR_CODES } from '../src/common/error-codes.js';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { RolesGuard } from '../src/auth/roles.guard.js';
import { ReservationsScheduler } from '../src/reservations/reservations.scheduler.js';
import { expectError, http, reseed, signIn } from './app.js';

/** Routes that throw what no real route throws today, to pin down the fallbacks. */
@Controller('probe')
class ProbeController {
  @Get('conflict')
  conflict(): never {
    throw new ConflictException('Somebody got there first');
  }

  // No @Roles: RolesGuard keeps such a route closed even for a signed-in admin.
  @Get('closed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  closed(): string {
    return 'open';
  }

  @Get('teapot')
  teapot(): never {
    throw new HttpException('I am a teapot', 418);
  }

  @Get('server-error')
  serverError(): never {
    throw new InternalServerErrorException('Disk /var/lib/postgresql is full');
  }

  @Get('unavailable')
  unavailable(): never {
    throw new ServiceUnavailableException('Prisma SQL SELECT passwordHash FROM AdminUser at /srv/api/db.ts');
  }

  @Get('unavailable-payload')
  unavailablePayload(): never {
    throw new ApiError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Pool exhausted at /srv/api/db.ts', {
      stack: 'at /srv/api/db.ts:42',
      errors: { query: 'SELECT passwordHash FROM AdminUser' },
      status: 'evil',
      database: 'down',
    });
  }

  @Get('client-extras')
  clientExtras(): never {
    throw new ApiError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Wrong email or password', {
      attemptsLeft: 3,
      secret: 'argon2id$v=19$m=65536',
      stack: 'at /srv/api/auth.service.ts:31',
    });
  }

  @Get('crash')
  crash(): never {
    throw new TypeError("Cannot read properties of undefined (reading 'passwordHash')");
  }
}

describe('Error filter fallbacks (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    reseed();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
      .overrideProvider(ReservationsScheduler)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers CONFLICT for a 409 without a specific code', async () => {
    const response = await http(app).get('/api/probe/conflict');
    expect(response.body).toEqual({ statusCode: 409, code: 'CONFLICT', message: 'Somebody got there first' });
  });

  it('answers FORBIDDEN when the role does not allow the route', async () => {
    const token = await signIn(app);
    const response = await http(app).get('/api/probe/closed').set('Authorization', `Bearer ${token}`);
    expect(response.body).toEqual({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Your role does not allow this action',
    });
  });

  it('keeps the status of an unlisted 4xx and falls back to BAD_REQUEST', async () => {
    expectError(await http(app).get('/api/probe/teapot'), 418, 'BAD_REQUEST');
  });

  it.each(['/api/probe/server-error', '/api/probe/crash'])(
    'hides the details of %s behind INTERNAL_ERROR',
    async (path) => {
      const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const response = await http(app).get(path);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' });
      expect(response.text).not.toMatch(/postgresql|passwordHash|Error/);
      expect(logged).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['/api/probe/unavailable', '/api/probe/unavailable-payload'])(
    'answers %s with a fixed SERVICE_UNAVAILABLE text and logs the details',
    async (path) => {
      const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const response = await http(app).get(path);
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      });
      expect(response.text).not.toMatch(/passwordHash|AdminUser|srv|evil|stack|query|database/);
      expect(logged).toHaveBeenCalledWith(
        expect.stringMatching(/Prisma SQL|Pool exhausted/),
        expect.stringContaining('at '),
      );
    },
  );

  it('keeps only the allowed extra fields of a 4xx', async () => {
    const response = await http(app).get('/api/probe/client-extras');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Wrong email or password',
      attemptsLeft: 3,
    });
    expect(response.text).not.toMatch(/argon2|srv/);
  });
});
