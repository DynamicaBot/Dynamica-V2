import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService {
  private client: mqtt.MqttClient | undefined = undefined;
  private logger = new Logger(MqttService.name);

  constructor(private readonly config: ConfigService) {
    const mqttUrl = this.config.get<string>('MQTT_URL');
    const mqttUser = this.config.get<string>('MQTT_USER');
    const mqttPass = this.config.get<string>('MQTT_PASS');

    if (!mqttUrl || !mqttUser || !mqttPass) {
      this.logger.debug('MQTT not configured, skipping');
    } else {
      this.logger.debug('Connecting to MQTT');
      this.client = mqtt.connect(mqttUrl, {
        username: mqttUser,
        password: mqttPass,
      });
      this.client.on('connect', () => {
        this.logger.debug('Connected to MQTT');
      });
      this.client.on('error', (error) => {
        this.logger.error('MQTT error', error);
      });
    }
  }

  /**
   * Publish a message to a topic
   * @param topic The topic to publish to
   * @param message The message to publish
   * @returns Promise that resolves when the message is published
   */
  public async publish(topic: string, message: string | number) {
    if (!this.client) {
      return;
    }

    const waitReady = new Promise<void>((resolve) => {
      this.client.once('connect', (err) => {
        if (err) {
          this.logger.error('MQTT error', err);
        }
        resolve();
      });
    });

    await waitReady;

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(topic, `${message}`, { retain: true }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
