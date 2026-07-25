import { Body, Controller, HttpCode, HttpStatus, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentApiKey, Public } from './decorators/auth.decorators';
import { ApiKey } from './entities/api-key.entity';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { resolveClientIp } from '../../common/utils/ip';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthValidateController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tight per-IP limits on the public password login surface (overrides the global
   * short/medium/long tiers for this route only). Defaults: 5/min, 20/15min, 40/hour.
   */
  @Public()
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    medium: { limit: 20, ttl: 900_000 },
    long: { limit: 40, ttl: 3_600_000 },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard login with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    const clientIp = this.clientIp(req);
    try {
      const result = await this.authService.loginWithPassword(dto.username, dto.password);
      void this.auditService.logInfo(AuditAction.USER_LOGIN, {
        ipAddress: clientIp,
        method: req.method,
        path: req.path,
        metadata: { username: result.username, role: result.role },
      });
      return result;
    } catch (err) {
      void this.auditService.logWarn(AuditAction.USER_LOGIN_FAILED, {
        ipAddress: clientIp,
        method: req.method,
        path: req.path,
        errorMessage: err instanceof Error ? err.message : String(err),
        metadata: { username: dto.username },
      });
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate an API key or dashboard session token' })
  @ApiHeader({ name: 'X-API-Key', description: 'API key (or use Authorization: Bearer <jwt>)', required: false })
  @ApiResponse({ status: 200, description: 'Credential is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or missing credential' })
  validate(@CurrentApiKey() apiKey?: ApiKey): { valid: boolean; role?: string } {
    // This route is behind the global API-key guard, so only a validated key/JWT reaches this handler
    // (a missing/invalid credential 401s first). The guard has already verified the credential —
    // including client-IP and session-scope restrictions for API keys — and attached it to the request.
    if (!apiKey) {
      return { valid: false };
    }
    return { valid: true, role: apiKey.role };
  }

  private clientIp(req: Request): string {
    const trustedProxies = this.configService.get<string[]>('security.trustedProxies') ?? [];
    return resolveClientIp(req, trustedProxies);
  }
}
