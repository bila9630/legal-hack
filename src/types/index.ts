export enum AvailabilityStatus {
    AVAILABLE = 'available',
    PARTIALLY_AVAILABLE = 'partially available',
    UNAVAILABLE = 'unavailable'
}

// enum to use in interfaces
export type AvailabilityStatusType = `${AvailabilityStatus}` 