import { z, ZodTypeAny } from 'zod';
import { AppRoute, AppRouteMutation, AppRouteQuery, AppRouter } from './dsl';
import { insertParamsIntoPath, ParamsFromUrl, PathToTemplate } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { HTTPStatusCode } from './status-codes';
import { AreAllPropertiesOptional, ZodInferOrType } from './type-utils';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? DataReturn<T[TKey]>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.input<T> : T;

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
type DataReturn<TRoute extends AppRoute> = TRoute extends AppRouteQuery
  ? DataReturnQuery<TRoute>
  : TRoute extends AppRouteMutation
  ? DataReturnMutation<TRoute>
  : never;

type DataReturnQuery<TRoute extends AppRouteQuery> = TRoute['query'] extends
  | null
  | undefined
  ? DataReturnQueryNoQuery<TRoute>
  : DataReturnQueryWithQuery<TRoute>;

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

type DataReturnQueryWithQuery<TRoute extends AppRouteQuery> =
  AreAllPropertiesOptional<AppRouteMutationType<TRoute['query']>> extends true
    ? (
        path: PathToTemplate<TRoute['path']>,
        query?: AppRouteMutationType<TRoute['query']>,
        options?: QueryOptions<TRoute>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>
    : (
        path: PathToTemplate<TRoute['path']>,
        query: AppRouteMutationType<TRoute['query']>,
        options?: QueryOptions<TRoute>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>;

type DataReturnQueryNoQuery<TRoute extends AppRouteQuery> = (
  path: PathToTemplate<TRoute['path']>,
  options?: QueryOptions<TRoute>
) => Promise<ApiRouteResponse<TRoute['responses']>>;

type DataReturnMutation<TRoute extends AppRouteMutation> =
  TRoute['body'] extends null | undefined
    ? DataReturnMutationNoBody<TRoute>
    : DataReturnMutationWithBody<TRoute>;

type DataReturnMutationWithBody<TRoute extends AppRouteMutation> =
  TRoute['contentType'] extends string
    ? (
        path: PathToTemplate<TRoute['path']>,
        method: TRoute['method'],
        body: AppRouteBodyOrFormData<TRoute>,
        options: QueryOptions<TRoute>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>
    : AreAllPropertiesOptional<
        AppRouteMutationType<TRoute['query']>
      > extends true
    ? (
        path: PathToTemplate<TRoute['path']>,
        method: TRoute['method'],
        body?: AppRouteBodyOrFormData<TRoute>,
        options?: QueryOptions<TRoute>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>
    : (
        path: PathToTemplate<TRoute['path']>,
        method: TRoute['method'],
        body: AppRouteBodyOrFormData<TRoute>,
        options?: QueryOptions<TRoute>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>;

type DataReturnMutationNoBody<TRoute extends AppRouteMutation> = (
  path: PathToTemplate<TRoute['path']>,
  method: TRoute['method'],
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
