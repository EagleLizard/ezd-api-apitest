
/*
  EAT = [E]zd [A]pi [T]est
_*/
export const ezdErrorCodes = {
  DEFAULT: 'EAT_0.0',
  schema_decode: 'EAT_0.1',
  http_client_invalid_body_param: 'EAT_0.2',
  REQUEST_ERROR: 'EAT_1.0',
  LOGIN_ERROR: 'EAT_1.1',
  create_test_user_error: 'EAT_1.2',
  get_test_user_error: 'EAT_1.3',
  delete_test_user_error: 'EAT_1.4',
} as const;

export type EzdErrorCode = typeof ezdErrorCodes[keyof typeof ezdErrorCodes];
