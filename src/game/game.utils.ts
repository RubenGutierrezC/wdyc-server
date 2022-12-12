import { SocketResponse } from './dto/gateway-dto';

interface SocketResponserProps<T> {
  message?: string;
  data?: T;
  error?: boolean;
}

export const handleSocketResponse = <T>({
  message = 'ok',
  data,
  error = false,
}: SocketResponserProps<T>): SocketResponse<T> => {
  return {
    message,
    data,
    error,
  };
};
