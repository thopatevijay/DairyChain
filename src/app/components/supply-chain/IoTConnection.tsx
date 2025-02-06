import * as BABYLON from '@babylonjs/core';

interface IoTConnectionProps {
    scene: BABYLON.Scene;
    start: BABYLON.Vector3;
    end: BABYLON.Vector3;
}

export const IoTConnection = ({ scene, start, end }: IoTConnectionProps) => {
    // Create connection line
    const lines = BABYLON.MeshBuilder.CreateLines(
        "iotConnection",
        {
            points: [
                start,
                new BABYLON.Vector3(
                    (start.x + end.x) / 2,
                    start.y + 2,
                    (start.z + end.z) / 2
                ),
                end
            ]
        },
        scene
    );

    // Create particle system for data flow visualization
    const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVChTY/jPwABFI2EGBiRMNwVD2QwA+8kEZKQwO7QAAAAASUVORK5CYII="
    );

    // Set particle system properties
    particleSystem.emitter = start;
    particleSystem.minEmitBox = start;
    particleSystem.maxEmitBox = end;

    // Particle colors
    particleSystem.color1 = new BABYLON.Color4(0.2, 0.8, 0.2, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.3, 0.9, 0.3, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

    // Particle size
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    // Particle lifetime
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 2;

    // Emission rate
    particleSystem.emitRate = 50;

    // Blend mode
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    // Gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);

    // Direction
    particleSystem.direction1 = end.subtract(start).normalize();
    particleSystem.direction2 = end.subtract(start).normalize();

    // Start the particle system
    particleSystem.start();

    return {
        lines,
        particleSystem
    };
}; 