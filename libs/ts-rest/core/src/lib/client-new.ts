import { z, ZodTypeAny } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  initContract,
} from './dsl';
import { insertParamsIntoPath, ParamsFromUrl } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { HTTPStatusCode } from './status-codes';
import { AreAllPropertiesOptional, ZodInferOrType } from './type-utils';

const c = initContract();

const test = c.router({
  healthCheck: {
    method: 'GET',
    path: '/healthCheck',
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      ),
    },
  },
});

const api = c.router({
  test,
  getUserRPCStyle: {
    method: 'GET',
    path: '/getUserRPCStyle',
    query: z.object({
      id: z.string(),
      optionalQuery: z.string().optional(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
      }),
    },
  },
  getUser: {
    method: 'GET',
    path: '/users/:id',
    query: z.object({
      optionalQuery: z.string().optional(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
      }),
    },
  },
  getUsers: {
    method: 'GET',
    path: '/getUsers',
    query: z.object({
      requiredQuery: z.string(),
    }),
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      ),
    },
  },
});

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? DataReturn<T[TKey], TKey extends string ? TKey : never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.input<T> : T;

type AllAvailablePaths<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey]['path']
    : T[TKey] extends AppRouter
    ? AllAvailablePaths<T[TKey]>
    : never;
}[keyof T];

type ProxyObjTest = RecursiveProxyObj<typeof api>;

const proxyObjTest = undefined as unknown as ProxyObjTest;

type QueryClientPathMode<T extends AppRouter> = (
  path: AllAvailablePaths<T>
) => undefined;

const queryClientPathMode = (path: AllAvailablePaths<typeof api>) => {
  return undefined;
};

proxyObjTest.getUsers({ requiredQuery: 'Required' });

queryClientPathMode('/getUsers');

proxyObjTest.getUsers({ requiredQuery: 'Olly' });

proxyObjTest.getUserRPCStyle({ id: '123' });

proxyObjTest.getUser('/users/:id', { id: '123' });

proxyObjTest.test.healthCheck();

/**
 * Extract the path params from the path in the contract
 */
type PathParamsFromUrl<T extends AppRoute> = ParamsFromUrl<
  T['path']
> extends infer U
  ? U
  : never;

// Allow FormData if the contentType is multipart/form-data
type AppRouteBodyOrFormData<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? FormData | AppRouteMutationType<T['body']>
    : AppRouteMutationType<T['body']>;

interface DataReturnArgs<TRoute extends AppRoute> {
  body: TRoute extends AppRouteMutation
    ? AppRouteBodyOrFormData<TRoute>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: TRoute['query'] extends ZodTypeAny
    ? AppRouteMutationType<TRoute['query']>
    : never;
}

type ApiRouteResponse<T> =
  | {
      [K in keyof T]: {
        status: K;
        body: ZodInferOrType<T[K]>;
      };
    }[keyof T]
  | {
      status: Exclude<HTTPStatusCode, keyof T>;
      body: unknown;
    };

/**
 * Returned from a mutation or query call
 */
type DataReturn<
  TRoute extends AppRoute,
  TAppRouteKey extends string
> = TRoute extends AppRouteQuery
  ? QueryClientArgsQuery<TRoute, TAppRouteKey>
  : TRoute extends AppRouteMutation
  ? QueryClientArgsMutation<TRoute, TAppRouteKey>
  : never;

type QueryOptions<TRoute extends AppRoute> = TRoute extends AppRouteMutation
  ? TRoute['contentType'] extends string
    ? {
        contentType: TRoute['contentType'];
        extraHeaders?: Record<string, string>;
      }
    : {
        extraHeaders?: Record<string, string>;
      }
  : {
      extraHeaders?: Record<string, string>;
    };

/**
 * Combination of query params and path params
 */
type QueryClientParams<TRoute extends AppRoute> = ParamsFromUrl<
  TRoute['path']
> extends undefined
  ? AppRouteMutationType<TRoute['query']>
  : ParamsFromUrl<TRoute['path']> & AppRouteMutationType<TRoute['query']>;

/**
 * Combination of body and path params
 */
type MutationClientParams<TRoute extends AppRouteMutation> = ParamsFromUrl<
  TRoute['path']
> extends undefined
  ? AppRouteBodyOrFormData<TRoute>
  : ParamsFromUrl<TRoute['path']> & AppRouteBodyOrFormData<TRoute>;

type QueryClientArgsQuery<
  TRoute extends AppRouteQuery,
  ProxyAccessPath extends string
