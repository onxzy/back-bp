import { registerAs } from '@nestjs/config';
import { authConfig_shared } from './auth.config';

// Add bucket name here first
export enum BucketName {
  avatar = 'avatar',
  example = 'example',
}

// Then add your bucket config here
const buckets: BucketConfig[] = [
  {
    name: authConfig_shared.avatar.bucket,
    policy: {
      public: authConfig_shared.avatar.public
        ? {
            all: authConfig_shared.avatar.public,
            action: ['s3:GetObject'],
          }
        : null,
    },
  },
  {
    name: BucketName.example,
    policy: {
      raw: {}, // raw override anything else in .policy
      public: {
        all: false, // all override prefix
        prefix: ['public'],
        action: ['s3:GetObject'],
      },
    },
  },
];
const config = {
  endpoint: process.env.S3_ENDPOINT || false,
  region: process.env.S3_REGION || 'local',
  auth: {
    accessKey: process.env.S3_ACCESS_KEY || 'username',
    secretKey: process.env.S3_SECRET_KEY || 'password',
  },
  presign: {
    expiration: {
      default: 5 * 60,
      get: 3 * 60 * 60,
      put: 5 * 60,
    },
  },
  buckets,
} as const;

export const storageConfig = registerAs('storage', () => {
  return { ...config, buckets } as const;
});

export type BucketConfig = {
  name: BucketName;
  policy?: {
    raw?: object;
    public?: {
      all: boolean;
      prefix?: string[];
      action: string[];
    };
  };
};
export type storageConfig = ReturnType<typeof storageConfig>;
