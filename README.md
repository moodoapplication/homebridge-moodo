# homebridge-moodo

**IMPORTANT: If you update this plugin from v1 to v2, you have to change the configuration as described below.**

Moodo plugin for [Homebridge](https://github.com/nfarina/homebridge). [Moodo](https://moodo.co) is the only diffuser to enable mixing scents and personalizing them to your taste.
This plugin can be used to expose your Moodo devices to Homebridge with support for
* On/off
* Main intensity
* Intensity of individual capsules

## Get your Token

In order to authenticate against the Moodo server, you have to create a token for your Moodo account. Therefore, visit https://homebridge.moodo.co and sign in with the Moodo account you want to use with the plugin. You will receive
* The token
* A list of device IDs that you can use with this plugin

## Installation

Please install the plugin with the following command:

```
npm install -g homebridge-moodo
```

## Configuration

```json
{
    "platforms": [
        {
            "platform": "MoodoPlatform",
            "token": "<YOUR-TOKEN>",
            "devices": [
                {
                    "id": <DEVICE-ID>,
                    "name": "<DEVICE-NAME>",
                    "type": "fan",
                    "showCapsules": false,
                    "useCapsuleNames": false,
                    "showTimer": false,
                    "isSingleAccessoryModeEnabled": false
                }
            ]
        }
    ]
}
```

**token**: Your account token that you received in step **Get your Token**.

**devices**: Array of all your Moodo devices that the plugin should expose to HomeKit.

**id**: The device ID that you received in step **Get your Token**. This is a number.

**name**: The name that should be used in HomeKit for this device.

**type** (optional): Determines the type of the HomeKit device that is to be exposed. Possible values are `purifier` or `fan`. Defaults to `fan`.

**showCapsules** (optional): Determines whether controls for the individual capsules are exposed to HomeKit. Defaults to `false`.

**useCapsuleNames** (optional): By default, the capsules are named "Capsule 1" to "Capsule 4". If this value is set to `true`, the actual capsule names (i.e. the fragrence names) are shown. (Only used if `showCapsules` is `true`)

**showTimer** (optional): Determines whether a "timer" should be exposed to HomeKit. This is a switch with a duration characteristics. Changing the switch to ON starts the device and the timer for the specified duration (in seconds). When the timer elapses, the device is turned off. The duration characteristic is not supported in the Home app. Defaults to `false`.

**isSingleAccessoryModeEnabled** (optional): By default, the capsules are placed in a separate accessory (works best in the Apple Home app). If this value is set to `true`, those controls are added to the main accessory instead of a separate accessory. (Only used if `showCapsules` is `true`)

