declare module '#auth-utils' {
  interface User {
    id: string;
    user: string;
    roles: string[];
    permissions: string[];
    limits: string;
    lang: string;
    cron_active?: number;
  }

  interface UserSession {
    user: User;
    loggedInAt: string;
  }
}

export { }
