import './style/index.css';
import * as twgl from 'twgl.js';
import vs from './shaders/shader.vert';
import fs from './shaders/shader.frag';
import GameObject from './game-object';
import Physics from './physics';
import { gl } from './constants';
import manager from './gamemanager';
import Input from './input';
import Camera from './camera';
import { Vector3 } from 'three';
import { spawnArr } from './utils/objects';
import { UFO_START_SPEED, UFO_START_ROT, SHIP_SPEED } from './utils/constants';


const m4 = twgl.m4;

const main = async () => {
  const programInfo = twgl.createProgramInfo(gl, [vs, fs], error => console.log(error));

  // init gl stuff here, like back face culling and the depth test
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1.0);

  // the handle to the current requested animation frame, set later
  let rafHandle = undefined;

  // track when the last frame rendered
  let lastFrameMilis = 0;

  const modelRefs = [
    { model: require('./models/ufo.obj'), name: 'ufo' },
    { model: require('./models/starwars.obj'), name: 'starwars' },
    { model: require('./models/asteroid0.obj'), name: 'asteroid0' },
    { model: require('./models/asteroid1.obj'), name: 'asteroid1' },
    { model: require('./models/raymanModel.obj'), name: 'rayman' },
    { model: require('./models/cow.obj'), name: 'cow' }
  ];

  await manager.addModels(modelRefs);

  // Create physics objects
  // Physics(Velocity, angularVelocity, colliderRadius)
  let asteroidPhysics = new Physics(new Vector3(0, 0, 0), new Vector3(0, 0, 0), 0);
  let ufoPhysics = new Physics(new Vector3(0, 0, UFO_START_SPEED), new Vector3(0, UFO_START_ROT, 0), 0);

  // Declare models to be used
  const ufo = new GameObject(manager.modelList.ufo, ufoPhysics);
  const myAsteroid1 = new GameObject(manager.modelList.asteroid1, asteroidPhysics);
  
  // Half the ship to fit the size of the asteroids
  ufo.scale = ufo.scale / 2;
  
  // this is a hack, this allows me to have access to the ufo in all the cows
  manager.ufo = ufo;
  
  // Spawn the first set of asteroids
  let arrOfObjects = spawnArr(200);
  manager.addObjects(arrOfObjects);                 
  
  // Add testing models to canvas
  manager.addObject(myAsteroid1);
  manager.addObject(ufo);
  
  // mainModel should be the 'main' model of the scene 
  const mainModel = manager.modelList.ufo.getModelExtent();

  // create and init camera
  const camera = new Camera(75, window.innerWidth / window.innerHeight, 1, 2000);
  
  camera.lookAt({
    x: 0,
    y: 0,
    z: 0
  });
  
  camera.setPosition({
    x: mainModel.dia * 0,
    y: mainModel.dia * 0.7,
    z: mainModel.dia
  });
  
  // create looper function
  function frame(curentMilis) {
    // calculate the change in time in seconds since the last frame
    let deltaTime = (curentMilis - lastFrameMilis) / 1000;

    // check if the canvas needs to be resized, if so, things need to be recreated here
    if (wasResized) {
      // re create frame buffers (TODO) here so that they have the proper settings
    }

    // update things here
    update(deltaTime);

    // clear the previous frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // do the render
    render(deltaTime);

    // request the next frame
    rafHandle = requestAnimationFrame(frame);

    // update the last frame milis
    lastFrameMilis = curentMilis;
  }

  // update function, responsible for updating all objects and things that need to be updated since last frame
  function update(deltaTime) {
    
    const modifier = Input.keysDown.Shift ? 5 : 1;
    
    if (Input.keysDown.ArrowRight || Input.keysDown.d || Input.keysDown.e) {
      ufo.position.add(new Vector3(SHIP_SPEED * modifier, 0, 0)) ;
    }
    if (Input.keysDown.ArrowLeft || Input.keysDown.a || Input.keysDown.q) {
      ufo.position.add(new Vector3(-SHIP_SPEED * modifier, 0, 0));
    }
    if (Input.keysDown.ArrowUp || Input.keysDown.w || Input.keysDown.e || Input.keysDown.q) {
      ufo.position.add(new Vector3(0, SHIP_SPEED * modifier, 0));
    }
    if (Input.keysDown.ArrowDown || Input.keysDown.s) {
      ufo.position.add(new Vector3(0, -SHIP_SPEED * modifier, 0));
    }
    
    // Added o and p for debugging purposes, not needed for actual gameplay
    if (Input.keysDown.o) {
      ufo.physics.velocity.add(new Vector3(0, 0, -10));
      ufo.physics.angularVelocity.add(new Vector3(0, -10, 0));
    }
    if (Input.keysDown.p) {
      ufo.physics.velocity.add(new Vector3(0, 0, 10));
      ufo.physics.angularVelocity.add(new Vector3(0, 10, 0));
    }
    if (Input.keysDown.r) {
      ufo.physics.velocity = new Vector3(0, 0, UFO_START_SPEED);
      ufo.physics.angularVelocity = new Vector3(0, UFO_START_ROT, 0);
    }

    manager.sceneObjects.forEach(sceneObject => sceneObject.update(deltaTime));

    let offset = new Vector3(0, mainModel.dia * 0.5, mainModel.dia);
    camera.setPosition(ufo.position.clone().add(offset));
    camera.lookAt(ufo.position);
  }

  // render function, responsible for alloh true rendering, including shadows (TODO), model rendering, and post processing (TODO)
  function render(deltaTime) {
    manager.sceneObjects.forEach(sceneObject =>
      sceneObject.render(programInfo, camera.getUniforms())
    );
  }

  // track if the window was resized and adjust the canvas and viewport to match
  let wasResized = false;
  window.addEventListener('resize', () => {
    // even though this is an event listener, due to the nature of the javascript event loop, 
    // this will not cause weird timing issues with our rendering because we cant be rendering and processing this at the same time
    // it just inst possible
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    wasResized = true;
  });

  // this will make init the canvas width and height and the viewport
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // start the render loop by requesting an animation frame for the frame function
  rafHandle = requestAnimationFrame(frame);
};

main();
