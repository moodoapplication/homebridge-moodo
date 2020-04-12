
import { DeviceConfiguration } from './device-configuration';

/**
 * Represents the homebridge configuration for the plugin.
 */
export interface Configuration {

    /**
     * Gets or sets the URI of the HTTP API.
     */
    apiUri: string;

    /**
     * Gets or sets the number of retries before repoorting failure.
     */
    maximumApiRetry: number;

    /**
     * Gets or sets the interval between retries in milliseconds.
     */
    apiRetryInterval: number;

    /**
     * Gets or sets the URI of the socket.io endpoint.
     */
    socketIoUri: string;
    
    /**
     * Gets or sets the token that is used to authenticate against the Moodo API.
     */
    token: string;

    /**
     * Gets or sets the devices that should be exposed to HomeKit.
     */
    devices: Array<DeviceConfiguration>;

    /**
     * Gets or sets a unique ID that is used to sort out updates from the socket that have been initiated by the plugin.
     */
    restfulRequestId: string;
}
