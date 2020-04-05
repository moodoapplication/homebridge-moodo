
import { Platform } from '../platform';
import { DeviceConfiguration } from '../configuration/device-configuration';
import { Homebridge, Characteristic, Service } from 'homebridge-framework';
import { Formats, Perms } from 'hap-nodejs';
import { Box } from '../clients/models/box';
import { BoxStatus } from '../clients/models/box-status';
import { BoxUpdate } from '../clients/models/box-update';

/**
 * Represents a controller for a Moodo device. Controllers represent physical devices in HomeKit.
 */
export class MoodoController {

    /**
     * Initializes a new MoodoController instance.
     * @param platform The plugin platform.
     * @param deviceConfiguration The configuration of the Moodo device that is represented by this controller.
     */
    constructor(platform: Platform, private deviceConfiguration: DeviceConfiguration) {
        platform.logger.info(`[${deviceConfiguration.id}] Initializing...`);

        // Sets the ID
        this.id = deviceConfiguration.id;

        // Creates the accessory
        const mainAccessory = platform.useAccessory(deviceConfiguration.name, deviceConfiguration.id.toString(), 'main');
        mainAccessory.setInformation({
            manufacturer: 'Agan Aroma & Fine Chemicals Ltd.',
            model: 'Moodo',
            serialNumber: deviceConfiguration.id.toString(),
            firmwareRevision: null,
            hardwareRevision: null
        });

        // Creates the main service for the device
        platform.logger.info(`[${deviceConfiguration.id}] Adding main device`);
        let mainService: Service;
        if (deviceConfiguration.type === 'purifier') {
            mainService = mainAccessory.useService(Homebridge.Services.AirPurifier, deviceConfiguration.name, 'main-air-purifier');
        } else {
            mainService = mainAccessory.useService(Homebridge.Services.Fanv2, deviceConfiguration.name, 'main-fan');
        }

        // Adds the characteristics for the service
        this.mainActiveCharacteristic = mainService.useCharacteristic<boolean>(Homebridge.Characteristics.Active);
        this.mainActiveCharacteristic.valueChanged = newValue => {
            platform.logger.info(`[${deviceConfiguration.id}] Change device status to ${newValue}`);
            try {
                if (newValue) {
                    platform.apiClient.powerOnAsync(deviceConfiguration.id);
                } else {
                    platform.apiClient.powerOffAsync(deviceConfiguration.id);
                }
            } catch (e) {
                platform.logger.warn(`[${deviceConfiguration.id}] failed to change device status to ${newValue}`);
            }
        };

        // Adds the required characteristics for the air purifier
        if (deviceConfiguration.type === 'purifier') {
            
            // Adds the current state, which may be off or on
            this.mainCurrentStateCharacteristic = mainService.useCharacteristic<number>(Homebridge.Characteristics.CurrentAirPurifierState);
            this.mainCurrentStateCharacteristic.setProperties({
                format: Formats.UINT8,
                validValues: [0, 2],
                perms: [Perms.READ, Perms.NOTIFY]
            });

            // Adds the target state, which are always set to manual
            const mainTargetStateCharacteristic = mainService.useCharacteristic<number>(Homebridge.Characteristics.TargetAirPurifierState);
            mainTargetStateCharacteristic.setProperties({
                format: Formats.UINT8,
                minValue: 0,
                maxValue: 0,
                validValues: [0],
                perms: [Perms.READ, Perms.WRITE, Perms.NOTIFY]
            });
        }

        // Adds the rotation speed characteristic that is used for intensity
        this.mainRotationSpeedCharacteristic = mainService.useCharacteristic<number>(Homebridge.Characteristics.RotationSpeed);
        this.mainRotationSpeedCharacteristic.valueChanged = newValue => {
            platform.logger.info(`[${deviceConfiguration.id}] Change device intensity to ${newValue}`);
            try {
                if (newValue == 0) {
                    platform.apiClient.powerOffAsync(deviceConfiguration.id);
                } else {
                    platform.apiClient.setIntensityAsync(deviceConfiguration.id, newValue);
                }
            } catch (e) {
                platform.logger.warn(`[${deviceConfiguration.id}] failed to change device intensity to ${newValue}`);
            }
        };

        // Creates the accessory for the capsules
        if (deviceConfiguration.showCapsules) {
            const slotsAccessory = platform.useAccessory(`${deviceConfiguration.name} Capsules`, deviceConfiguration.id.toString(), 'slots');
            slotsAccessory.setInformation({
                manufacturer: 'Agan Aroma & Fine Chemicals Ltd.',
                model: 'Moodo',
                serialNumber: deviceConfiguration.id.toString(),
                firmwareRevision: null,
                hardwareRevision: null
            });

            // Initializes the characteristics
            this.slotActiveCharacteristics = new Array<Characteristic<boolean>>();
            if (deviceConfiguration.type === 'purifier') {
                this.slotCurrentStateCharacteristics = new Array<Characteristic<number>>();
            }
            this.slotRotationSpeedCharacteristics = new Array<Characteristic<number>>();
            for (let i = 0; i < 4; i++) {

                // Creates the main service for the device
                platform.logger.info(`[${deviceConfiguration.id}] Adding capsule ${(i + 1)}`);
                let slotService: Service;
                if (deviceConfiguration.type === 'purifier') {
                    slotService = slotsAccessory.useService(Homebridge.Services.AirPurifier, `Capsule ${(i + 1)}`, `capsule-${i}-air-purifier`);
                } else {
                    slotService = slotsAccessory.useService(Homebridge.Services.Fanv2, `Capsule ${(i + 1)}`, `capsule-${i}-fan`);
                }
                slotService.useCharacteristic<number>(Homebridge.Characteristics.ServiceLabelIndex, i + 1);

                // Adds the characteristics for the service
                const slotActiveCharacteristic = slotService.useCharacteristic<boolean>(Homebridge.Characteristics.Active);
                slotActiveCharacteristic.valueChanged = newValue => {
                    platform.logger.info(`[${deviceConfiguration.id}] Change capsule ${(i + 1)} status to ${newValue}`);
                    try {
                        platform.apiClient.updateAsync(this.getBoxUpdateForActive(i, newValue ? true : false));
                    } catch (e) {
                        platform.logger.warn(`[${deviceConfiguration.id}] failed to change capsule ${(i + 1)} status to ${newValue}`);
                    }
                };
                this.slotActiveCharacteristics.push(slotActiveCharacteristic);

                // Adds the required characteristics for the air purifier
                if (deviceConfiguration.type === 'purifier') {
                    
                    // Adds the current state, which may be off or on
                    const slotCurrentStateCharacteristic = slotService.useCharacteristic<number>(Homebridge.Characteristics.CurrentAirPurifierState);
                    slotCurrentStateCharacteristic.setProperties({
                        format: Formats.UINT8,
                        validValues: [0, 2],
                        perms: [Perms.READ, Perms.NOTIFY]
                    });
                    this.slotCurrentStateCharacteristics!.push(slotCurrentStateCharacteristic);

                    // Adds the target state, which are always set to manual
                    const slotTargetStateCharacteristic = slotService.useCharacteristic<number>(Homebridge.Characteristics.TargetAirPurifierState);
                    slotTargetStateCharacteristic.setProperties({
                        format: Formats.UINT8,
                        minValue: 0,
                        maxValue: 0,
                        validValues: [0],
                        perms: [Perms.READ, Perms.WRITE, Perms.NOTIFY]
                    });
                }

                // Adds the rotation speed characteristic that is used for intensity
                const slotRotationSpeedCharacteristic = slotService.useCharacteristic<number>(Homebridge.Characteristics.RotationSpeed);
                slotRotationSpeedCharacteristic.valueChanged = newValue => {
                    platform.logger.info(`[${deviceConfiguration.id}] Change capsule ${(i + 1)} intensity to ${newValue}`);
                    try {
                        if (newValue == 0) {
                            platform.apiClient.updateAsync(this.getBoxUpdateForActive(i, false));
                        } else {
                            platform.apiClient.updateAsync(this.getBoxUpdateForSpeed(i, newValue));
                        }
                    } catch (e) {
                        platform.logger.warn(`[${deviceConfiguration.id}] failed to change capsule ${(i + 1)} intensity to ${newValue}`);
                    }
                };
                this.slotRotationSpeedCharacteristics.push(slotRotationSpeedCharacteristic);
            }
        }
    }

