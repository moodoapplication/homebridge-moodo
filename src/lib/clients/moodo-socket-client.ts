
import io from 'socket.io-client';

import { Platform } from '../platform';
import { EventEmitter } from 'events';
import { Box } from './models/box';

/**
 * Represents a socket.io client for a Moodo account.
 */
export class MoodoSocketClient extends EventEmitter {

    /**
     * Initializes a new MoodoSocketClient instance.
     * @param platform The platform of the plugin.
     */
    constructor(private platform: Platform) {
        super();
    }

    /**
     * Contains the active socket.
     */
    private socket: SocketIOClient.Socket|null = null;

    /**
     * Closes the socket connection.
     */
    public connect() {

        // Initializes the connection
        this.socket = io.connect(this.platform.configuration.socketIoUri, { reconnection: true });

        // Subscribes to a successful connection so that the authentication can be done
        this.socket.on('connect', async () => {
            this.platform.logger.debug('Socket.io connection established.');

            // Waits before sending the authentication
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Sends the authentication
            this.socket?.emit('authenticate', this.platform.configuration.token);

            // Waits before sending the subscription
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Sends the subscription
            this.socket?.emit('subscribe', 'homebridge');
        });

        // Subscribes to changes
        this.socket.on('ws_event', (eventData: { data: Box }) => {
            if (!eventData || !eventData.data) {
                return;
            }

            // Emits the update event
            this.platform.logger.debug('Socket.io update received.');
            this.emit('update', eventData.data);
        });
    }

    /**
     * Closes the socket connection.
     */
    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
