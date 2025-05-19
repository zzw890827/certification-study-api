// src/auth/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 扩展 Request，使其带上我们在 JwtStrategy.validate 返回的 user 对象
interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

/**
 * 从请求上下文中取出 user 信息。
 * @param data 如果传 'userId' 或 'username'，则只返回对应字段，否则返回整个 user 对象。
 */
export const GetUser = createParamDecorator(
  (
    data: 'userId' | 'username',
    ctx: ExecutionContext,
  ): { userId: string; username: string } | string => {
    // 使用泛型告诉 Nest/Express 我们的 Request 上有 user
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;
    // 根据 data 决定返回哪部分
    return data ? user[data] : user;
  },
);