    /**
     * Contains the active characteristic of the device.
     */
    private mainActiveCharacteristic: Characteristic<boolean>;

    /**
     * Contains the current state characteristic of the device.
     */
    private mainCurrentStateCharacteristic: Characteristic<number>|null = null;

    /**
     * Contains the rotation speed characteristic of the device.
     */
    private mainRotationSpeedCharacteristic: Characteristic<number>;

    /**
     * Contains the active characteristic of the device.
     */
    private slotActiveCharacteristics: Array<Characteristic<boolean>>|null = null;

    /**
     * Contains the current state characteristic of the device.
     */
    private slotCurrentStateCharacteristics: Array<Characteristic<number>>|null = null;

    /**
     * Contains the rotation speed characteristic of the device.
     */
    private slotRotationSpeedCharacteristics: Array<Characteristic<number>>|null = null;

    /**
     * Gets or sets the ID of the device.
     */
    public id: number;

    /**
     * Creates a new BoxUpdate model from the current state of the device and updates a single slot.
     * @param slotId The number of the slot.
     * @param active Determines whether the slot should be set to active.
     * @returns Returns a BoxUpdate model that can be sent to the API.
     */
    private getBoxUpdateForActive(slotId: number, active: boolean): BoxUpdate {
        return {
            device_key: this.deviceConfiguration.id,
            box_status: this.mainActiveCharacteristic.value ? BoxStatus.On : BoxStatus.Off,
            fan_volume: this.mainRotationSpeedCharacteristic.value || 0,
            settings_slot0: {
                fan_active: slotId == 0 ? active : (this.slotActiveCharacteristics![0].value ? true : false),
                fan_speed: this.slotRotationSpeedCharacteristics![0].value || 0
            },
            settings_slot1: {
                fan_active: slotId == 1 ? active : (this.slotActiveCharacteristics![1].value ? true : false),
                fan_speed: this.slotRotationSpeedCharacteristics![1].value || 0
            },
            settings_slot2: {
                fan_active: slotId == 2 ? active : (this.slotActiveCharacteristics![2].value ? true : false),
                fan_speed: this.slotRotationSpeedCharacteristics![2].value || 0
            },
            settings_slot3: {
                fan_active: slotId == 3 ? active : (this.slotActiveCharacteristics![3].value ? true : false),
                fan_speed: this.slotRotationSpeedCharacteristics![3].value || 0
            }
        };
    }

