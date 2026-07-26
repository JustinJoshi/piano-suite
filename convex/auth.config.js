export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
  ],
};
