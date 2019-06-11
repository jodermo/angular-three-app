import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  MarchingCubes,
  LuminosityShader,
  SobelOperatorShader,
  EffectComposer,
  RenderPass,
  ShaderPass,
  TexturePass,
  FilmShader,
  VignetteShader,
  HorizontalBlurShader,
  VerticalBlurShader,
  DotScreenShader,
  RGBShiftShader,
  SepiaShader,
  MaskPass,
  BleachBypassShader,
  CopyShader,
  BloomPass,
  FilmPass,
  DotScreenPass,
  ColorifyShader,
  SVGLoader
} from 'three-addons';
import * as THREE from 'three';
(<any>window).THREE = THREE;
import * as CSS3D from 'three-css3drenderer';
import * as Stats from 'stats-js';
import * as TWEEN from '@tweenjs/tween.js';
import dat from 'datguivr';

import CameraControls from 'camera-controls';


CameraControls.install({THREE: THREE});


@Component({
  selector: 'app-animation-display',
  templateUrl: './animation-display.component.html',
  styleUrls: ['./animation-display.component.scss']
})
export class AnimationDisplayComponent implements OnInit {
  @ViewChild('animationDisplay') containerElement: ElementRef;
  container;
  camera;
  scene;
  objects = [];
  sceneCSS;
  renderer;
  _renderer;
  rendererCSS;
  composer;
  effects;
  raycaster;
  loadingManager;

  stats;
  clock = new THREE.Clock();
  time = TWEEN.now();
  positionNull = new THREE.Vector3();
  tempMatrix = new THREE.Matrix4();


  vr = false;
  gui;
  vrMode;
  vrDevice;
  vrControllers;
  vrController1;
  vrController2;
  vrDisplays;
  vrSession;
  initialRun;


  started;
  width;
  height;
  viewportMode;

  ngOnInit() {

  }

  initThree(success: any = false) {
    if (!this.scene) {
      this.scene = new THREE.Scene();
    }
    if (!this.sceneCSS) {
      this.sceneCSS = new THREE.Scene();
    }
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
      this.renderer.setSize(this.viewSize().width, this.viewSize().height);
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.zIndex = 1;
      this.renderer.domElement.style.top = 0;
      this.renderer.domElement.style.left = 0;
      this.renderer.sortObjects = true;
      this.renderer.setClearColor(new THREE.Color(0xffffff), 0);
      this.renderer.gammaInput = false;
      this.renderer.gammaOutput = false;
      this.renderer.clear();
    }
    if (!this.rendererCSS) {
      this.rendererCSS = new CSS3D.CSS3DRenderer();
      this.rendererCSS.setSize(this.viewSize().width, this.viewSize().height);
      this.rendererCSS.domElement.style.position = 'absolute';
      this.rendererCSS.domElement.style.zIndex = 2;
      this.rendererCSS.domElement.style.top = 0;
      this.rendererCSS.domElement.style.left = 0;
    }
    this.container.innerHTML = null;

