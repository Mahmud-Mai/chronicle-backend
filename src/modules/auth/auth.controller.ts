import { Controller, Post, Get, Body, Req, Res, UseGuards, Patch } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signUp(@Body() body: { email: string; password: string; name?: string }, @Req() req: Request, @Res() res: Response) {
    const result = await this.authService.signUp(body.email, body.password, body.name);
    
    if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
      return res.status(400).json({
        statusCode: 400,
        message: 'Email already exists',
        error: 'Validation Error',
      });
    }

    if (result.status === 'OK') {
      const session = await this.authService.createSession(result.user.id, req, res);
      
      return res.json({
        data: {
          userId: result.user.id,
          email: result.user.email,
        },
        accessToken: session.getAccessToken(),
      });
    }

    return res.status(500).json({
      statusCode: 500,
      message: 'An error occurred during sign up',
      error: 'Internal Server Error',
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async signIn(@Body() body: { email: string; password: string }, @Req() req: Request, @Res() res: Response) {
    const result = await this.authService.signIn(body.email, body.password);
    
    if (result.status === 'WRONG_CREDENTIALS_ERROR') {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    if (result.status === 'OK') {
      const session = await this.authService.createSession(result.user.id, req, res);
      
      return res.json({
        data: {
          userId: result.user.id,
          email: result.user.email,
        },
        accessToken: session.getAccessToken(),
      });
    }

    return res.status(500).json({
      statusCode: 500,
      message: 'An error occurred during login',
      error: 'Internal Server Error',
    });
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authService.signOut(req, res);
    return res.json({ success: true });
  }

  @Get('session')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session info' })
  async getSession(@Req() req: Request & { session: { getUserId: () => string } }) {
    const userId = req.session.getUserId();
    const user = await this.authService.getUser(userId);
    
    if (!user) {
      return { data: null };
    }
    
    return {
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      },
    };
  }

  @Patch('profile')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Body() body: { name?: string; profileImage?: string },
  ) {
    const userId = req.session.getUserId();
    const user = await this.authService.updateUser(userId, body);
    
    return {
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      },
    };
  }
}
