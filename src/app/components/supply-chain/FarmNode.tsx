import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface FarmNodeProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    index: number;
    onInspection: (data: MilkData) => void;
}

export const FarmNode = ({ scene, position, index, onInspection }: FarmNodeProps) => {
    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    const farm = BABYLON.MeshBuilder.CreateBox(
        `farm${index}`,
        { width: 1.5, height: 1.5, depth: 1.5 },
        scene
    );
    farm.position = position;
    farm.material = blueMaterial;

    createLabel(`Farmer ${index + 1}`, position, scene);
    createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z), scene, onInspection);

    return farm;
}; 