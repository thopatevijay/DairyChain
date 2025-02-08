import * as BABYLON from '@babylonjs/core';


export const transportMilk = (
    truck: BABYLON.Mesh,
    position: BABYLON.Vector3,
    processingPlantPosition: BABYLON.Vector3,
    scene: BABYLON.Scene,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any,
) => {
    truck.setEnabled(true);
    const frameRate = 30;
    const animationDuration = 120;

    // Create straight path animation
    const animation = new BABYLON.Animation(
        "truckDelivery",
        "position",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Calculate direct path
    const startPos = truck.position.clone();
    const endPos = new BABYLON.Vector3(processingPlantPosition.x - 3, position.y, position.z);

    const keys = [
        { frame: 0, value: startPos },
        { frame: animationDuration, value: endPos }
    ];
    animation.setKeys(keys);

    // Single rotation at start to face direction of travel
    const rotationAnimation = new BABYLON.Animation(
        "truckRotation",
        "rotation.y",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const rotationKeys = [
        { frame: 0, value: 0 },
        { frame: 5, value: 0 } // Keep truck straight
    ];
    rotationAnimation.setKeys(rotationKeys);

    truck.animations = [animation, rotationAnimation];

    scene.beginAnimation(truck, 0, animationDuration, false, 1, () => {
        truck.setEnabled(false);
        truck.position = startPos;
        truck.rotation.y = 0;

        // Trigger next step
        console.log("metadata", metadata)
        scene.metadata = {
            ...scene.metadata,
            ...metadata
        };
    });
};