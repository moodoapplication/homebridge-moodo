
import { BoxStatus } from './box-status';
import { SlotUpdate } from './slot-update';

/**
 * Represents the HTTP API model for a single box update.
 */
export interface BoxUpdate {

    /**
     * Gets or sets the numeric device key.
     */
    device_key: number;

    /**
     * Gets or sets the fan intensity. Ranges from 0 to 100.
     */
    fan_volume: number;

    /**
     * Gets or sets the current status of the box.
     */
    box_status: BoxStatus;

    /**
     * Gets or sets a slot update of the box.
     */
    settings_slot0: SlotUpdate;

    /**
     * Gets or sets a slot update of the box.
     */
    settings_slot1: SlotUpdate;

    /**
     * Gets or sets a slot update of the box.
     */
    settings_slot2: SlotUpdate;

    /**
     * Gets or sets a slot update of the box.
     */
    settings_slot3: SlotUpdate;

    /**
     * Gets or sets a unique ID that is used to sort out updates from the socket that have been initiated by the plugin.
     */
    restful_request_id: string;
}