> =
  // if the proxy access path is the same as the path, remove the path requirement
  TRoute['path'] extends `/${infer TPath}`
    ? TPath extends ProxyAccessPath
      ? // Do we need query params
        AreAllPropertiesOptional<QueryClientParams<TRoute>> extends true
        ? (
            params?: QueryClientParams<TRoute>,
            options?: QueryOptions<TRoute>
          ) => Promise<ApiRouteResponse<TRoute['responses']>>
        : (
            params: QueryClientParams<TRoute>,
            options?: QueryOptions<TRoute>
          ) => Promise<ApiRouteResponse<TRoute['responses']>>
      : // We do need query params
      AreAllPropertiesOptional<QueryClientParams<TRoute>> extends true
      ? (
          path: TRoute['path'],
          params?: QueryClientParams<TRoute>,
          options?: QueryOptions<TRoute>
        ) => Promise<ApiRouteResponse<TRoute['responses']>>
      : (
          path: TRoute['path'],
          params: QueryClientParams<TRoute>,
          options?: QueryOptions<TRoute>
        ) => Promise<ApiRouteResponse<TRoute['responses']>>
    : never;

type QueryClientArgsMutation<
  TRoute extends AppRouteMutation,
  TAppRouteKey extends string
> = TRoute['contentType'] extends string
  ? (
      path: TRoute['path'],
      method: TRoute['method'],
      paramsAndBody: MutationClientParams<TRoute>,
      options: QueryOptions<TRoute>
    ) => Promise<ApiRouteResponse<TRoute['responses']>>
  : AreAllPropertiesOptional<AppRouteMutationType<TRoute['query']>> extends true
  ? (
      path: TRoute['path'],
      method: TRoute['method'],
      paramsAndBody?: MutationClientParams<TRoute>,
      options?: QueryOptions<TRoute>
    ) => Promise<ApiRouteResponse<TRoute['responses']>>
  : (
      path: TRoute['path'],
      method: TRoute['method'],
      paramsAndBody: MutationClientParams<TRoute>,
      options?: QueryOptions<TRoute>
    ) => Promise<ApiRouteResponse<TRoute['responses']>>;

interface ClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
  credentials?: RequestCredentials;
}

type ApiFetcher = (args: {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: FormData | string | null | undefined;
  credentials?: RequestCredentials;
}) => Promise<{ status: number; body: unknown }>;

const defaultApi: ApiFetcher = async ({
  path,
  method,
  headers,
  body,
  credentials,
}) => {
  const result = await fetch(path, { method, headers, body, credentials });

  try {
    return {
      status: result.status,
      body: await result.json(),
    };
  } catch {
    return {
      status: result.status,
      body: await result.text(),
    };
  }
};

const createFormData = (body: unknown) => {
  const formData = new FormData();

  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, JSON.stringify(value));
    }
  });

  return formData;
};

const fetchApi = (
  path: string,
  clientArgs: ClientArgs,
  body: unknown,
  method: string
) => {
  const apiFetcher = clientArgs.api || defaultApi;

  // TODO: Deal with multipart formdata
  // if (method !== 'GET' && route.contentType === 'multipart/form-data') {
  //   return apiFetcher({
  //     path,
  //     method: route.method,
  //     credentials: clientArgs.credentials,
  //     headers: {
  //       ...clientArgs.baseHeaders,
  //     },
  //     body: body instanceof FormData ? body : createFormData(body),
  //   });
  // }

  return apiFetcher({
    path,
    method: method,
    credentials: clientArgs.credentials,
    headers: {
      ...clientArgs.baseHeaders,
      'Content-Type': 'application/json',
    },
    body:
      body !== null && body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const getCompleteUrl = (
  query: unknown,
  baseUrl: string,
  params: unknown,
  path: string
) => {
  const pathWithParams = insertParamsIntoPath({
    path: path,
    params: params as any,
  });
  const queryComponent = convertQueryParamsToUrlString(query);
  return `${baseUrl}${pathWithParams}${queryComponent}`;
};

const getRouteQuery = async <TAppRoute extends AppRoute>(
  clientArgs: ClientArgs,
  inputArgs: DataReturnArgs<any>,
  path: string,
  method: string
) => {
  const completeUrl = getCompleteUrl(
    inputArgs.query,
    clientArgs.baseUrl,
    inputArgs.params,
    path
  );

  return fetchApi(completeUrl, clientArgs, inputArgs.body, method);
};

const createNewProxy = (args: ClientArgs) => {
  return new Proxy(() => undefined, {
    get: (): unknown => {
      return createNewProxy(args);
    },
    apply: (_target, _thisArg, argArray) => {
      const path = argArray[0];
      const method = argArray[1];
      const inputArgs = argArray[2];

      return getRouteQuery(args, inputArgs, path, method);
    },
  });
};

type InitClientReturn<T extends AppRouter> = RecursiveProxyObj<T>;

export const initClientNew = <T extends AppRouter>(
  args: ClientArgs
): InitClientReturn<T> => {
  const proxy = createNewProxy(args);

  return proxy as unknown as InitClientReturn<T>;
};
