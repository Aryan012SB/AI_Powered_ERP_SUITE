import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @ApiProperty({ example: 'Rohith Raj' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'admin@amdox.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 't-amdox' })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;
}

class LoginDto {
  @ApiProperty({ example: 'admin@amdox.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new enterprise user account' })
  @ApiResponse({ status: 201, description: 'User account created successfully.' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists.' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.tenantId
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and retrieve token' })
  @ApiResponse({ status: 200, description: 'Success: returns user context and signed JWT.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials.' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get list of all registered users' })
  @ApiResponse({ status: 200, description: 'Success: returns user list.' })
  async getAllUsers(@Query('tenantId') tenantId?: string) {
    return this.authService.getAllUsers(tenantId);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User account created successfully.' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already exists.' })
  @ApiBody({ type: RegisterDto })
  async createUser(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.tenantId
    );
  }

  @Delete('users/:email')
  @ApiOperation({ summary: 'Delete a user by email' })
  @ApiResponse({ status: 200, description: 'Success: User deleted.' })
  async deleteUser(@Param('email') email: string) {
    await this.authService.deleteUser(email);
    return { status: 'success' };
  }
}
