import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Params as PinoParams } from 'nestjs-pino';
import { Level as PinoLevel } from 'pino';
import { Options } from 'pino-http';
import { Environment } from './env.validations';

@Injectable()
export class EnvService {
  public readonly NODE_ENV: Environment;
  public readonly PORT: string;
  public readonly LOG_NAME: string;
  public readonly LOG_LEVEL: PinoLevel;

  // database
  public readonly DB_URI: string;
  public readonly DB_NAME: string;

  // redis
  public readonly REDIS_HOST: string;
  public readonly REDIS_PORT: string;
  public readonly REDIS_DB: string;
  public readonly REDIS_PASSWORD: string;

  // firebase
  public readonly PROJECT_ID: string;
  public readonly STORAGE_TYPE: string;
  public readonly STORAGE_TOKEN_URL: string;
  public readonly STORAGE_CLIENT_EMAIL: string;
  public readonly STORAGE_CLIENT_ID: string;
  public readonly STORAGE_PRIVATE_KEY: string;
  public readonly BUCKET: string;

  constructor(private readonly config: ConfigService) {
    this.NODE_ENV = this.config.get<Environment>(
      'NODE_ENV',
      Environment.Development,
    );
    this.PORT = this.config.get<string>('PORT', '');
    this.LOG_NAME = this.config.get<string>('LOG_NAME', 'wdyc');
    this.LOG_LEVEL = this.config.get<PinoLevel>('LOG_LEVEL', 'debug');

    // database
    this.DB_URI = this.config.get<string>('DB_URI', '');
    this.DB_NAME = this.config.get<string>('DB_NAME', '');

    // redis
    this.REDIS_HOST = this.config.get<string>('REDIS_HOST', '');
    this.REDIS_PORT = this.config.get<string>('REDIS_PORT', '');
    this.REDIS_DB = this.config.get<string>('REDIS_DB', '');
    this.REDIS_PASSWORD = this.config.get<string>('REDIS_PASSWORD', '');

    // firebase
    this.PROJECT_ID = this.config.get<string>('PROJECT_ID', '');
    this.STORAGE_TYPE = this.config.get<string>('STORAGE_TYPE', '');
    this.STORAGE_TOKEN_URL = this.config.get<string>('STORAGE_TOKEN_URL', '');
    this.STORAGE_CLIENT_EMAIL = this.config.get<string>(
      'STORAGE_CLIENT_EMAIL',
      '',
    );
    this.STORAGE_CLIENT_ID = this.config.get<string>('STORAGE_CLIENT_ID', '');
    this.STORAGE_PRIVATE_KEY = this.config
      .get<string>('STORAGE_PRIVATE_KEY', '')
      .replace(/\\n/g, '\n');

    this.BUCKET = this.config.get<string>('BUCKET', '').replace(/\\n/g, '\n');
  }

  public isProduction(): boolean {
    return this.NODE_ENV === Environment.Production;
  }

  public isDevelopment(): boolean {
    return this.NODE_ENV === Environment.Development;
  }

  public getPinoConfig(): PinoParams {
    const pinoHttp: Options = {
      name: this.LOG_NAME,
      level: this.LOG_LEVEL,
      autoLogging: false,
    };

    if (this.isDevelopment()) {
      pinoHttp.transport = {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: true, translateTime: true },
      };
    }

    return { pinoHttp };
  }

  public getDatabaseConfig() {
    return {
      uri: this.DB_URI,
      dbName: this.DB_NAME,
    };
  }
}
