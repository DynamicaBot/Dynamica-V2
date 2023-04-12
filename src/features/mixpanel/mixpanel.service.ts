import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Mixpanel } from 'mixpanel';
import mixpanel from 'mixpanel';

@Injectable()
export class MixpanelService {
  private readonly mixpanel: Mixpanel | null = null;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get('MIXPANEL_TOKEN');
    if (token) {
      this.mixpanel = mixpanel.init(token);
    }
  }

  public async track<T extends Events>(
    event: T,
    properties: TrackingProperties,
  ) {
    return new Promise<void>((resolve, reject) => {
      if (this.mixpanel) {
        this.mixpanel.track(event, properties, (err) => {
          if (err) {
            reject(err.message);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  public async identify(distinct_id: string, properties: Record<string, any>) {
    return new Promise<void>((resolve, reject) => {
      if (this.mixpanel) {
        this.mixpanel.people.set(distinct_id, properties, (err) => {
          if (err) {
            reject(err.message);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

type Events = `${CommandNames} Command Run` | TrackingEventNames;

type TrackingEventNames =
  | 'Guild Joined'
  | 'Guild Left'
  | 'Primary Created'
  | 'Primary Deleted'
  | 'Secondary Created'
  | 'Secondary Deleted'
  | 'Secondary Name Updated';

type InfoSubcommands = 'Primary' | 'Secondary' | 'Guild';

type CommandNames =
  | 'Allowjoin'
  | 'Alias'
  | 'Unalias'
  | 'Aliases'
  | 'Allyourbase'
  | 'Bitrate'
  | 'Create'
  | 'General'
  | `Info ${InfoSubcommands}`
  | 'Limit'
  | 'Lock'
  | 'Unlock'
  | 'Name'
  | 'Ping'
  | 'Template'
  | 'Transfer';

interface TrackingProperties extends Record<string, string> {
  distinct_id: string;
}
