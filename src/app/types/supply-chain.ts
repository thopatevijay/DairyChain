export interface MilkData {
  farmerId: number;
  quantity: number;
  quality: number;
  status: 'ACCEPTED' | 'REJECTED';
  timestamp: string;
  summary?: {
    totalQuantity: number;
    farmerCount?: number;
    averageQuality?: number;
    bottleCount?: number;
    processStats?: {
      trucksReceived: number;
      acceptedTrucks: number;
      rejectedTrucks: number;
      avgQuality: number;
      processingStartTime: string;
      processingEndTime: string;
      productionStartTime: string;
      productionEndTime: string;
      bottlesPacked: number;
      finalQuality: number;
      isDispatched: boolean;
    };
  };
}

export interface SceneConfig {
  camera: {
    alpha: number;
    beta: number;
    radius: number;
    lowerRadiusLimit: number;
    upperRadiusLimit: number;
  };
  lights: {
    hemispheric: {
      intensity: number;
    };
    point: {
      intensity: number;
      position: {
        x: number;
        y: number;
        z: number;
      };
    };
  };
  animation: {
    frameRate: number;
    loopMode: number;
  };
}

export interface MaterialColors {
  r: number;
  g: number;
  b: number;
} 