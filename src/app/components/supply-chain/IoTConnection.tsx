import * as BABYLON from '@babylonjs/core';

interface IoTConnectionProps {
    scene: BABYLON.Scene;
    start: BABYLON.Vector3;
    end: BABYLON.Vector3;
}

export const IoTConnection = ({ scene, start, end }: IoTConnectionProps) => {
    // Create straight line using points
    const points = [start, end];
    const lines = BABYLON.MeshBuilder.CreateTube("tube", {
        path: points,
        radius: 0.05,
        updatable: true
    }, scene);

    // lines.material = new BABYLON.StandardMaterial("tubeMaterial", scene);
    // (lines.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    // lines.material.alpha = 0.6;

    return lines;
}; 