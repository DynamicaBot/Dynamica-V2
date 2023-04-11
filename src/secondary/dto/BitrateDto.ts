import { NumberOption, StringOption } from 'necord';

const bitrates = [
  8000, 16000, 32000, 48000, 96000, 128000, 192000, 256000, 320000,
];

const choices = bitrates.map((bitrate) => ({
  name:
    `${bitrate / 1000}kbps` +
    (bitrate === 96000 ? ' (default)' : ``),
  value: bitrate,
}));

export class BitrateDto {
  @NumberOption({
    description: 'The bitrate to set',
    name: 'bitrate',
    required: true,
    choices,
  })
  bitrate: number;

  @StringOption({
    description: 'The channel to set the bitrate for',
    name: 'secondary',
    autocomplete: true,
    required: true,
  })
  secondary: string;
}
