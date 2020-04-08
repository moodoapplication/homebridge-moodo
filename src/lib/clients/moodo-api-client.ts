
import axios from 'axios';

import { Platform } from '../platform';
import { Box } from './models/box';
import { BoxesResponse } from './models/boxes-response';
import { BoxUpdate } from './models/box-update';

/**
 * Represents a client that communicates with the Moodo HTTP API.
 */
export class MoodoApiClient {

    /**
     * Initializes a new MoodoApiClient instance.
     * @param platform The platform of the plugin.
     */
    constructor(private platform: Platform) { }

    /**
     * Gets the box information from the API.
     * @param retryCount The number of retries before reporting failure.
     */
    public async getBoxesAsync(retryCount?: number): Promise<Array<Box>> {
        this.platform.logger.debug(`Getting boxes via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Sends the HTTP request to get the single box
        try {
            const response = await axios.get<BoxesResponse>(`${this.platform.configuration.apiUri}/boxes`, { 
                headers: {
                    token: this.platform.configuration.token
                } 
            });
            return response.data.boxes;
        } catch (e) {
            this.platform.logger.warn(`Error while getting box via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                return await this.getBoxesAsync(retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Powers the box on, i.e. sets the box status to on.
     * @param deviceKey The device key.
     * @param retryCount The number of retries before reporting failure.
     */
    public async powerOnAsync(deviceKey: number, retryCount?: number): Promise<void> {
        this.platform.logger.debug(`[${deviceKey}] Powering box ON via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Sends the HTTP request to set the box status
        try {
            await axios.post(`${this.platform.configuration.apiUri}/boxes/${deviceKey}`, { }, { 
                headers: {
                    token: this.platform.configuration.token
                } 
            });
        } catch (e) {
            this.platform.logger.warn(`[${deviceKey}] Error while powering box ON via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.powerOnAsync(deviceKey, retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Powers the box off, i.e. sets the box status to off.
     * @param deviceKey The device key.
     * @param retryCount The number of retries before reporting failure.
     */
    public async powerOffAsync(deviceKey: number, retryCount?: number): Promise<void> {
        this.platform.logger.debug(`[${deviceKey}] Powering box OFF via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }
        
        // Sends the HTTP request to set the box status
        try {
            await axios.delete(`${this.platform.configuration.apiUri}/boxes/${deviceKey}`, { 
                headers: {
                    token: this.platform.configuration.token
                } 
            });
        } catch (e) {
            this.platform.logger.warn(`[${deviceKey}] Error while powering box OFF via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.powerOffAsync(deviceKey, retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Sets the main intensity of the box on.
     * @param deviceKey The device key.
     * @param intensity The new intensity (ranges from 0 to 100).
     * @param retryCount The number of retries before reporting failure.
     */
    public async setIntensityAsync(deviceKey: number, intensity: number, retryCount?: number): Promise<void> {
        this.platform.logger.debug(`[${deviceKey}] Setting intensity of box to ${intensity} via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Sends the HTTP request to set the box status
        try {
            await axios.post(`${this.platform.configuration.apiUri}/intensity/${deviceKey}`, {
                fan_volume: intensity
            }, { 
                headers: {
                    token: this.platform.configuration.token
                } 
            });
        } catch (e) {
            this.platform.logger.warn(`[${deviceKey}] Error while setting intensity of box to ${intensity} via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.setIntensityAsync(deviceKey, intensity, retryCount);
            } else {
                throw e;
            }
        }
    }
    /**
     * Updates the box settings, i.e. sets the fan speeds for all slots.
     * @param boxUpdate The new settings.
     * @param retryCount The number of retries before reporting failure.
     */
    public async updateAsync(boxUpdate: BoxUpdate, retryCount?: number): Promise<void> {
        this.platform.logger.debug(`[${boxUpdate.device_key}] Updating box slot settings via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Sends the HTTP request to set the box status
        try {
            await axios.post(`${this.platform.configuration.apiUri}/boxes`, boxUpdate, { 
                headers: {
                    token: this.platform.configuration.token
                }
            });
        } catch (e) {
            this.platform.logger.warn(`[${boxUpdate.device_key}] Error while updating box slot settings via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.updateAsync(boxUpdate, retryCount);
            } else {
                throw e;
            }
        }
    }
}
