
import { BoxStatus } from './box-status';
import { Slot } from './slot';

/**
 * Represents the HTTP API model for a single box.
 */
export interface Box {

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
     * Gets or sets all slots of the box.
     */
    settings: Array<Slot>;
}
