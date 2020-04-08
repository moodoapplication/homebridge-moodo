
import { HomebridgePlatform } from 'homebridge-framework';
import { Configuration } from './configuration/configuration';
import { MoodoController } from './controllers/moodo-controller';
import { MoodoApiClient } from './clients/moodo-api-client';
import { MoodoSocketClient } from './clients/moodo-socket-client';
import { Box } from './clients/models/box';

/**
 * Represents the platform of the plugin.
 */
export class Platform extends HomebridgePlatform<Configuration> {

    /**
     * Gets or sets the list of all controllers that represent physical Moodo devices in HomeKit.
     */
    public controllers = new Array<MoodoController>();

    /**
     * Gets the name of the plugin.
     */
    public get pluginName(): string {
        return 'homebridge-moodo';
    }    
    
    /**
     * Gets the name of the platform which is used in the configuration file.
     */
    public get platformName(): string {
        return 'MoodoPlatform';
    }

    /**
     * Contains the client that is used to communicate via HTTP API.
     */
    private _apiClient: MoodoApiClient|null = null;

    /**
     * Gets the client that is used to communicate via HTTP API.
     */
    public get apiClient(): MoodoApiClient {
        if (!this._apiClient) {
            throw new Error('Platform not initialized yet.');
        }
        return this._apiClient;
    }

    /**
     * Contains the client that is used to communicate via socket.io.
     */
    private _socketClient: MoodoSocketClient|null = null;

    /**
     * Gets the client that is used to communicate via socket.io.
     */
    public get socketClient(): MoodoSocketClient {
        if (!this._socketClient) {
            throw new Error('Platform not initialized yet.');
        }
        return this._socketClient;
    }

    /**
     * Starts the background updates of the devices.
     */
    private async initializeUpdatesAsync() {
        try {
            this.logger.debug(`Get devices from the API...`);

            // Gets the box information from the API
            const boxes = await this.apiClient.getBoxesAsync();

            // Updates the devices
            for (let controller of this.controllers) {
                const box = boxes.find(b => b.device_key == controller.id);
                if (box) {
                    controller.update(box);
                }
            }

            // Subscribes for updates via socket client
            this.socketClient.on('update', (box: Box) => {
                for (let controller of this.controllers) {
                    if (box.device_key == controller.id) {
                        controller.update(box);
                    }
                }
            });

            // Starts the connection of the socket client
            this.socketClient.connect();
        } catch (e) {
            this.logger.warn(`Failed to get devices from API and start background updates`);
        }
    }

    /**
     * Is called when the platform is initialized.
     */
    public initialize() {
        this.logger.info(`Initialing platform...`);

        // Initializes the configuration
        this.configuration.apiUri = 'https://rest.moodo.co/api';
        this.configuration.maximumApiRetry = 3;
        this.configuration.apiRetryInterval = 2000;
        this.configuration.socketIoUri = 'https://ws.moodo.co:9090';

        // Initializes the clients
        this._apiClient = new MoodoApiClient(this);
        this._socketClient = new MoodoSocketClient(this);

        // Cycles over all configured devices and creates the corresponding controllers
        if (this.configuration.devices) {
            for (let deviceConfiguration of this.configuration.devices) {
                if (deviceConfiguration.id && deviceConfiguration.name) {

                    // Creates the new controller for the device and stores it
                    const moodoController = new MoodoController(this, deviceConfiguration);
                    this.controllers.push(moodoController);
                } else {
                    this.logger.warn(`Device ID or name missing in the configuration.`);
                }
            }
        } else {
            this.logger.warn(`No devices configured.`);
        }

        // Initializes the background updates
        this.initializeUpdatesAsync();
    }

    /**
     * Is called when homebridge is shut down.
     */
    public destroy() {
        this.logger.info(`Shutting down connections...`);
        this.socketClient.disconnect();
    }
}
