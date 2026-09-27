
/* constants and config _*/

const default_env_id = '1';

const jcd_v3_kinds = {
  img: 'JcdImageV3'
} as const;

export const jcdConf = {
  default_env_id: default_env_id,
  jcd_v3_kinds: jcd_v3_kinds,
} as const;
