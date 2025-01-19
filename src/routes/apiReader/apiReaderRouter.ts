import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import got from 'got';
import { StatusCodes } from 'http-status-codes';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

import { ApiReaderRequestParamSchema, ApiReaderResponseSchema } from './apiReaderModel';

export const articleReaderRegistry = new OpenAPIRegistry();
articleReaderRegistry.register('Api Reader', ApiReaderResponseSchema);

const parseJsonIfPossible = (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
};

const fetchAndCleanContent = async (url: string, method: 'get' | 'post', body?: string) => {
  try {
    const apiReqBody = body ? JSON.stringify(parseJsonIfPossible(body)) : undefined;
    const response = await got(url, { method, body: apiReqBody, headers: { 'Content-Type': 'application/json' } });
    const bodyParsed = parseJsonIfPossible(response.body);

    return { content: bodyParsed, status: response.statusCode };
  } catch (error) {
    console.error(`Error fetching content ${(error as Error).message}`);
    return { content: `Error fetching content ${(error as Error).message}`, status: 'failed' };
  }
};

export const apiReaderRouter: Router = (() => {
  const router = express.Router();

  articleReaderRegistry.registerPath({
    method: 'get',
    path: '/api-reader/get-content',
    tags: ['Api Reader'],
    request: {
      query: ApiReaderRequestParamSchema,
    },
    responses: createApiResponse(ApiReaderResponseSchema, 'Success'),
  });

  router.get('/get-content', async (_req: Request, res: Response) => {
    const { url, method, body } = _req.query;

    if (typeof url !== 'string') {
      return new ServiceResponse(ResponseStatus.Failed, 'URL must be a string', null, StatusCodes.BAD_REQUEST);
    }

    if (method !== 'get' && method !== 'post') {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Method must be either "get" or "post"',
        null,
        StatusCodes.BAD_REQUEST
      );
    }

    if (body && typeof body !== 'string') {
      return new ServiceResponse(ResponseStatus.Failed, 'Body must be a string', null, StatusCodes.BAD_REQUEST);
    }

    try {
      const content = await fetchAndCleanContent(url, method, body);
      const serviceResponse = new ServiceResponse(
        ResponseStatus.Success,
        'Content fetched successfully',
        content,
        StatusCodes.OK
      );
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error(`Error fetching content ${(error as Error).message}`);
      const errorMessage = `Error fetching content $${(error as Error).message}`;
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  });

  return router;
})();
