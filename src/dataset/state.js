export type ProcessingStateType = 'EMPTY' | 'OPENING' | 'TRIANGULATING' | 'GENERATING_DEM' | 'IDLE' | 'ERROR';

let ProcessingState = {
    OPENING: 'OPENING',
    TRIANGULATING: 'TRIANGULATING',
    GENERATING_DEM: 'GENERATING_DEM',
    IDLE: 'IDLE',
    ERROR: 'ERROR'
};

export {ProcessingState};

export type DatasetStateType = {
    processingState : ProcessingStateType,
    demAvailable : boolean
}

export default ProcessingState;