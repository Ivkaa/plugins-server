import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export type ApiReaderResponse = z.infer<typeof ApiReaderResponseSchema>;
export const ApiReaderResponseSchema = z.object({
  status: z.enum(['success', 'failed']),
  content: z.string(),
});

export type ApiReaderRequestParam = z.infer<typeof ApiReaderRequestParamSchema>;
export const ApiReaderRequestParamSchema = z.object({
  url: z.string().describe('The URL of the web page to retrieve content from'),
  method: z.enum(['get', 'post']).describe('The HTTP method to use when fetching the web page'),
  body: z.string().optional().describe('The body of the request when using the POST method'),
});
