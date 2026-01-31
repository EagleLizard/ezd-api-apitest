
/*
see:
  - https://stackoverflow.com/a/51298050/4677252
  - https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
_*/
export type NoIndex<T> = {
  [K in keyof T as
    string extends K
    ? never
    : number extends K
      ? never
      : symbol extends K
        ? never
        : K
  ]: T[K];
};

/*
  for more complex indices
   see: https://stackoverflow.com/a/68261113/4677252
_*/
export type NoIndex2<R> = {
  [K in keyof R as {} extends Record<K, 1> ? never : K]: R[K];
};
