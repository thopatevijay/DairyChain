export interface MilkData {
  farmerId: number;
  quantity: number;
  quality: number;
  status: 'ACCEPTED' | 'REJECTED';
  timestamp: string;
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