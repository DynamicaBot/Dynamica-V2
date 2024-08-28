import { Catch, type ArgumentsHost, type HttpServer } from '@nestjs/common';
import { type AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  handleUnknownError(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    exception: any,
    host: ArgumentsHost,
    // biome-ignore lint/suspicious/noExplicitAny: Skip error reporting as we're not using any properties
    applicationRef: HttpServer<any, any> | AbstractHttpAdapter<any, any, any>,
  ): void {
    Sentry.captureException(exception);
    super.handleUnknownError(exception, host, applicationRef);
  }
}
