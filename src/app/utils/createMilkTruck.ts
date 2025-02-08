import * as BABYLON from '@babylonjs/core';

// Create IoT-enabled milk transport truck
export const createMilkTruck = (scene: BABYLON.Scene, position: BABYLON.Vector3) => {
    // Create parent mesh for the truck
    const truck = new BABYLON.Mesh("truck", scene);

    // Truck cabin
    const cabin = BABYLON.MeshBuilder.CreateBox(
        "cabin",
        { width: 1.2, height: 1.2, depth: 1 },
        scene
    );
    cabin.position = new BABYLON.Vector3(0, 0.6, 0);
    cabin.parent = truck;

    // Truck hood (engine compartment)
    const hood = BABYLON.MeshBuilder.CreateBox(
        "hood",
        { width: 0.8, height: 0.6, depth: 1 },
        scene
    );
    hood.position = new BABYLON.Vector3(1, 0.3, 0);
    hood.parent = truck;

    // Milk tank
    const tank = BABYLON.MeshBuilder.CreateCylinder(
        "tank",
        { height: 2.5, diameter: 1 },
        scene
    );
    tank.position = new BABYLON.Vector3(-1, 0.8, 0);
    tank.rotation.z = Math.PI / 2;
    tank.parent = truck;

    // Wheels
    const createWheel = (x: number, z: number) => {
        const wheel = BABYLON.MeshBuilder.CreateCylinder(
            `wheel_${x}_${z}`,
            { height: 0.2, diameter: 0.4 },
            scene
        );
        wheel.rotation.x = Math.PI / 2;
        wheel.position = new BABYLON.Vector3(x, 0.2, z);
        wheel.parent = truck;
        return wheel;
    };

    // Create 6 wheels (3 on each side)
    createWheel(0.8, 0.6);  // Front right
    createWheel(0.8, -0.6); // Front left
    createWheel(-0.8, 0.6);  // Back right
    createWheel(-0.8, -0.6); // Back left
    createWheel(-1.4, 0.6);  // Far back right
    createWheel(-1.4, -0.6); // Far back left

    // Materials
    const cabinMaterial = new BABYLON.StandardMaterial("cabinMaterial", scene);
    cabinMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
    cabin.material = cabinMaterial;
    hood.material = cabinMaterial;

    const tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    tankMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    tank.material = tankMaterial;

    const wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", scene);
    wheelMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    truck.getChildMeshes()
        .filter(mesh => mesh.name.startsWith('wheel'))
        .forEach(wheel => wheel.material = wheelMaterial);

    // Position the entire truck
    truck.position = new BABYLON.Vector3(position.x - 3, position.y, position.z);

    return truck;
};