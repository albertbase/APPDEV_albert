const ROUTES = {
  // Main
  HOME: 'Home',
  PROFILE: 'Profile',

  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
} as const;

export type AppRouteName = (typeof ROUTES)[keyof typeof ROUTES];

export default ROUTES;
