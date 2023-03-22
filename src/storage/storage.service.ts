import {
  BucketCannedACL,
  CreateBucketCommand,
  DeleteBucketPolicyCommand,
  DeleteObjectCommand,
  GetBucketAclCommand,
  GetBucketPolicyCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutBucketAclCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  PutObjectRequest,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BucketConfig,
  BucketName,
  storageConfig,
} from '../config/storage.config';

@Injectable()
export class StorageService {
  s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get('storage.region'),
      credentials: {
        accessKeyId: configService.get('storage.auth.accessKey'),
        secretAccessKey: configService.get('storage.auth.secretKey'),
      },
      endpoint: configService.get('storage.endpoint'),
      forcePathStyle: true,
    });

    this.init();
  }

  private buildPolicy(bucket: BucketConfig): string {
    if (!bucket.policy) return null;

    let policy = null;
    if (bucket.policy.raw && Object.keys(bucket.policy.raw).length > 0) {
      policy = bucket.policy.raw;
    }
    if (bucket.policy.public) {
      policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: bucket.policy.public.action,
            Resource: bucket.policy.public.all
              ? [`arn:aws:s3:::${bucket.name}/*`]
              : bucket.policy.public.prefix.map(
                  (prefix: string) => `arn:aws:s3:::${bucket.name}/${prefix}*`,
                ),
          },
        ],
      };
    }

    return JSON.stringify(policy);
  }

  private async init() {
    const existingBuckets = (
      await this.s3.send(new ListBucketsCommand({}))
    ).Buckets.map((bucket) => bucket.Name);

    for (const bucket of this.configService.get<BucketConfig[]>(
      'storage.buckets',
    )) {
      if (!existingBuckets.includes(bucket.name)) {
        console.info(`[Storage] Bucket ${bucket.name} not found, creating...`);
        await this.s3.send(
          new CreateBucketCommand({
            Bucket: bucket.name,
          }),
        );
      }

      const policy = this.buildPolicy(bucket);
      if (policy) {
        await this.s3.send(
          new PutBucketPolicyCommand({
            Bucket: bucket.name,
            Policy: policy,
          }),
        );
      } else {
        await this.s3.send(
          new DeleteBucketPolicyCommand({
            Bucket: bucket.name,
          }),
        );
      }
    }
  }

  getObjectUrl(bucket: BucketName, key: string) {
    return `${this.configService.get<storageConfig['endpoint']>(
      'storage.endpoint',
    )}/${bucket}/${key}`;
  }

  put(
    bucket: BucketName,
    key: string,
    body: PutObjectRequest['Body'] | string | Uint8Array | Buffer,
  ) {
    return this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      }),
    );
  }

  get(bucket: BucketName, key: string) {
    return this.s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  delete(bucket: BucketName, key: string) {
    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  presign(bucket: BucketName, key: string) {
    const signUrl = (
      command: any,
      expiresIn: number = this.configService.get(
        'storage.presign.expiration.default',
      ),
      params = {},
    ) =>
      getSignedUrl(
        this.s3,
        new command({ Bucket: bucket, Key: key, ...params }),
        { expiresIn },
      );

    return {
      get: (
        expiresIn: number = this.configService.get(
          'storage.presign.expiration.get',
        ),
      ) => signUrl(GetObjectCommand, expiresIn),
      put: (
        expiresIn: number = this.configService.get(
          'storage.presign.expiration.put',
        ),
      ) => signUrl(PutObjectCommand, expiresIn),
    };
  }

  async emptyBucket(bucket: BucketName) {
    const { Contents } = await this.s3.send(new ListObjectsCommand({
      Bucket: bucket
    }))
    if (!Contents) return;
    for (const o of Contents) {
      await this.delete(bucket, o.Key);
    }
  }

  async test() {
    // await this.s3.send(
    //   new PutBucketAclCommand({
    //     Bucket: 'avatar',
    //     ACL: BucketCannedACL.public_read,
    //   }),
    // );
    // const r1 = await this.put('avatar', 'public/test.txt', 'Hello World !');
    // console.log(r1);
    // const r2 = await this.get('avatar', 'user1/test.txt');
    // const data2 = await r2.Body.transformToString();
    // console.log(data2);
    // const r3 = await this.share('avatar', 'user1/test.txt', 3600);
    // console.log(r3);
    // console.log(
    //   await this.s3.send(
    //     new GetBucketPolicyCommand({
    //       Bucket: 'avatar',
    //     }),
    //   ),
    // );
    // await this.delete('avatar', 'test.txt');
    // const r3 = await this.get('avatar', 'test.txt');
    // const data3 = await r3.Body.transformToString();
    // console.log(data3);
  }
}
