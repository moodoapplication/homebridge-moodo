
/**
 * Represents the HTTP API model for a single capsule slot update.
 */
export interface SlotUpdate {

    /**
     * Gets or sets the fan intensity. Ranges from 0 to 100.
     */
    fan_speed: number;

    /**
     * Gets or sets a value that determines whether the fan is active.
     */
    fan_active: boolean;
}
