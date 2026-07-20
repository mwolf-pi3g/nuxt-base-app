declare module '#auth-utils' {
  interface User {
    id: string;
    user: string;
    roles: string[];
    permissions: string[];
    limits: string;
    lang: string;
    email: string;
  }

  interface UserSession {
    user: User;
    loggedInAt: string;
  }
}

export { }
