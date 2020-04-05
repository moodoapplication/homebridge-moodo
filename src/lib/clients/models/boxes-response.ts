
import { Box } from './box';

/**
 * Represents the HTTP API model for a response with an array of boxes.
 */
export interface BoxesResponse {

    /**
     * Gets or sets the requested boxes.
     */
    boxes: Array<Box>;
}
