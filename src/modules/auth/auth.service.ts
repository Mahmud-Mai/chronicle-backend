import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { SUPERTOKENS_CONFIG, AuthConfig } from '../../config/supertokens.config';
import { PrismaService } from '../../prisma/prisma.service';
import * as SuperTokensLib from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { Response, Request } from 'express';

const SuperTokens = SuperTokensLib.default || SuperTokensLib;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly defaultTenantId = 'public';

  constructor(
    @Inject(SUPERTOKENS_CONFIG) private config: AuthConfig,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    SuperTokens.init({
      appInfo: {
        appName: 'Chronicle',
        websiteDomain: this.config.websiteDomain,
        apiDomain: this.config.apiDomain,
      },
      supertokens: {
        connectionURI: this.config.connectionURI,
        apiKey: this.config.apiKey,
      },
      recipeList: [
        EmailPassword.init(),
        Session.init(),
      ],
    });
  }

  getEmailPasswordRecipe() {
    return EmailPassword;
  }

  getSessionRecipe() {
    return Session;
  }

  async signUp(email: string, password: string, name?: string) {
    const result = await EmailPassword.signUp(this.defaultTenantId, email, password);
    
    if (result.status === 'OK' && result.user) {
      const userName = name || email.split('@')[0];
      
      await this.prisma.user.create({
        data: {
          id: result.user.id,
          email: result.user.email,
          name: userName,
        },
      });

      await this.prisma.userSettings.create({
        data: {
          userId: result.user.id,
        },
      });
    }
    
    return result;
  }

  async signIn(email: string, password: string) {
    return EmailPassword.signIn(this.defaultTenantId, email, password);
  }

  async createSession(userId: string, req: Request, res: Response) {
    return Session.createNewSession(req, res, this.defaultTenantId, userId, {}, {});
  }

  async getSession(req: Request, res: Response) {
    return Session.getSession(req, res, { sessionRequired: false });
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUser(userId: string, data: { name?: string; profileImage?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async signOut(req: Request, res: Response) {
    const session = await Session.getSession(req, res, { sessionRequired: false });
    if (session) {
      await session.revokeSession();
    }
    return { success: true };
  }
}