    document.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });
    document.addEventListener('keyup', (event) => {
      this.onKeyUp(event);
    });
    this._renderer.appendChild(this.container, this.renderer.domElement);
    this._renderer.appendChild(this.container, this.rendererCSS.domElement);
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
    }
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onError = (url) => console.error('there was an error loading: ' + url);
  }

  createScene() {
    this.renderer.setClearColor(0x000000, 0);
    this.addStats();
    this.initGui();
    this.startRendering();
  }

  addComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.viewSize().width, this.viewSize().height);
    this.effects.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.effects.renderPass);
    this.effects.vignette = new ShaderPass(VignetteShader);
    this.effects.vignette.uniforms['offset'].value = .33;
    this.effects.vignette.uniforms['darkness'].value = 3;
    this.effects.vignette.renderToScreen = true;
    this.composer.addPass(this.effects.vignette);
  }

  startRendering() {
    this.renderer.setAnimationLoop(() => {
      this.renderScene();
    });
  }

  renderScene() {
    if (this.stats) {
      this.stats.begin();
    }
    this.renderer.render(this.scene, this.camera);
    if (this.rendererCSS) {
      this.rendererCSS.render(this.sceneCSS, this.camera);
    }
    if (this.stats) {
      this.stats.end();
    }
  }

  addStats(showPanel: number = 0) {
    this.stats = new Stats();
    this.stats.showPanel(showPanel);
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.left = 'auto';
    this.stats.dom.style.top = 'auto';
    this.stats.dom.style.right = 0;
    this.stats.dom.style.bottom = 0;
    this.container.appendChild(this.stats.dom);
  }

  viewSize() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      scale: 1,
      pixelRatio: window.devicePixelRatio
    };
  }

  updateView(camera: any = this.camera) {
    if (this.container) {
      this.width = this.viewSize().width;
      this.height = this.viewSize().height;
      if (this.height > this.width) {
        this.viewportMode = 'portrait';
      } else {
        this.viewportMode = 'landscape';
      }
      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.viewSize().pixelRatio);
      }
      if (this.composer) {
        this.composer.setSize(this.viewSize().width, this.viewSize().height);
      }
      if (this.rendererCSS) {
        this.rendererCSS.setSize(this.width, this.height);
      }
      if (camera) {
        camera.aspect = this.width / this.height;
        camera.updateProjectionMatrix();
      }
    }
  }

  destroy() {
    this.stopVrMode();

    if (this.renderer) {
      this.renderer.domElement.remove();
    }
    if (this.rendererCSS) {
      this.rendererCSS.domElement.remove();
    }
    if (this.scene) {
      this.scene.remove();
    }
    if (this.sceneCSS) {
      this.sceneCSS.remove();
    }
    if (this.camera) {
      this.camera.remove();
    }

    function empty(elem) {
      while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
      }
    }

    empty(this.container);
    this.started = false;
  }

  onMouseDown(event: MouseEvent) {

  }

  onMouseUp(event: MouseEvent) {

  }

  onMouseMove(event: MouseEvent) {

  }

  onContextMenu(event: MouseEvent) {

  }

  onKeyDown(event: KeyboardEvent) {

  }

  onKeyUp(event: KeyboardEvent) {

  }

  /* vr */

  toggleVrMode() {
    if (!this.vrMode) {
      this.startVrMode();
    } else {
      this.stopVrMode();
    }
  }


  initGui() {
    this.gui = dat.create('Animation settings');
    this.gui.add(this, 'speeed')
    this.scene.add(this.gui);
  }


  onPageVrLoad() {
    console.log('onPageVrLoad', navigator);
    if (navigator['activeVRDisplays']) {
      for (const display of navigator['activeVRDisplays']) {
        display.exitPresent();
      }
      console.log('onPageVrLoad', navigator['activeVRDisplays']);
    }
  }

  enterVrMode(device) {
    this.vrMode = 'started';
    if (this.vrDevice && !this.vrDevice.isPresenting) {
      this.vrDevice.requestPresent([{source: this.renderer.domElement}]);
    } else if (this.vrDevice && this.vrDevice.isPresenting) {
      this.stopVrMode();
      setTimeout(() => {
        this.enterVrMode(device);
      }, 1000);
    }
  }

  initVrController() {
    if (this.vrController1) {
      this.vrController1 = this.removeVrController(this.vrController1);
    }
    this.vrController1 = this.addController(this.vrController1, 0);
    if (this.vrController2) {
      this.vrController2 = this.removeVrController(this.vrController2);
    }
    this.vrController1 = this.addController(this.vrController2, 1);
  }

  addController(controller: any, int: number) {
    controller = this.renderer.vr.getController(int);
    if (controller) {
      controller.addEventListener('selectstart', (event) => {
        const controller = event.target;
        const intersections = this.getVrIntersections(controller);
        if (intersections.length > 0) {
          const intersection = intersections[0];
          this.tempMatrix.getInverse(controller.matrixWorld);
          const object = intersection.object;
          object.matrix.premultiply(this.tempMatrix);
          object.matrix.decompose(object.position, object.quaternion, object.scale);
          controller.add(object);
          controller.userData.selected = object;
        }
      });
      controller.addEventListener('selectend', (event) => {
        var controller = event.target;
        if (controller.userData.selected !== undefined) {
          var object = controller.userData.selected;
          object.matrix.premultiply(controller.matrixWorld);
          object.matrix.decompose(object.position, object.quaternion, object.scale);
          this.scene.add(object);
          controller.userData.selected = undefined;
        }
      });
      this.scene.add(controller);
      this.controllerModel(controller);
    }
    return controller;
  }

  getVrIntersections(controller) {
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
    return this.raycaster.intersectObjects(this.objects);
  }

  removeVrController(controller) {
    this.scene.remove(controller);
    controller.remove();
    controller = null;
    return controller;
  }

  handleVrController(controller) {
    if (controller.userData.isSelecting) {
      console.log(controller);
    }
  }

  controllerModel(controller: any) {
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
    geometry.addAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
    // @ts-ignore
    const material = new THREE.LineBasicMaterial({vertexColors: true, blending: THREE.AdditiveBlending});
    controller.add(new THREE.Line(geometry, material));
  }

  exitVrMode() {
    this.stopVrMode();
  }

  startVrMode(options: any = null) {
    if (this.vr) {
      if (options && options.frameOfReferenceType) {
        this.renderer.vr.setFrameOfReferenceType(options.frameOfReferenceType);
      }
      if (navigator['xr']) {
        navigator['xr'].requestDevice().then((device) => {
          device.supportsSession({immersive: true, exclusive: true /* DEPRECATED */})
            .then(() => {
              this.enterVRDevice(device);
            })
            .catch(this.vrNotFound);
        }).catch(this.vrNotFound);
        return;
      } else if ('getVRDisplays' in navigator) {
        window.addEventListener('vrdisplayconnect', (event) => {
          if (event['display']) {
            this.enterVRDevice(event['display']);
          }
        }, false);
        window.addEventListener('vrdisplaydisconnect', (event) => {
          this.vrNotFound();
        }, false);
        window.addEventListener('vrdisplaypresentchange', (event) => {
          if (event['display']) {
            if (event['display'].isPresenting) {
              this.vrMode = 'started'
            } else {
              this.vrMode = 'available'
            }
          }
        }, false);
        window.addEventListener('vrdisplayactivate', (event) => {
          if (event['display']) {
            event['display'].requestPresent([{source: this.renderer.domElement}]);
          }
        }, false);
        window.addEventListener('gamepadconnected', (event) => {
          if (event['gamepad']) {
            console.log('Gamepad ' + event['gamepad'].index + ' connected.');
            this.initVrController();
          }
        });
        window.addEventListener('gamepaddisconnected', (event) => {
          if (event['gamepad']) {
            console.log('Gamepad ' + event['gamepad'].index + ' disconnected.');
            this.initVrController();
          }
        });
        this.vrControllers = [];
        this.vrDisplays = [];
        if (navigator['getVRDisplays']) {
          navigator['getVRDisplays']()
            .then((displays) => {
              if (displays.length > 0) {
                this.enterVRDevice(displays[0]);
              } else {
                this.vrNotFound();
              }
              console.log(displays.length + ' VR displays');
              for (let i = 0; i < displays.length; i++) {
                this.vrDisplays.push(displays[i]);
              }
              if (navigator.getGamepads) {
                setTimeout(() => {
                  const gamepads = navigator.getGamepads();
                  console.log(gamepads.length + ' VR controllers');

                  for (let i = 0; i < gamepads.length; ++i) {
                    this.vrControllers.push(gamepads[i]);
                  }
                  this.initialRun = false;
                  this.initVrController();
                }, 1000);
              }
            }).catch(this.vrNotFound);

        } else {
          console.log('WebVR API and/or Gamepad API not supported by this browser.')
        }

        return;
      } else {
        const underline = (s) => {
          const arr = s.split('');
          s = arr.join('\u0332');
          if (s) {
            s = s + '\u0332'
          }
          return s;
        };

        alert(
          underline('No VR support found. ') + '\n\n' +
          'The best support for VR is in current version of Mozilla FireFox.\n\n' +
          'If you whant to use the ' + underline('experimental VR mode') + ' in Google Chrome, \ngo to the address bar and type: ' +
          underline('chrome://flags') + '. \nThen in the ' + underline('search bar') + ' for the flags, type ' + underline('vr') + '. \n' +
          'Enable the flags regarding WebVR and the runtime that you usually use for virtual reality. \nClick the ' + underline('RELAUNCH NOW') + '* button and try out again.'
        );
        return;
      }
    }

  }

  stopVrMode() {
    if (this.vrDevice) {
      this.vrDevice.exitPresent();
      this.vrDevice = null;
    }
    if (this.vrSession) {
      this.vrSession.end();
      this.vrSession = null;
    }
    this.renderer.vr.enabled = false;
    this.vrMode = false;

    for (const display of  this.vrDisplays) {
      display.exitPresent();
    }

  }

  vrNotFound() {
    this.vrMode = 'unavailable';
  }

  enterVRDevice(device) {
    this.vrDevice = device;
    this.renderer.vr.setDevice(device);
    this.vrMode = 'available';
    this.renderer.vr.enabled = true;
  }

  animateControllers() {
    if (this.vrController1) {
      this.handleVrController(this.vrController1);
    }

    if (this.vrController2) {
      this.handleVrController(this.vrController2);
    }
  }


}
