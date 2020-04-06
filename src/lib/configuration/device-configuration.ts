
/**
 * Represents a Moodo device in the homebridge configuration for the plugin.
 */
export interface DeviceConfiguration {

    /**
     * Gets or sets the device ID (named "device_key" in the Moodo API).
     */
    id: number;

    /**
     * Gets or sets the device name.
     */
    name: string;

    /**
     * Gets or sets the type of the HomeKit device.
     */
    type: string;

    /**
     * Gets or sets a value that determines whether controls for the individual capsules are exposed to HomeKit.
     */
    showCapsules: boolean;

    /**
     * Gets or sets a value that determines whether the names of the capsule services should be those of the fragrences.
     */
    useCapsuleNames: boolean;

    /**
     * Gets or sets a value that determines whether controls for the individual capsules are added to the main accessory.
     */
    isSingleAccessoryModeEnabled: boolean;
}
