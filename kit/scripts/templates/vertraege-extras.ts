export interface TrainingPackageItem {
    trainingId: string;
    title: string;
    format: Training['format'];
    ratePerParticipantEUR: number;
    volumeEUR: number;
}
export interface TrainingPackage {
    participants: number;
    termYears: number;
    items: TrainingPackageItem[];
    totalEUR: number;
}
export type RatingDimension = 'Delivery time' | 'Quality' | 'Submission channel';
export interface PilotRating {
    iso: string;
    stars: 4 | 5;
    dimension: RatingDimension;
    quote: string;
    translation?: string;
}
