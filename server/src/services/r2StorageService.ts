import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { getR2Client, getR2BucketName } from '../config/r2';

export type R2PutOptions = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type R2GetResult = {
  body: Readable;
  contentType: string;
  contentLength?: number;
};

export const r2StorageService = {
  async putObject({ key, body, contentType }: R2PutOptions): Promise<void> {
    const client = getR2Client();
    const bucket = getR2BucketName();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  },

  async getObject(key: string): Promise<R2GetResult> {
    const client = getR2Client();
    const bucket = getR2BucketName();
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!result.Body) {
      throw new Error('Empty response from R2');
    }
    return {
      body: result.Body as Readable,
      contentType: result.ContentType ?? 'application/octet-stream',
      contentLength: result.ContentLength,
    };
  },

  async deleteObject(key: string): Promise<void> {
    const client = getR2Client();
    const bucket = getR2BucketName();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};
