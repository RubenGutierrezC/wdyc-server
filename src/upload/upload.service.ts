import { Injectable, OnModuleInit } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { Storage, Bucket } from '@google-cloud/storage';
import { nanoid } from 'nanoid';

@Injectable()
export class UploadService implements OnModuleInit {
  // private storage: Storage;
  private bucket: Bucket;

  constructor(private readonly envService: EnvService) {}

  onModuleInit() {
    const storage = new Storage({
      projectId: this.envService.PROJECT_ID,
      credentials: {
        type: this.envService.STORAGE_TYPE,
        token_url: this.envService.STORAGE_TOKEN_URL,
        client_email: this.envService.STORAGE_CLIENT_EMAIL,
        client_id: this.envService.STORAGE_CLIENT_ID,
        private_key: this.envService.STORAGE_PRIVATE_KEY,
      },
    });

    this.bucket = storage.bucket(this.envService.BUCKET);
  }

  async uploadImage(image: any): Promise<string> {
    try {
      const fileName = nanoid() + '.webp';

      const file = this.bucket.file(fileName);

      await file.save(image.buffer, {
        contentType: image.mimetype,
        public: true,
      });

      return file.publicUrl();
    } catch (error) {
      throw new Error(error);
    }
  }
}
