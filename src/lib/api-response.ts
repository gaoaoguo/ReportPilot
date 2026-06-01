export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiErrorPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return {
    ok: true,
    data
  };
}

export function apiError(code: string, message: string): ApiErrorPayload {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}
