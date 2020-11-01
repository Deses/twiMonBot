import promiseTry from "./promiseTry";

const http = require('http');
const https = require('https');
const fetch = require('node-fetch');
const qs = require('querystring');
const AbortController = require('abort-controller');

interface FetchRequestOptions {
  method?: 'GET' | 'HEAD' | 'POST';
  responseType?: 'text' | 'json' | 'buffer',
  headers?: Record<string, string | string[] | undefined>,
  searchParams?: Record<string, any>,
  timeout?: number,
  keepAlive?: boolean,
  body?: string | URLSearchParams,
}

interface FetchResponse {
  url: string,
  method: string,
  statusCode: number,
  statusMessage: string,
  rawBody: any,
  body: any,
  headers: Record<string, string | string[]>,
}

function fetchRequest(url: string, options: FetchRequestOptions) {
  const {responseType, keepAlive, searchParams, ...fetchOptions} = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60 * 1000);

  return promiseTry(async () => {
    if (searchParams) {
      url = url.split('?')[0] + '?' + qs.stringify(searchParams);
    }

    let agentFn;
    if (keepAlive) {
      agentFn = keepAliveAgentFn;
    }

    const rawResponse: Response & {buffer: () => Promise<Buffer>} = await fetch(url, {
      agent: agentFn,
      ...fetchOptions,
      signal: controller.signal,
    });

    const fetchResponse: FetchResponse = {
      url: rawResponse.url,
      method: options.method!,
      statusCode: rawResponse.status,
      statusMessage: rawResponse.statusText,
      headers: normalizeHeaders(rawResponse.headers),
      rawBody: undefined as any,
      body: undefined as any,
    };

    if (options.method !== 'HEAD') {
      try {
        if (responseType === 'buffer') {
          fetchResponse.rawBody = await rawResponse.buffer();
        } else {
          fetchResponse.rawBody = await rawResponse.text();
        }
      } catch (err) {
        if (err.name === 'FetchError' && err.name !== 'body-timeout') {
          throw new ReadError(err, fetchResponse);
        } else {
          throw err;
        }
      }

      if (responseType === 'json') {
        try {
          fetchResponse.body = JSON.parse(fetchResponse.rawBody);
        } catch (err) {
          if (rawResponse.ok) {
            throw err;
          }
        }
      } else {
        fetchResponse.body = fetchResponse.rawBody;
      }
    }

    if (!rawResponse.ok) {
      throw new HTTPError(fetchResponse);
    }

    return fetchResponse;
  }).catch((err) => {
    if (err.name === 'FetchError') {
      if (['request-timeout', 'body-timeout'].includes(err.type)) {
        throw new TimeoutError(err);
      } else {
        throw new RequestError(err.message, err, undefined);
      }
    }
    throw err;
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export class RequestError extends Error {
  code?: string;
  stack!: string;
  declare readonly response?: FetchResponse;

  constructor(message: string, error: Partial<Error & {code?: string}>, response?: FetchResponse | undefined) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = 'RequestError';
    this.code = error.code;

    if (response) {
      Object.defineProperty(this, 'response', {
        enumerable: false,
        value: response
      });
    }

    if (typeof error.stack !== "undefined") {
      const indexOfMessage = this.stack.indexOf(this.message) + this.message.length;
      const thisStackTrace = this.stack.slice(indexOfMessage).split('\n').reverse();
      const errorStackTrace = error.stack.slice(error.stack.indexOf(error.message!) + error.message!.length).split('\n').reverse();

      // Remove duplicated traces
      while (errorStackTrace.length !== 0 && errorStackTrace[0] === thisStackTrace[0]) {
        thisStackTrace.shift();
      }

      this.stack = `${this.stack.slice(0, indexOfMessage)}${thisStackTrace.reverse().join('\n')}${errorStackTrace.reverse().join('\n')}`;
    }
  }
}

export class HTTPError extends RequestError {
  declare readonly response: FetchResponse;

  constructor(response: FetchResponse) {
    super(`Response code ${response.statusCode} (${response.statusMessage!})`, {}, response);

    this.name = 'HTTPError';
  }
}

export class TimeoutError extends RequestError {
  declare readonly response: undefined;

  constructor(error: Error) {
    super(error.message, error, undefined);

    this.name = 'TimeoutError';
  }
}

export class ReadError extends RequestError {
  declare readonly response: FetchResponse;

  constructor(error: Error, response: FetchResponse) {
    super(error.message, error, response);
    this.name = 'ReadError';
  }
}


const httpAgent = new http.Agent({
  keepAlive: true
});

const httpsAgent = new https.Agent({
  keepAlive: true
});

function keepAliveAgentFn(_parsedURL: URL) {
  if (_parsedURL.protocol == 'http:') {
    return httpAgent;
  } else {
    return httpsAgent;
  }
}

function normalizeHeaders(fetchHeaders: Headers) {
  const headers: Record<string, string | string[]> = {};
  fetchHeaders.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

export default fetchRequest;