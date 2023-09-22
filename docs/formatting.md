# Formatting

Formatting appears in a few different commands, namely:

- `name`
- `template`
- `general`

There are a few different variables you can put in that will replace normal text.

## Activity

One of the coolest features of the bot is changing the channel name to the current activity. If you want to edit the template simply use `@@game@@` to insert the games that are currently being played.

## Member Count

To display the member count of the channel use `@@num@@`.

## Plurals

The string `<<person/people>>` indicates what word to use depending on how many people are currently in the channel. If there is one person in the channel it will return `person` but if there's anything else it will return `people`. You can replace these words with anything you want provided that it's surrounded by << and >> and seperated by a slash.

## Numbers

Number formatting changes depending on what channel number you're in.

### Default Formatting

By default the channel template is `@@game@@ ##`. The `##` is replaced by the channel number in a normal format of `#1`.

### Nato Formatting

If you use the string `@@nato@@` in a channel name it will be replaced by the equivalent Nato code for the channel number. For example, if the channel was channel number `5` it would be replaced with `Echo` and with channel number `1` it would be `Alpha`.

### Precision Formatting

The string `###` will be replaced by the channel number (`1` in this case) in this format: `001`.

### Roman Numerals

The string `+#` will be replaced with the roman numeral representation of the channel number.

### No formatting

The string `$#` will result in just the channel number without anything else.

### Emoji formatting

The string `@@emoji@@` will be replaced by a random emoji. Generated when the channel is first created.
