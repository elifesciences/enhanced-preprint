import { createWriteStream, readFileSync } from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import { fromWebToken, fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { Readable } from 'stream';
import { S3Config, config } from '../config';

const getAWSCredentials = (s3config: S3Config) => {
  if (s3config.webIdentityTokenFile !== undefined && s3config.awsAssumeRoleArn !== undefined) {
    const webIdentityToken = readFileSync(s3config.webIdentityTokenFile, 'utf-8');
    return fromWebToken({
      roleArn: s3config.awsAssumeRoleArn,
      clientConfig: {
        region: s3config.region,
      },
      webIdentityToken,
    });
  }
  if (s3config.awsAssumeRoleArn !== undefined) {
    return fromTemporaryCredentials({
      params: {
        RoleArn: s3config.awsAssumeRoleArn,
        DurationSeconds: 900,
      },
      masterCredentials: {
        accessKeyId: s3config.accessKey ?? '',
        secretAccessKey: s3config.secretKey ?? '',
      },
      clientConfig: {
        region: s3config.region,
      },
    });
  }
  return {
    accessKeyId: s3config.accessKey ?? '',
    secretAccessKey: s3config.secretKey ?? '',
  };
};

export const getS3Client = (s3config: S3Config) => new S3Client({
  credentials: getAWSCredentials(s3config),
  endpoint: s3config.endPoint,
  forcePathStyle: true,
  region: s3config.region,
});

export type S3File = {
  Bucket: string,
  Key: string,
};

const constructEPPS3FilePath = (filename: string): S3File => ({
  Bucket: config.eppBucketName,
  Key: `${config.eppBucketPrefix}${filename}`,
});

export const constructEPPVersionS3FilePath = (filename: string, msid: string, versionIdentifier: string): S3File => constructEPPS3FilePath(`${msid}/v${versionIdentifier}/${filename}`);

export const getPresignedDownloadUrl = async (client: S3Client, file: S3File): Promise<string> => `${file.Key}`;
