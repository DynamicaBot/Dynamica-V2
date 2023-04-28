import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubSubService extends PubSub {
  constructor() {
    super();
  }
}
