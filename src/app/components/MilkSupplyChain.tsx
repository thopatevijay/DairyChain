// components/MilkSupplyChain.tsx
import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface MilkData {
  farmerId: number;
  quantity: number;
  quality: number;
  status: 'ACCEPTED' | 'REJECTED';
}

const MilkSupplyChain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [milkInspectionData, setMilkInspectionData] = useState<MilkData | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    // Camera setup
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      40,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 15;
    camera.upperRadiusLimit = 60;

    // Lighting
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1;
    // Add point lights for better visibility
    const pointLight = new BABYLON.PointLight(
      "pointLight",
      new BABYLON.Vector3(0, 10, 0),
      scene
    );
    pointLight.intensity = 0.5;

    // Materials
    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
    
    const iotActiveMaterial = new BABYLON.StandardMaterial("iotActive", scene);
    iotActiveMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    
    const robotMaterial = new BABYLON.StandardMaterial("robotMaterial", scene);
    robotMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);

    // Helper function to create larger text label
    const createLabel = (text: string, position: BABYLON.Vector3) => {
      const plane = BABYLON.MeshBuilder.CreatePlane(
        "label",
        { width: 4, height: 1 },
        scene
      );
      plane.position = new BABYLON.Vector3(
        position.x,
        position.y + 3,
        position.z
      );
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

      const dynamicTexture = new BABYLON.DynamicTexture(
        "labelTexture",
        { width: 1024, height: 256 },
        scene
      );
      const labelMaterial = new BABYLON.StandardMaterial("labelMaterial", scene);
      labelMaterial.diffuseTexture = dynamicTexture;
      labelMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      labelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      plane.material = labelMaterial;

      // Draw text with larger size and bold font
      dynamicTexture.drawText(
        text,
        null,
        180,
        "bold 72px Arial",
        "white",
        "#00000088",
        true
      );
    };

    // Enhanced createRobot function
    const createRobot = (position: BABYLON.Vector3) => {
      // Robot body
      const body = BABYLON.MeshBuilder.CreateBox(
        "robotBody",
        { height: 1.5, width: 1, depth: 0.7 },
        scene
      );
      body.position = new BABYLON.Vector3(position.x, position.y + 0.75, position.z);
      body.material = robotMaterial;

      // Robot head
      const head = BABYLON.MeshBuilder.CreateSphere(
        "robotHead",
        { diameter: 0.5 },
        scene
      );
      head.position = new BABYLON.Vector3(position.x, position.y + 1.75, position.z);
      head.material = robotMaterial;

      // Robot eyes
      const createEye = (offset: number) => {
        const eye = BABYLON.MeshBuilder.CreateSphere(
          "robotEye",
          { diameter: 0.1 },
          scene
        );
        eye.position = new BABYLON.Vector3(
          position.x + offset,
          position.y + 1.8,
          position.z + 0.2
        );
        eye.material = new BABYLON.StandardMaterial("eyeMaterial", scene);
        (eye.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0, 1, 1);
        return eye;
      };

      createEye(-0.1);
      createEye(0.1);

      // Robot arms
      const createArm = (offset: number) => {
        const arm = BABYLON.MeshBuilder.CreateCylinder(
          "robotArm",
          { height: 1, diameter: 0.1 },
          scene
        );
        arm.position = new BABYLON.Vector3(
          position.x + offset,
          position.y + 1,
          position.z
        );
        arm.material = robotMaterial;
        return arm;
      };

      createArm(0.6);
      createArm(-0.6);

      // Add animation
      const animationGroup = new BABYLON.AnimationGroup("robotAnimation");
      
      // Body movement animation
      const bodyAnimation = new BABYLON.Animation(
        "bodyAnimation",
        "position.y",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keyFrames = [];
      keyFrames.push({ frame: 0, value: position.y + 0.75 });
      keyFrames.push({ frame: 30, value: position.y + 1.0 });
      keyFrames.push({ frame: 60, value: position.y + 0.75 });
      bodyAnimation.setKeys(keyFrames);
      
      animationGroup.addTargetedAnimation(bodyAnimation, body);
      animationGroup.play(true);

      // Add interaction
      body.isPickable = true;
      body.actionManager = new BABYLON.ActionManager(scene);
      body.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            // Simulate milk inspection
            const milkData: MilkData = {
              farmerId: Math.floor(Math.random() * 3) + 1,
              quantity: Math.floor(Math.random() * 30) + 10,
              quality: Math.floor(Math.random() * 5) + 25,
              status: Math.random() > 0.2 ? 'ACCEPTED' : 'REJECTED'
            };
            setMilkInspectionData(milkData);
            
            // Visual feedback
            const pulseAnimation = new BABYLON.Animation(
              "pulse",
              "scaling",
              30,
              BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
              BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const pulseKeys = [];
            pulseKeys.push({ frame: 0, value: new BABYLON.Vector3(1, 1, 1) });
            pulseKeys.push({ frame: 15, value: new BABYLON.Vector3(1.2, 1.2, 1.2) });
            pulseKeys.push({ frame: 30, value: new BABYLON.Vector3(1, 1, 1) });
            
            pulseAnimation.setKeys(pulseKeys);
            body.animations = [pulseAnimation];
            scene.beginAnimation(body, 0, 30, false);
          }
        )
      );

      return body;
    };

    // Create farm nodes with robot
    const createFarm = (position: BABYLON.Vector3, index: number) => {
      const farm = BABYLON.MeshBuilder.CreateBox(
        `farm${index}`,
        { width: 1.5, height: 1.5, depth: 1.5 },
        scene
      );
      farm.position = position;
      farm.material = blueMaterial;
      createLabel(`Farmer ${index + 1}`, position);
      createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z));
      return farm;
    };

    // Create IoT-enabled storage tank with robot
    const createIoTStorageTank = (position: BABYLON.Vector3, label: string) => {
      const tank = BABYLON.MeshBuilder.CreateCylinder(
        "tank",
        { height: 3, diameter: 1.5 },
        scene
      );
      tank.position = position;
      tank.material = iotActiveMaterial;
      createLabel(label, position);
      createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z));
      return tank;
    };

    // Create processing plant with robot
    const createProcessingPlant = (position: BABYLON.Vector3) => {
      const building = BABYLON.MeshBuilder.CreateBox(
        "plant",
        { width: 6, height: 4, depth: 6 },
        scene
      );
      building.position = position;
      building.material = blueMaterial;
      createLabel("Processing Plant", position);
      createRobot(new BABYLON.Vector3(position.x - 4, position.y, position.z));
      return building;
    };

    // Create supply chain elements (simplified)
    const farms = [
      createFarm(new BABYLON.Vector3(-20, 0, -6), 0),
      createFarm(new BABYLON.Vector3(-20, 0, 0), 1),
      createFarm(new BABYLON.Vector3(-20, 0, 6), 2),
    ];

    const collectionPoints = [
      createIoTStorageTank(new BABYLON.Vector3(-12, 0, 0), "Collection Point"),
    ];

    const processingPlant = createProcessingPlant(new BABYLON.Vector3(0, 0, 0));

    // Single distributor with robot
    const distributor = BABYLON.MeshBuilder.CreateBox(
      "distributor",
      { width: 2, height: 2, depth: 2 },
      scene
    );
    distributor.position = new BABYLON.Vector3(8, 0, 0);
    distributor.material = blueMaterial;
    createLabel("Distributor", distributor.position);
    createRobot(new BABYLON.Vector3(10, 0, 0));

    // Single retailer with robot
    const retailer = BABYLON.MeshBuilder.CreateBox(
      "retailer",
      { width: 1.5, height: 2, depth: 1.5 },
      scene
    );
    retailer.position = new BABYLON.Vector3(14, 0, 0);
    retailer.material = iotActiveMaterial;
    createLabel("Retailer", retailer.position);
    createRobot(new BABYLON.Vector3(16, 0, 0));

    // Single customer with robot
    const customer = BABYLON.MeshBuilder.CreateSphere(
      "customer",
      { diameter: 1 },
      scene
    );
    customer.position = new BABYLON.Vector3(20, 0, 0);
    customer.material = blueMaterial;
    createLabel("Customer", customer.position);
    createRobot(new BABYLON.Vector3(22, 0, 0));

    // Enhanced IoT monitoring visualization
    const createIoTConnection = (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
      const points = [start, end];
      const lines = BABYLON.MeshBuilder.CreateLines(
        "lines",
        { points },
        scene
      );
      lines.color = new BABYLON.Color3(0.2, 0.8, 0.2);

      // Add IoT monitoring point
      const midPoint = BABYLON.Vector3.Lerp(start, end, 0.5);
      const monitor = BABYLON.MeshBuilder.CreateSphere(
        "iotMonitor",
        { diameter: 0.3 },
        scene
      );
      monitor.position = midPoint;
      monitor.material = iotActiveMaterial;

      // Add animated IoT data particles
      const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
      particleSystem.particleTexture = new BABYLON.Texture(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVChTY/jPwABFI2EGBiRMNwVD2QwA+8kEZKQwO7QAAAAASUVORK5CYII="
      );
      
      particleSystem.emitter = monitor;
      particleSystem.minEmitBox = start;
      particleSystem.maxEmitBox = end;
      
      particleSystem.color1 = new BABYLON.Color4(0.2, 0.8, 0.2, 1.0);
      particleSystem.color2 = new BABYLON.Color4(0.3, 0.9, 0.3, 1.0);
      particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
      
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.2;
      
      particleSystem.minLifeTime = 1;
      particleSystem.maxLifeTime = 2;
      
      particleSystem.emitRate = 50;
      particleSystem.start();

      return lines;
    };

    // Connect all nodes
    farms.forEach(farm => {
      createIoTConnection(farm.position, collectionPoints[0].position);
    });

    createIoTConnection(collectionPoints[0].position, processingPlant.position);
    createIoTConnection(processingPlant.position, distributor.position);
    createIoTConnection(distributor.position, retailer.position);
    createIoTConnection(retailer.position, customer.position);

    // Animation loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      engine.resize();
    });

    // Cleanup
    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
      {milkInspectionData && (
        <div className="absolute top-4 right-4 w-80">
          <Alert variant={milkInspectionData.status === 'ACCEPTED' ? 'success' : 'error'}>
            <AlertTitle>Milk Inspection Result</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>Farmer ID: {milkInspectionData.farmerId}</p>
                <p>Quantity: {milkInspectionData.quantity} Ltr</p>
                <p>Quality: {milkInspectionData.quality} SNF</p>
                <p>Status: {milkInspectionData.status}</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MilkSupplyChain;