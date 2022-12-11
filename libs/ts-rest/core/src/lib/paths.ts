/**
 * @params T - The URL e.g. /posts/:id
 * @params TAcc - Accumulator object
 */
type RecursivelyExtractPathParams<
  T extends string,
  TAcc extends null | Record<string, string>
> = T extends `/:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/:${infer PathParam}`
  ? { [key in PathParam]: string }
  : T extends `/${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/${string}`
  ? TAcc
  : T extends `:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `:${infer PathParam}`
  ? TAcc & { [key in PathParam]: string }
  : T extends `${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : TAcc;

/**
 * Converts a path (with params) to a template string
 * @param S - The URL e.g. /posts/:id
 * @returns - The URL with the params e.g. /posts/${string}
 */
export type PathToTemplate<S extends string> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  S extends `${infer L}/:${infer _P}/${infer R}`
    ? PathToTemplate<`${L}/${string}${R}`>
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    S extends `${infer L}/:${infer _R}`
    ? PathToTemplate<`${L}/${string}`>
    : S;

/**
 * Extract path params from path function
 *
 * { id: string, commentId: string }
 *
 * @params T - The URL e.g. /posts/:id
 */
export type ParamsFromUrl<T extends string> = RecursivelyExtractPathParams<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
> extends infer U
  ? keyof U extends never
    ? undefined
    : {
        [key in keyof U]: U[key];
      }
  : never;

/**
 * @param path - The URL e.g. /posts/:id
 * @param params - The params e.g. { id: string }
 * @returns - The URL with the params e.g. /posts/123
 */
export const insertParamsIntoPath = <T extends string>({
  path,
  params,
}: {
  path: T;
  params: ParamsFromUrl<T>;
}) => {
  return path
    .replace(/:([^/]+)/g, (_, p) => {
      return params?.[p] || '';
    })
    .replace(/\/\//g, '/');
};
