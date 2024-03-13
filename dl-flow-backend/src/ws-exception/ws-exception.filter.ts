import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Exception } from '../code-generate/code-generate.service';
import { Socket } from 'socket.io';
import { State } from '../code-generate/code-generate.gateway';

@Catch()
export class WsExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ws = host.switchToWs();
    const client = ws.getClient<Socket>();
    if (exception instanceof Exception) {
      client.emit(State.err, exception.message);
    } else {
      client.emit(State.err, 'Schema 有误, 请检查');
    }
    return;
  }
}
