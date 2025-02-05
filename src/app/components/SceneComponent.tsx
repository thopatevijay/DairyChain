"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";

const SceneComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Babylon.js Engine
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1); // Black background

    // Add a camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);

    // Add a light source
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 0.7;

    // Add a simple 3D object (a sphere representing milk container)
    const sphere = BABYLON.MeshBuilder.CreateSphere("milkContainer", { diameter: 2 }, scene);
    sphere.position.y = 1;

    // Animation (make the object move slightly up and down)
    const animation = new BABYLON.Animation(
      "bounce",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    animation.setKeys([
      { frame: 0, value: 1 },
      { frame: 30, value: 1.5 },
      { frame: 60, value: 1 },
    ]);

    sphere.animations.push(animation);
    scene.beginAnimation(sphere, 0, 60, true);

    // Render loop
    engine.runRenderLoop(() => scene.render());

    // Resize handling
    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
      window.removeEventListener("resize", () => engine.resize());
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default SceneComponent;
