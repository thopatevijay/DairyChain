import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export const createProcessingPlant = (scene: Scene, position: Vector3) => {
    // Main building
    const building = MeshBuilder.CreateBox("processingPlant", {
        height: 8,
        width: 12,
        depth: 10
    }, scene);
    building.position = position;

    // Roof
    const roof = MeshBuilder.CreateCylinder("roof", {
        height: 2,
        diameter: 12,
        tessellation: 4
    }, scene);
    roof.position = new Vector3(position.x, position.y + 5, position.z);
    roof.rotation.z = Math.PI / 4;

    // Storage tanks
    const createTank = (offsetX: number) => {
        const tank = MeshBuilder.CreateCylinder("tank", {
            height: 6,
            diameter: 3,
            tessellation: 20
        }, scene);
        tank.position = new Vector3(position.x + offsetX, position.y + 1, position.z + 7);
    };

    // Create 3 tanks
    [-4, 0, 4].forEach(offset => createTank(offset));

    // Materials
    const buildingMaterial = new StandardMaterial("buildingMaterial", scene);
    buildingMaterial.diffuseColor = new Color3(0.2, 0.4, 0.6);
    building.material = buildingMaterial;

    const roofMaterial = new StandardMaterial("roofMaterial", scene);
    roofMaterial.diffuseColor = new Color3(0.3, 0.5, 0.7);
    roof.material = roofMaterial;

    return { building, roof };
};