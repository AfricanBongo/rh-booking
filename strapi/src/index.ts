import type { Core } from '@strapi/strapi';
import seed from './seeds';

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (process.env.NODE_ENV === 'development') {
      await seed({ strapi });
    }
  },
};
