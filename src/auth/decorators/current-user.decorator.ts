import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Jika data diisi (misalnya 'sub'), return field spesifik
    // Jika tidak, return seluruh user object
    return data ? user?.[data] : user;
  },
);
