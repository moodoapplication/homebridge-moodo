
import { Box } from './box';

/**
 * Represents the HTTP API model for a response with a single box.
 */
export interface BoxResponse {

    /**
     * Gets or sets the requested box.
     */
    box: Box;
}
