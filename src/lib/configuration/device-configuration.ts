
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
}