    /**
     * Creates a new BoxUpdate model from the current state of the device and updates a single slot.
     * @param slotId The number of the slot.
     * @param speed The new speed.
     * @returns Returns a BoxUpdate model that can be sent to the API.
     */
    private getBoxUpdateForSpeed(slotId: number, speed: number): BoxUpdate {
        return {
            device_key: this.deviceConfiguration.id,
            box_status: this.mainActiveCharacteristic.value ? BoxStatus.On : BoxStatus.Off,
            fan_volume: this.mainRotationSpeedCharacteristic.value || 0,
            settings_slot0: {
                fan_active: (this.slotActiveCharacteristics![0].value ? true : false),
                fan_speed: slotId == 0 ? speed : this.slotRotationSpeedCharacteristics![0].value || 0
            },
            settings_slot1: {
                fan_active: (this.slotActiveCharacteristics![1].value ? true : false),
                fan_speed: slotId == 1 ? speed : this.slotRotationSpeedCharacteristics![1].value || 0
            },
            settings_slot2: {
                fan_active: (this.slotActiveCharacteristics![2].value ? true : false),
                fan_speed: slotId == 2 ? speed : this.slotRotationSpeedCharacteristics![2].value || 0
            },
            settings_slot3: {
                fan_active: (this.slotActiveCharacteristics![3].value ? true : false),
                fan_speed: slotId == 3 ? speed : this.slotRotationSpeedCharacteristics![3].value || 0
            }
        };
    }

    /**
     * Updates the state of the device.
     * @param box The box information.
     */
    public update(box: Box) {

        // Updates the characteristics
        this.mainActiveCharacteristic.value = box.box_status == BoxStatus.On;
        this.mainRotationSpeedCharacteristic.value = box.fan_volume;

        // Updates the air purifier characteristics
        if (this.mainCurrentStateCharacteristic) {
            this.mainCurrentStateCharacteristic.value = box.box_status == BoxStatus.On ? 2 : 0;
        }

        // Updates the slots
        for (let slot of box.settings) {

            // Updates the characteristics
            if (this.slotActiveCharacteristics) {
                this.slotActiveCharacteristics[slot.slot_id].value = slot.fan_active;
            }
            if (this.slotRotationSpeedCharacteristics) {
                this.slotRotationSpeedCharacteristics[slot.slot_id].value = slot.fan_speed;
            }

            // Updates the air purifier characteristics
            if (this.slotCurrentStateCharacteristics) {
                this.slotCurrentStateCharacteristics[slot.slot_id].value = slot.fan_active ? 2 : 0;
            }
        }
    }
}
