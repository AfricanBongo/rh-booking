import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
      ...(env('CF_R2_ACCESS_KEY_ID')
        ? {
            provider: 'aws-s3',
            providerOptions: {
              baseUrl: env('CF_R2_PUBLIC_URL'),
              s3Options: {
                credentials: {
                  accessKeyId: env('CF_R2_ACCESS_KEY_ID'),
                  secretAccessKey: env('CF_R2_SECRET_ACCESS_KEY'),
                },
                endpoint: env('CF_R2_ENDPOINT'),
                region: 'auto',
                params: {
                  Bucket: env('CF_R2_BUCKET'),
                  ACL: undefined,
                },
              },
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          }
        : {}),
    },
  },
});

export default config;
