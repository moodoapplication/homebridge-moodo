
import { CapsuleInfo } from './capsule-info';

/**
 * Represents the HTTP API model for a single capsule slot.
 */
export interface Slot {

    /**
     * Gets or sets the numeric ID of the slot.
     */
    slot_id: number;

    /**
     * Gets or sets some information about the capsule.
     */
    capsule_info: CapsuleInfo|null;

    /**
     * Gets or sets the fan intensity. Ranges from 0 to 100.
     */
    fan_speed: number;

    /**
     * Gets or sets a value that determines whether the fan is active.
     */
    fan_active: boolean;
}
