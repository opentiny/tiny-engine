import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller('code-generate')
export class CodeGenerateController {
  @Get(':file-name')
  download(
    @Param('file-name') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    if (!fileName) {
      throw new HttpException(
        'file name can not be undefined',
        HttpStatus.BAD_REQUEST,
      );
    }
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      throw new HttpException(`${fileName} not found`, HttpStatus.NOT_FOUND);
    }
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${fileName}.py"`,
    });
    return new StreamableFile(createReadStream(filePath));
  }
}
