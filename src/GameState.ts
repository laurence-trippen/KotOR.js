import * as THREE from "three";
import * as path from "path";
import * as fs from "fs";
import { AnimatedTexture } from "./AnimatedTexture";
import { CombatEngine } from "./CombatEngine";
import { GameMenu, MenuManager, GUIListBox } from "./gui";
import { INIConfig } from "./INIConfig";
import { Module, ModuleObject, ModuleDoor, ModulePlaceable, ModuleCreature, ModuleArea } from "./module";
import { Mouse } from "./controls/Mouse";
import { PartyManager } from "./managers/PartyManager";
import { Planetary } from "./Planetary";
import { SaveGame } from "./SaveGame";
import { ApplicationProfile } from "./utility/ApplicationProfile";
import { VideoPlayer } from "./VideoPlayer";
import { IngameControls } from "./controls/IngameControls";
import { EngineGlobals } from "./interface/engine/EngineGlobals";
import { GameEngineType } from "./enums/engine/GameEngineType";
import { GameEngineEnv } from "./enums/engine/GameEngineEnv";
import { MDLLoader } from "./three/MDLLoader";
import { ModuleObjectType } from "./enums/nwscript/ModuleObjectType";
import EngineLocation from "./engine/EngineLocation";
import { CursorManager } from "./managers/CursorManager";
import { EngineMode } from "./enums/engine/EngineMode";
import { OdysseyModel3D, OdysseyObject3D } from "./three/odyssey";
import { NWScript } from "./nwscript/NWScript";
import { AudioEngine } from "./audio/AudioEngine";
import { AudioEngineChannel } from "./enums/audio/AudioEngineChannel";
import { ResourceLoader } from "./resource/ResourceLoader";
import { LightManager } from "./managers/LightManager";
import { TwoDAManager } from "./managers/TwoDAManager";
import { TextureLoader } from "./loaders/TextureLoader";
import { EngineState } from "./enums/engine/EngineState";
import { CameraShakeManager } from "./managers/CameraShakeManager";
import { TGAObject } from "./resource/TGAObject";
import { AudioEmitter } from "./audio/AudioEmitter";
import { TextureType } from "./enums/loaders/TextureType";
import { FadeOverlayManager } from "./managers/FadeOverlayManager";
import { CreatureType } from "./enums/nwscript/CreatureType";
import { ReputationType } from "./enums/nwscript/ReputationType";
import { ShaderManager } from "./managers/ShaderManager";

const saturationShader: any = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "saturation": { type: "f", value: 1.0 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "varying vec2 vUv;",
    "uniform float saturation;",
    "void main() {",
      "vec3 original_color = texture2D(tDiffuse, vUv).rgb;",
      "vec3 lumaWeights = vec3(.25,.50,.25);",
      "vec3 grey = vec3(dot(lumaWeights,original_color));",
      "gl_FragColor = vec4(grey + saturation * (original_color - grey) ,1.0);",
    "}"
  ].join("\n")
};



export const PLAYER_CHAR_NOT_PC            = false;
export const PLAYER_CHAR_IS_PC             = true;

export const CLASS_TYPE_INVALID   = 255;

// These are for GetFirstInPersistentObject() and GetNextInPersistentObject()
export const PERSISTENT_ZONE_ACTIVE = 0;
export const PERSISTENT_ZONE_FOLLOW = 1;

export interface GameStateInitializeOptions {
  Game: GameEngineType,
  GameDirectory: string, //path to the local game install directory
  Env: GameEngineEnv,
};

export interface GameStateGroups {
  creatures: THREE.Group;
  doors: THREE.Group;
  placeables: THREE.Group;
  rooms: THREE.Group;
  grass: THREE.Group;
  sounds: THREE.Group;
  triggers: THREE.Group;
  waypoints: THREE.Group;
  party: THREE.Group;
  lights: THREE.Group;
  light_helpers: THREE.Group;
  shadow_lights: THREE.Group;
  path_helpers: THREE.Group;
  emitters: THREE.Group;
  effects: THREE.Group;
  stunt: THREE.Group;
  weather_effects: THREE.Group;
  room_walkmeshes: THREE.Group;
};

export class EngineContext {
  static groups: GameStateGroups;

}

export class GameState implements EngineContext {


  static activeMenu: GameMenu;
  static activeGUIElement: any;
  static hoveredGUIElement: any;


  static Location: any;
  static objSearchIndex: number;

  static GameKey: GameEngineType = GameEngineType.KOTOR;
  static iniConfig: INIConfig;
  static AnimatedTextures: AnimatedTexture[] = [];
  static ModelLoader: MDLLoader = new MDLLoader();
  
  static OpeningMoviesComplete = false;
  static Ready = false;
  
  static CameraDebugZoom = 1;
  
  static raycaster = new THREE.Raycaster();
  static mouse = new THREE.Vector2();
  static mouseUI = new THREE.Vector2();
  static screenCenter = new THREE.Vector3();
  
  static SOLOMODE = false;
  static isLoadingSave = false;
  
  static Flags = {
    EnableAreaVIS: false,
    LogScripts: false,
    EnableOverride: false,
    WalkmeshVisible: false,
    CombatEnabled: false
  }
  
  static debug = {
    controls: false,
    selectedObject: false
  };
  
  static IsPaused = false;
  static inDialog = false;
  
  static Mode: EngineMode = EngineMode.MAINMENU;
  static holdWorldFadeInForDialog = false;
  static autoRun = false;
  static AlphaTest = 0.5;
  static noClickTimer = 0;
  static maxSelectableDistance = 20;

  static delta: number = 0;
  static clampedDelta: number = 0;

  static SaveGame: SaveGame;
  
  static _emitters = {};
  
  static currentGamepad: Gamepad;
  static Globals: EngineGlobals = { 
    Boolean   : new Map(), 
    Number    : new Map(), 
    String    : new Map(), 
    Location  : new Map(), 
  };
  static models: any[];
  static videoEffect: any;
  static onScreenShot: any;
  static time: number;
  static deltaTime: number;

  static canvas: HTMLCanvasElement;
  static context: WebGLRenderingContext;
  static rendererUpscaleFactor: number;
  static renderer: any;
  static depthTarget: any;
  static clock: any;
  static stats: any;
  static limiter: { fps: number; fpsInterval: number; startTime: number; now: number; then: number; elapsed: number; setFPS: (fps?: number) => void; };
  static visible: boolean;

  //Cursor properties
  static selected: any;
  static hovered: any;

  static scene: any;
  static scene_gui: any;

  //Camera properties
  static frustumMat4: any;
  static camera: THREE.PerspectiveCamera;
  static currentCamera: THREE.Camera;
  static followerCamera: THREE.PerspectiveCamera;
  static camera_dialog: THREE.PerspectiveCamera;
  static camera_animated: THREE.PerspectiveCamera;
  static camera_gui: THREE.OrthographicCamera;
  static staticCameras: any[];
  static animatedCameras: any[];
  static staticCameraIndex: number;
  static animatedCameraIndex: number;
  static cameraMode: any;
  static viewportFrustum: THREE.Frustum;
  static viewportProjectionMatrix: THREE.Matrix4;

  //GameState properties
  static globalLight: THREE.AmbientLight;
  static player: any;
  static playerFeetOffset: THREE.Vector3;
  static collisionList: any[];
  static walkmeshList: any[];

  static group: GameStateGroups = {
    creatures: new THREE.Group,
    doors: new THREE.Group,
    placeables: new THREE.Group,
    rooms: new THREE.Group,
    grass: new THREE.Group,
    sounds: new THREE.Group,
    triggers: new THREE.Group,
    waypoints: new THREE.Group,
    party: new THREE.Group,
    lights: new THREE.Group,
    light_helpers: new THREE.Group,
    shadow_lights: new THREE.Group,
    path_helpers: new THREE.Group,
    emitters: new THREE.Group,
    effects: new THREE.Group,
    stunt: new THREE.Group,
    weather_effects: new THREE.Group,
    room_walkmeshes: new THREE.Group,
  };
  static weather_effects: any[];
  static interactableObjects: any[];

  static scene_cursor_holder: THREE.Group;
  static controls: any;

  //Render pass properties
  static composer: any;
  static renderPass: any;
  static renderPassAA: any;
  static saturationPass: any;
  static colorPass: any;
  static copyPass: any;
  static renderPassGUI: any;
  static bloomPass: any;
  static bokehPass: any;
  static filmPass: any;
  
  static module: Module;
  static TutorialWindowTracker: any[];
  static audioEngine: AudioEngine;
  static audioEmitter: AudioEmitter;
  static guiAudioEmitter: any;
  static State: EngineState;
  static inMenu: boolean;
  static OnReadyCalled: boolean;
  static selectedObject: any;
  static hoveredObject: any;
  
  static loadingTextures: boolean;
  static MenuActive: any;
  static VideoEffect: any;
  static LoadScreen: any;
  static MenuTop: any;
  static InGameDialog: any;
  static octree_walkmesh: any;
  static MenuContainer: any;
  static octree: any;
  static InGameBark: any;
  static FadeOverlay: any;
  static InGameComputer: any;

  static Init(){
    if(GameState.GameKey == 'TSL'){
      GameState.iniConfig = new INIConfig(path.join(ApplicationProfile.directory, 'swkotor2.ini'), INIConfig.defaultConfigs.swKotOR2);
    }else{
      GameState.iniConfig = new INIConfig(path.join(ApplicationProfile.directory, 'swkotor.ini'), INIConfig.defaultConfigs.swKotOR);
    }
    
    GameState.models = [];

    GameState.videoEffect = null;

    GameState.activeGUIElement = undefined;
    GameState.hoveredGUIElement = undefined;
    GameState.onScreenShot = undefined;

    GameState.time = 0;
    GameState.deltaTime = 0;

    GameState.canvas = document.createElement( 'canvas' );
    //GameState.canvas = GameState.renderer.domElement;

    GameState.canvas.classList.add('noselect');
    GameState.canvas.setAttribute('tabindex', '1');
    document.getElementById('renderer-container').appendChild(GameState.canvas);
    
    //transferToOffscreen() causes issues with savegame screenshots
    //GameState.canvas = GameState.canvas.transferControlToOffscreen();

    GameState.canvas.style.setProperty('width', '0');
    GameState.canvas.style.setProperty('height', '0');
    GameState.context = GameState.canvas.getContext( 'webgl' );

    GameState.rendererUpscaleFactor = 1;
    GameState.renderer = new THREE.WebGLRenderer({
      antialias: false,
      canvas: GameState.canvas,
      context: GameState.context,
      logarithmicDepthBuffer: false,
      alpha: true,
      preserveDrawingBuffer: false
    });

    GameState.renderer.autoClear = false;
    GameState.renderer.setSize( window.innerWidth, window.innerHeight );
    GameState.renderer.setClearColor(0x000000);

    let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
		GameState.depthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
    GameState.depthTarget.texture.generateMipmaps = false;
    GameState.depthTarget.stencilBuffer = false;
    GameState.depthTarget.depthBuffer = true;
    GameState.depthTarget.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
    GameState.depthTarget.depthTexture.type = THREE.UnsignedShortType;

    (window as any).renderer = GameState.renderer;

    GameState.clock = new THREE.Clock();
    //@ts-expect-error
    GameState.stats = new Stats();

    GameState.activeMenu = undefined;

    GameState.limiter = {
      fps : 30,
      fpsInterval: 1000/30,
      startTime: Date.now(),
      now: 0,
      then: 0,
      elapsed: 0,
      setFPS: function(fps = 30){
        this.fps = fps;
        this.fpsInterval = 1000 / this.fps;
      }
    };

    GameState.limiter.then = GameState.limiter.startTime;

    GameState.visible = true;

    GameState.selected = undefined;
    GameState.hovered = undefined;

    GameState.scene = new THREE.Scene();
    GameState.scene_gui = new THREE.Scene();
    GameState.frustumMat4 = new THREE.Matrix4();
    GameState.camera = GameState.followerCamera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 15000 );

    GameState.camera_dialog = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 15000 );
    GameState.camera_dialog.up = new THREE.Vector3( 0, 0, 1 );
    GameState.camera_animated = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 15000 );
    GameState.camera_animated.up = new THREE.Vector3( 0, 1, 0 );
    GameState.camera.up = new THREE.Vector3( 0, 0, 1 );
    GameState.camera.position.set( .1, 5, 1 );              // offset the camera a bit
    GameState.camera.lookAt(new THREE.Vector3( 0, 0, 0 ));
    
    GameState.camera_gui = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1, 1000
    );
    GameState.camera_gui.up = new THREE.Vector3( 0, 0, 1 );
    GameState.camera_gui.position.z = 500;
    GameState.camera_gui.updateProjectionMatrix();
    GameState.scene_gui.add(new THREE.AmbientLight(0x60534A));

    GameState.followerCamera.userData.facing = Math.PI/2;
    GameState.followerCamera.userData.speed = 0;

    //Static Camera's that are in the .git file of the module
    GameState.staticCameras = [];
    //Animates Camera's are MDL files that have a camera_hook and animations for use in dialog
    GameState.animatedCameras = [];

    GameState.staticCameraIndex = 0;
    GameState.animatedCameraIndex = 0;
    // GameState.cameraMode = GameState.CameraMode.EDITOR;
    GameState.currentCamera = GameState.camera;

    GameState.viewportFrustum = new THREE.Frustum();
    GameState.viewportProjectionMatrix = new THREE.Matrix4();

    //0x60534A
    GameState.globalLight = new THREE.AmbientLight(0xFFFFFF);
    GameState.globalLight.position.x = 0;
    GameState.globalLight.position.y = 0;
    GameState.globalLight.position.z = 0;
    GameState.globalLight.intensity  = 1;

    GameState.scene.add(GameState.globalLight);

    GameState.player = undefined;//new ModuleCreature();//AuroraObject3D();
    GameState.playerFeetOffset = new THREE.Vector3(0,0,1);

    GameState.collisionList = [];
    GameState.walkmeshList = [];
    GameState.group = {
      creatures: new THREE.Group(),
      doors: new THREE.Group(),
      placeables: new THREE.Group(),
      rooms: new THREE.Group(),
      grass: new THREE.Group(),
      sounds: new THREE.Group(),
      triggers: new THREE.Group(),
      waypoints: new THREE.Group(),
      party: new THREE.Group(),
      lights: new THREE.Group(),
      light_helpers: new THREE.Group(),
      shadow_lights: new THREE.Group(),
      path_helpers: new THREE.Group(),
      emitters: new THREE.Group(),
      effects: new THREE.Group(),
      stunt: new THREE.Group(),
      weather_effects: new THREE.Group(),
      room_walkmeshes: new THREE.Group(),
    };

    GameState.weather_effects = [];

    GameState.scene.add(GameState.group.rooms);
    // GameState.scene.add(GameState.group.grass);
    GameState.scene.add(GameState.group.placeables);
    GameState.scene.add(GameState.group.doors);
    GameState.scene.add(GameState.group.creatures);
    // //GameState.scene.add(GameState.group.waypoints);
    // //GameState.scene.add(GameState.group.sounds);
    // GameState.scene.add(GameState.group.triggers);
    // GameState.scene.add(GameState.group.stunt);
    // GameState.scene.add(GameState.group.weather_effects);

    // GameState.scene.add(GameState.group.lights);
    // GameState.scene.add(GameState.group.light_helpers);
    // GameState.scene.add(GameState.group.shadow_lights);
    // GameState.scene.add(GameState.group.path_helpers);
    // GameState.scene.add(GameState.group.emitters);
    // GameState.scene.add(GameState.group.effects);

    GameState.scene.add(GameState.group.party);
    // GameState.scene.add(GameState.group.room_walkmeshes);

    GameState.group.light_helpers.visible = false;

    GameState.interactableObjects = [
      GameState.group.placeables, 
      GameState.group.doors, 
      GameState.group.creatures, 
      GameState.group.party,
      //GameState.group.rooms
      GameState.group.room_walkmeshes
    ];

    GameState.scene_cursor_holder = new THREE.Group();
    GameState.scene_gui.add(GameState.scene_cursor_holder);

    GameState.controls = new IngameControls(GameState.currentCamera, GameState.canvas, this);

    document.getElementById('#renderer-containe').appendChild(GameState.stats.dom);
    if(!window.ConfigClient.get('GameState.debug.show_fps'))
      GameState.stats.showPanel(false);

    //BEGIN: PostProcessing
    //@ts-expect-error
    GameState.composer = new THREE.EffectComposer(GameState.renderer);
    //@ts-expect-error
    GameState.renderPass = new THREE.RenderPass(GameState.scene, GameState.currentCamera);
    //@ts-expect-error
    GameState.renderPassAA = new THREE.SSAARenderPass (GameState.scene, GameState.currentCamera);
    //@ts-expect-error
    GameState.saturationPass = new THREE.ShaderPass(saturationShader);
    //@ts-expect-error
    GameState.colorPass = new THREE.ShaderPass(THREE.ColorCorrectionShader);
    //@ts-expect-error
    GameState.copyPass = new THREE.ShaderPass(THREE.CopyShader);
    //@ts-expect-error
    GameState.renderPassGUI = new THREE.RenderPass(GameState.scene_gui, GameState.camera_gui);
    
    //@ts-expect-error
    GameState.bloomPass = new THREE.BloomPass(0.5);
    //@ts-expect-error
    GameState.bokehPass = new THREE.BokehPass(GameState.scene, GameState.currentCamera, {
      focus: 1.0,
      aperture:	0.0001,
      maxblur:	1.0,
      width: GameState.renderer.width,
      height: GameState.renderer.height
    });
    //@ts-expect-error
    GameState.filmPass = new THREE.FilmPass(1, 0.325, 512, false);

    GameState.renderPassAA.sampleLevel = 1;

    GameState.renderPass.renderToScreen = false;
    GameState.copyPass.renderToScreen = false;
    GameState.renderPassGUI.renderToScreen = false;

    GameState.renderPass.clear = true;
    GameState.bloomPass.clear = false;
    GameState.filmPass.clear = false;
    GameState.colorPass.clear = false;
    GameState.saturationPass.clear = false;
    GameState.renderPassAA.clear = false;
    GameState.copyPass.clear = false;
    GameState.renderPassGUI.clear = false;
    GameState.renderPassGUI.clearDepth = true;

    GameState.colorPass.uniforms.powRGB.value.set(1, 1, 1);
    GameState.colorPass.uniforms.mulRGB.value.set(0.5, 0.5, 0.5);

    GameState.bokehPass.needsSwap = true;
    GameState.bokehPass.enabled = false;

    GameState.composer.addPass(GameState.renderPass);
    // GameState.composer.addPass(GameState.bokehPass);
    // GameState.composer.addPass(GameState.renderPassAA);
    // GameState.composer.addPass(GameState.filmPass);
    // GameState.composer.addPass(GameState.colorPass);
    // GameState.composer.addPass(GameState.saturationPass);
    // GameState.composer.addPass(GameState.bloomPass);

    GameState.composer.addPass(GameState.renderPassGUI);
    GameState.composer.addPass(GameState.copyPass);

    GameState.renderPass.clearDepth = true;
    GameState.renderPassGUI.clearDepth = true;
    GameState.renderPass.clear = true;
    GameState.renderPassGUI.clear = false;
    GameState.renderPass.needsSwap = false;
    GameState.renderPassGUI.needsSwap = false;

    FadeOverlayManager.Initialize();

    window.addEventListener('resize', () => {

      let width = window.innerWidth;
      let height = window.innerHeight;

      GameState.composer.setSize(width * GameState.rendererUpscaleFactor, height * GameState.rendererUpscaleFactor);

      FadeOverlayManager.plane.scale.set(width, height, 1);
      
      GameState.camera_gui.left = width / -2;
      GameState.camera_gui.right = width / 2;
      GameState.camera_gui.top = height / 2;
      GameState.camera_gui.bottom = height / -2;

      GameState.camera_gui.updateProjectionMatrix();

      GameState.camera.aspect = width / height;
      GameState.camera.updateProjectionMatrix();

      GameState.renderer.setSize(width, height);  
      
      GameState.camera_dialog.aspect = GameState.camera.aspect;
      GameState.camera_dialog.updateProjectionMatrix();

      GameState.camera_animated.aspect = GameState.camera.aspect;
      GameState.camera_animated.updateProjectionMatrix();

      for(let i = 0; i < GameState.staticCameras.length; i++){
        GameState.staticCameras[i].aspect = GameState.camera.aspect;
        GameState.staticCameras[i].updateProjectionMatrix();
      }

      //GameState.bokehPass.renderTargetColor.setSize(width * GameState.rendererUpscaleFactor, height * GameState.rendererUpscaleFactor);

      /*if(GameState.scene_gui.background != null){
        let x = width / 1600;
        let y = height / 1200;

        GameState.scene_gui.background.repeat.set(x, y);
        GameState.scene_gui.background.offset.set( (1.0 - x) / 2, (1.0 - y) / 2);
      }*/

      GameState.screenCenter.x = ( (window.innerWidth/2) / window.innerWidth ) * 2 - 1;
      GameState.screenCenter.y = - ( (window.innerHeight/2) / window.innerHeight ) * 2 + 1; 

      MenuManager.Resize();

      GameState.depthTarget.setSize(window.innerWidth * GameState.rendererUpscaleFactor, window.innerHeight * GameState.rendererUpscaleFactor);
      
    });
    console.log('Game: Start')
    try{
      ShaderManager.Init();
      GameState.Start();
    }catch(e){
      console.error(e);
    }
  }

  static Start(){

    GameState.TutorialWindowTracker = [];
    LightManager.setLightHelpersVisible(window.ConfigClient.get('GameState.debug.light_helpers') ? true : false);

    GameState.audioEngine = new AudioEngine();
    GameState.initGUIAudio();
    LightManager.init();

    Planetary.Init();

    GameState.audioEmitter = new AudioEmitter({
      engine: GameState.audioEngine,
      props: {
        XPosition: 0,
        YPosition: 0,
        ZPosition: 0
      },
      template: {
        sounds: [],
        isActive: true,
        isLooping: false,
        isRandom: false,
        isRandomPosition: false,
        interval: 0,
        intervalVariation: 0,
        maxDistance: 100,
        volume: 127,
        positional: 0
      },
      onLoad: () => {
      },
      onError: () => {
      }
    });

    //AudioEngine.Unmute()
    GameState.Mode = EngineMode.MAINMENU;
    GameState.State = EngineState.RUNNING;
    GameState.inMenu = false;
    let _initGlobals = TwoDAManager.datatables.get('globalcat').rows;
    for (let key in _initGlobals) {
      if (_initGlobals.hasOwnProperty(key)) {
        let globItem = _initGlobals[key];

        switch(globItem.type){
          case 'Boolean':
            GameState.Globals.Boolean.set(globItem.name.toLowerCase(), {name: globItem.name, value: false});
          break;
          case 'Location':
            GameState.Globals.Location.set(globItem.name.toLowerCase(), {name: globItem.name, value: new EngineLocation()});
          break;
          case 'Number':
            GameState.Globals.Number.set(globItem.name.toLowerCase(), {name: globItem.name, value: 0});
          break;
          case 'String':
            GameState.Globals.String.set(globItem.name.toLowerCase(), {name: globItem.name, value: ''});
          break;
        }

      }
    }
    
    console.log('SaveGames: Loading');
    SaveGame.GetSaveGames().then( () => {
      console.log('SaveGames: Complete');
      
      console.log('CursorManager: Init');
      CursorManager.init( () => {
        console.log('CursorManager: Complete');
        console.log('MenuLoader: Init');
        MenuManager.Init();
        MenuManager.LoadGameMenus().then( () => {
          console.log('MenuLoader: Complete');

          MenuManager.MenuJournal.childMenu = MenuManager.MenuTop;
          MenuManager.MenuInventory.childMenu = MenuManager.MenuTop;
          MenuManager.MenuEquipment.childMenu = MenuManager.MenuTop;
          MenuManager.MenuCharacter.childMenu = MenuManager.MenuTop;
          MenuManager.MenuMessages.childMenu = MenuManager.MenuTop;
          MenuManager.MenuOptions.childMenu = MenuManager.MenuTop;
          MenuManager.MenuMap.childMenu = MenuManager.MenuTop;
          MenuManager.MenuAbilities.childMenu = MenuManager.MenuTop;

          //Preload fx textures
          TextureLoader.enQueue(
            ['fx_tex_01', 'fx_tex_02', 'fx_tex_03', 'fx_tex_04', 'fx_tex_05', 'fx_tex_06', 'fx_tex_07', 'fx_tex_08',
            'fx_tex_09', 'fx_tex_10', 'fx_tex_11', 'fx_tex_12', 'fx_tex_13', 'fx_tex_14', 'fx_tex_15', 'fx_tex_16',
            'fx_tex_17', 'fx_tex_18', 'fx_tex_19', 'fx_tex_20', 'fx_tex_21', 'fx_tex_22', 'fx_tex_23', 'fx_tex_24',
            'fx_tex_25', 'fx_tex_26', 'fx_tex_stealth'],
            undefined,
            TextureType.TEXTURE
          );

          TextureLoader.LoadQueue(() => {
            GameState.Ready = true;
            LoadingScreen.main.Hide();
            if(GameState.OpeningMoviesComplete){
              GameState.OnReady();
            }
          });
        });

      });

    });

  }

  static OnReady(){
    if(GameState.Ready && !GameState.OnReadyCalled){
      GameState.OnReadyCalled = true;
      MenuManager.MainMenu.Open();
      window.dispatchEvent(new Event('resize'));
      // this.setTestingGlobals();
      //GameState.Update = GameState.Update.bind(this);
      console.log('begin');
      GameState.Update();
    }
  }

  static initGUIAudio(){
    try{

      GameState.guiAudioEmitter = new AudioEmitter({
        engine: GameState.audioEngine,
        props: {
          XPosition: 0,
          YPosition: 0,
          ZPosition: 0
        },
        template: {
          sounds: [],
          isActive: true,
          isLooping: false,
          isRandom: false,
          isRandomPosition: false,
          interval: 0,
          intervalVariation: 0,
          maxDistance: 100,
          volume: 127,
          positional: 0
        },
        onLoad: () => {
        },
        onError: () => {
        }
      });

      GameState.audioEngine.AddEmitter(GameState.guiAudioEmitter);
    }catch(e){

    }
  }

  public static getCurrentPlayer(): ModuleCreature {
    let p = PartyManager.party[0];
    return p ? p : GameState.player;
  }

  public static onMouseHitInteractive( onSuccess?: Function){
    
    GameState.raycaster.setFromCamera( GameState.mouse, GameState.currentCamera );
    let intersects = GameState.raycaster.intersectObjects( GameState.interactableObjects, true );

    if(intersects.length){
      let intersection = intersects[0],
          obj = intersection.object;

      obj.traverseAncestors( (obj) => {
        if(obj instanceof OdysseyModel3D){
          if(obj != GameState.getCurrentPlayer().getModel()){
            if(typeof onSuccess === 'function')
              onSuccess(obj, intersection.object);

            return;
          }else{
            if(intersects.length >=2){
              intersection = intersects[1],
              obj = intersection.object;
              obj.traverseAncestors( (obj) => {
                if(obj instanceof OdysseyModel3D){
                  if(typeof onSuccess === 'function')
                    onSuccess(obj, intersection.object);

                  return;
                }
              });
            }
          }
          
        }
      });
    }
  }

  public static setReticleSelectedObject( object: ModuleObject ){
    if(object instanceof ModuleObject){
      GameState.selected = object.getReticleNode();
      if(GameState.selected){
        GameState.selected.getWorldPosition(CursorManager.reticle2.position);
        GameState.selectedObject = object;
      }

      if(object instanceof ModuleDoor){      
        CursorManager.setReticle2('reticleF2');
      }else if(object instanceof ModulePlaceable){
        if(!object.isUseable()){
          return;
        }      
        CursorManager.setReticle2('reticleF2');
      }else if(object instanceof ModuleCreature){
        if(object.isHostile(GameState.getCurrentPlayer())){
          CursorManager.setReticle2('reticleH2');
        }else{
          CursorManager.setReticle2('reticleF2');
        }
      }
    }
  }

  public static setReticleHoveredObject( object: ModuleObject ){
    if(object instanceof ModuleObject){
      let distance = GameState.getCurrentPlayer().position.distanceTo(object.position);
      let canChangeCursor = (distance <= GameState.maxSelectableDistance) || (GameState.hoveredObject == GameState.selectedObject);

      GameState.hovered = object.getReticleNode();
      if(GameState.hovered){
        GameState.hovered.getWorldPosition(CursorManager.reticle.position);
        GameState.hoveredObject = object;
      }

      if(object instanceof ModuleDoor){
        if(canChangeCursor)
          CursorManager.setCursor('door');
        else
          CursorManager.setCursor('select');

        CursorManager.setReticle('reticleF');
      }else if(object instanceof ModulePlaceable){
        if(!object.isUseable()){
          return;
        }
        if(canChangeCursor)
          CursorManager.setCursor('use');
        else
          CursorManager.setCursor('select');

        CursorManager.setReticle('reticleF');
      }else if(object instanceof ModuleCreature){

        if(object.isHostile(GameState.getCurrentPlayer())){
          if(!object.isDead()){
            if(canChangeCursor)
              CursorManager.setCursor('attack');
            else
              CursorManager.setCursor('select');

            CursorManager.setReticle('reticleH');
          }else{
            if(canChangeCursor)
              CursorManager.setCursor('use');
            else
              CursorManager.setCursor('select');

            CursorManager.setReticle('reticleF');
          }
        }else{
          if(canChangeCursor)
            CursorManager.setCursor('talk');
          else
            CursorManager.setCursor('select');

          CursorManager.setReticle('reticleF');
        }

      }
    }
  }

  static updateCursorPosition(){
    CursorManager.setCursor('default');
    GameState.scene_cursor_holder.position.x = Mouse.positionClient.x - (window.innerWidth/2) + (32/2);
    GameState.scene_cursor_holder.position.y = (Mouse.positionClient.y*-1) + (window.innerHeight/2) - (32/2);
  }

  static updateCursor(){
    let cursorCaptured = false;
    let guiHoverCaptured = false;

    GameState.hoveredGUIElement = undefined;

    let uiControls = GameState.controls.MenuGetActiveUIElements();
    let controlCount = uiControls.length;
    for(let i = 0; i < controlCount; i++){
      let control = uiControls[i];
      if(!control.isVisible())
        continue;

      //if(control === GameState.mouse.clickItem){
      if(control instanceof GUIListBox && GameState.hoveredGUIElement == undefined){
        GameState.hoveredGUIElement = control;
      }

      if(!(control.widget.parent.type === 'Scene')){
        if(!guiHoverCaptured){
          let cMenu = control.menu;
          cMenu.SetWidgetHoverActive(control, true);
          guiHoverCaptured = false;
        }

        if(typeof control.isClickable == 'function'){
          if(control.isClickable()){
            CursorManager.setCursor('select');
            cursorCaptured = true;
          }
        }
      }
      //}
    }

    if(GameState.selectedObject instanceof ModuleObject){
      if(GameState.selectedObject.position.distanceTo(GameState.getCurrentPlayer().position) > GameState.maxSelectableDistance){
        GameState.selectedObject = undefined;
      }
    }

    if(!cursorCaptured && GameState.Mode == EngineMode.INGAME && !GameState.inDialog && !GameState.MenuActive){
      if(MenuManager.GetCurrentMenu() == MenuManager.InGameOverlay){
        if(GameState.scene_cursor_holder.visible){
          //console.log(GameState.scene_cursor_holder.position);
          let hoveredObject = false;
          GameState.onMouseHitInteractive( (obj: any) => {
            if(obj.moduleObject instanceof ModuleObject && obj.moduleObject.isUseable()){
              if(obj.moduleObject != GameState.getCurrentPlayer()){
                GameState.setReticleHoveredObject(obj.moduleObject);
              }
            }else{
              GameState.hovered = GameState.hoveredObject = undefined;
            }
          });
        }else{
          if(!GameState.selectedObject){
            let closest = GameState.GetNearestInteractableObject();
            GameState.setReticleSelectedObject(closest);
            GameState.setReticleHoveredObject(closest);
          }
        }
      }
    }

    if(GameState.hovered instanceof OdysseyObject3D && !GameState.inDialog){
      GameState.hovered.getWorldPosition(CursorManager.reticle.position);
      CursorManager.reticle.visible = true;
    }else{
      CursorManager.reticle.visible = false;
    }

    if(GameState.selected instanceof OdysseyObject3D && !GameState.inDialog && !MenuManager.MenuContainer.bVisible){
      GameState.selected.getWorldPosition(CursorManager.reticle2.position);
      CursorManager.reticle2.visible = true;
      if(GameState.selectedObject instanceof ModuleDoor){      
        CursorManager.setReticle2('reticleF2');
      }else if(GameState.selectedObject instanceof ModulePlaceable){
        if(!GameState.selectedObject.isUseable()){
          return;
        }      
        CursorManager.setReticle2('reticleF2');
      }else if(GameState.selectedObject instanceof ModuleCreature){
        if(GameState.selectedObject.isHostile(GameState.getCurrentPlayer())){
          CursorManager.setReticle2('reticleH2');
        }else{
          CursorManager.setReticle2('reticleF2');
        }
      }
    }else{
      CursorManager.reticle2.visible = false;
    }

  }




  static LoadModule(name = '', waypoint: string = null, sMovie1 = '', sMovie2 = '', sMovie3 = '', sMovie4 = '', sMovie5 = '', sMovie6 = ''){
    GameState.UnloadModule();
    VideoPlayer.Load(sMovie1, () => {
      VideoPlayer.Load(sMovie2, () => {
        VideoPlayer.Load(sMovie3, () => {
          VideoPlayer.Load(sMovie4, () => {
            VideoPlayer.Load(sMovie5, () => {
              VideoPlayer.Load(sMovie6, () => {
                //MenuManager.InGameOverlay.Hide();
                GameState.Mode = EngineMode.LOADING;
                
                if(GameState.module instanceof Module){
                  GameState.module.save();
                  GameState.module.dispose();
                }

                //Remove all cached scripts and kill all running instances
                NWScript.Reload();

                //Resets all keys to their default state
                GameState.controls.InitKeys();

                FactionManager.Load().then( () => {

                  Module.BuildFromExisting(name, waypoint, (module: Module) => {

                    GameState.scene.visible = false;

                    MenuManager.LoadScreen.setLoadBackground('load_'+name, () => {
                      MenuManager.LoadScreen.showRandomHint();
                      MenuManager.LoadScreen.Open();

                      console.log('Module.loadScene');
                      module.loadScene( (d: any) => {
                        FadeOverlayManager.FadeOut(0, 0, 0, 0);
                        module.initEventQueue();
                        console.log('Module.initScripts');
                        module.initScripts( () => {
                          MenuManager.LoadScreen.Close();
                          process.nextTick( ()=> {
                            //GameState.scene_gui.background = null;
                            GameState.scene.visible = true;
                            
                            AudioEngine.Unmute();
                            if(GameState.module.area.MiniGame){
                              GameState.Mode = EngineMode.MINIGAME
                            }else{
                              GameState.Mode = EngineMode.INGAME;
                            }

                            let runSpawnScripts = !GameState.isLoadingSave;
                            GameState.isLoadingSave = false;
                            
                            MenuManager.InGameComputer.audioEmitter = MenuManager.InGameDialog.audioEmitter = this.audioEmitter = new AudioEmitter({
                              engine: GameState.audioEngine,
                              channel: AudioEngineChannel.VO,
                              props: {
                                XPosition: 0,
                                YPosition: 0,
                                ZPosition: 0
                              },
                              template: {
                                sounds: [],
                                isActive: true,
                                isLooping: false,
                                isRandom: false,
                                isRandomPosition: false,
                                interval: 0,
                                intervalVariation: 0,
                                maxDistance: 50,
                                volume: 127,
                                positional: 0
                              },
                              onLoad: () => {
                              },
                              onError: () => {
                              }
                            });
                            GameState.audioEngine.AddEmitter(this.audioEmitter);
                            MenuManager.InGameOverlay.RecalculatePosition();
                            MenuManager.InGameOverlay.Open();
                            GameState.renderer.compile(GameState.scene, GameState.currentCamera);

                            if(GameState.module.area.MiniGame){
                              GameState.Mode = EngineMode.MINIGAME
                            }else{
                              GameState.Mode = EngineMode.INGAME;
                            }
                            
                            //console.log('inDialog', GameState.inDialog);
                            //console.log('HOLDFADE', GameState.holdWorldFadeInForDialog, GameState.inDialog);
                            
                            //console.log('runSpawnScripts', runSpawnScripts);
                            console.log('ModuleArea.initAreaObjects');
                            GameState.module.area.initAreaObjects(runSpawnScripts).then( () => {
                              console.log('ModuleArea: ready to play');
                              GameState.module.readyToProcessEvents = true;

                              if(!GameState.holdWorldFadeInForDialog)
                                FadeOverlayManager.FadeIn(1, 0, 0, 0);

                              if(GameState.Mode == EngineMode.INGAME){
              
                                let anyCanLevel = false;
                                for(let i = 0; i < PartyManager.party.length; i++){
                                  if(PartyManager.party[i].canLevelUp()){
                                    anyCanLevel = true;
                                  }
                                }
              
                                if(anyCanLevel){
                                  GameState.audioEmitter.PlaySound('gui_level');
                                }
              
                              }

                            });       
                            
                            GameState.renderer.setClearColor( new THREE.Color(GameState.module.area.SunFogColor) );
                          });

                        });

                      })

                      //console.log(module);

                      MenuManager.LoadScreen.setProgress(0);

                    });

                  });

                });
              });
            });
          });
        });
      });
    });
  }

  static UnloadModule(){
    MenuManager.ClearMenus();
    GameState.deltaTime = 0;
    // GameState.initTimers();
    ResourceLoader.clearCache();

    GameState.scene.visible = false;
    GameState.inDialog = false;
    ModuleObject.COUNT = 1;
    GameState.renderer.setClearColor(new THREE.Color(0, 0, 0));
    GameState.AlphaTest = 0;
    GameState.holdWorldFadeInForDialog = false;
    GameState.audioEngine.stopBackgroundMusic();
    GameState.audioEngine.Reset();
    CombatEngine.Reset();

    LightManager.clearLights();

    GameState.selected = undefined;
    GameState.selectedObject = undefined;
    GameState.hovered = undefined;
    GameState.hoveredObject = undefined;

    GameState.staticCameras = [];

    if(!AudioEngine.isMuted)
      AudioEngine.Mute();
  }

  static UpdateVideoEffect(){
    if(!isNaN(parseInt(GameState.videoEffect))){
      let effect = TwoDAManager.datatables.get('videoeffects').rows[GameState.videoEffect];
      if(parseInt(effect.enablesaturation)){
        GameState.saturationPass.enabled = true;
        GameState.colorPass.enabled = true;
        GameState.saturationPass.uniforms.saturation.value = parseFloat(effect.saturation);
        GameState.colorPass.uniforms.addRGB.value.set(
          parseFloat(effect.modulationred)-1,
          parseFloat(effect.modulationgreen)-1,
          parseFloat(effect.modulationblue)-1
        );
      }else{
        GameState.saturationPass.enabled = false;
        GameState.colorPass.enabled = false;
      }

      if(parseInt(effect.enablescannoise)){
        GameState.filmPass.uniforms.grayscale.value = true;
        GameState.filmPass.enabled = true;
        GameState.filmPass.uniforms.sCount.value = Math.floor(Math.random() * 256) + 250;
      }else{
        GameState.filmPass.uniforms.grayscale.value = false;
        GameState.filmPass.enabled = false;
      }

    }else{
      GameState.saturationPass.enabled = false;
      GameState.filmPass.enabled = false;
      GameState.colorPass.enabled = false;
    }
  }

  static ReloadTextureCache(){
    if(GameState.module && GameState.module.area){
      GameState.module.area.reloadTextures();
    }
  }

  static getCameraById(id = 0){
    for(let i = 0; i < GameState.staticCameras.length; i++){
      if(GameState.staticCameras[i].ingameID == id)
        return GameState.staticCameras[i];
    }

    return GameState.currentCamera;
  }

  static Update(){
    
    /*if(!GameState.visible){
      requestAnimationFrame( GameState.Update );
      return;
    }*/
    requestAnimationFrame( GameState.Update );

    if(!window.ConfigClient.get('GameState.debug.show_fps')){
      // GameState.stats.showPanel(false);
    }

    let delta = GameState.clock.getDelta();
    GameState.delta = delta;
    GameState.clampedDelta = Math.max(0, Math.min(delta, 0.016666666666666666 * 5));

    GameState.limiter.now = Date.now();
    GameState.limiter.elapsed = GameState.limiter.now - GameState.limiter.then;

    GameState.UpdateVideoEffect();
    MenuManager.Update(delta);

    if(!GameState.loadingTextures && TextureLoader.queue.length){
      GameState.loadingTextures = true;
      TextureLoader.LoadQueue( () => {
        GameState.loadingTextures = false;
      });
    } 

    GameState.scene_cursor_holder.visible = true;

    if(GameState.Mode == EngineMode.MINIGAME || (GameState.Mode == EngineMode.INGAME && !GameState.MenuActive && !MenuManager.InGameConfirm.bVisible)){
      //GameState.viewportFrustum.setFromProjectionMatrix(GameState.currentCamera.projectionMatrix);
      GameState.frustumMat4.multiplyMatrices( GameState.currentCamera.projectionMatrix, GameState.currentCamera.matrixWorldInverse )
      GameState.viewportFrustum.setFromProjectionMatrix(GameState.frustumMat4);
      GameState.updateTime(delta);

      //PartyMember cleanup
      for(let i = 0; i < GameState.group.party.children.length; i++){
        let pm = (GameState.group.party.children[i] as any).moduleObject;
        if(GameState.player != pm){
          if(PartyManager.party.indexOf(pm) == -1){
            pm.destroy();
          }
        }
      }

      if(GameState.Mode == EngineMode.MINIGAME || MenuManager.GetCurrentMenu() == MenuManager.InGameOverlay || MenuManager.GetCurrentMenu() == MenuManager.InGameDialog || MenuManager.GetCurrentMenu() == MenuManager.InGameComputer){
        if(GameState.State != EngineState.PAUSED){
          GameState.module.tick(delta);
        }else{
          GameState.module.tickPaused(delta);
        }
      }
      
      if(GameState.inDialog){
        if(MenuManager.InGameDialog.IsVisible() && !MenuManager.InGameDialog.LB_REPLIES.isVisible() && GameState.scene_cursor_holder.visible){
          GameState.scene_cursor_holder.visible = false;
        }
      }

    }

    if(GameState.Mode == EngineMode.INGAME){

      FadeOverlayManager.Update(delta);
      GameState.frustumMat4.multiplyMatrices( GameState.currentCamera.projectionMatrix, GameState.currentCamera.matrixWorldInverse )
      GameState.viewportFrustum.setFromProjectionMatrix(GameState.frustumMat4);
      if(GameState.inDialog){
        LightManager.update(delta, GameState.currentCamera);
      }else{
        LightManager.update(delta, GameState.getCurrentPlayer());
      }
      //GameState.InGameOverlay.Update(delta);
      //GameState.InGameAreaTransition.Update(delta);

      if(!GameState.inDialog){
        GameState.currentCamera = GameState.camera;
      }
      
      if(GameState.State == EngineState.PAUSED && !GameState.MenuActive){
        if(!MenuManager.InGamePause.IsVisible())
          MenuManager.InGamePause.Show();
        
        MenuManager.InGamePause.Update(delta);
      }else{
        if(MenuManager.InGamePause.IsVisible() || GameState.MenuActive)
          MenuManager.InGamePause.Hide();
      }
    }else if(GameState.Mode == EngineMode.MINIGAME){
      FadeOverlayManager.Update(delta);
      if(GameState.inDialog){
        LightManager.update(delta, GameState.currentCamera);
      }else{
        LightManager.update(delta, GameState.getCurrentPlayer());
      }
      //GameState.InGameOverlay.Hide();
    }

    if(GameState.Mode == EngineMode.INGAME){
      let obj: any;
      for(let i = 0, len = GameState.group.room_walkmeshes.children.length; i < len; i++){
        obj = GameState.group.room_walkmeshes.children[i];
        if(obj.type === 'Mesh'){
          obj.material.visible = window.ConfigClient.get('GameState.debug.show_collision_meshes');
        }
      }

      for(let i = 0, len = GameState.walkmeshList.length; i < len; i++){
        obj = GameState.walkmeshList[i];
        if(obj.type === 'Mesh'){
          obj.material.visible = window.ConfigClient.get('GameState.debug.show_collision_meshes');
        }
      }
  
      for(let i = 0, len = GameState.collisionList.length; i < len; i++){
        obj = GameState.collisionList[i];
        if(obj.type === 'Mesh'){
          obj.material.visible = false;
        }
      }
      
      for(let i = 0, len = GameState.group.path_helpers.children.length; i < len; i++){
        obj = GameState.group.path_helpers.children[i];
        if(obj){
          obj.visible = window.ConfigClient.get('GameState.debug.show_path_helpers');
        }
      }
    }

    GameState.audioEngine.Update(GameState.currentCamera.position, GameState.currentCamera.rotation);
    GameState.controls.Update(delta);
    CameraShakeManager.update(delta, GameState.currentCamera);

    GameState.updateCursorPosition();
    GameState.renderPass.camera = GameState.currentCamera;
    //GameState.renderPassAA.camera = GameState.currentCamera;
    GameState.bokehPass.camera = GameState.currentCamera;

    // render scene into target
    //GameState.renderer.setRenderTarget( GameState.depthTarget );
    //GameState.renderer.render( GameState.scene, GameState.currentCamera );
    // render post FX
    //GameState.renderer.setRenderTarget( null );

    GameState.composer.render(delta);

    if(typeof GameState.onScreenShot === 'function'){
      console.log('Screenshot', GameState.onScreenShot);
      
      GameState.renderer.clear();
      GameState.renderer.render(GameState.scene, GameState.currentCamera);

      let ssCallback = GameState.onScreenShot;
      let screenshot = new Image();
      screenshot.src = GameState.canvas.toDataURL('image/png');
      screenshot.onload = function() {
        let ssCanvas = new OffscreenCanvas(256, 256);
        let ctx = ssCanvas.getContext('2d');
        ctx.drawImage(screenshot, 0, 0, 256, 256);

        let tga = TGAObject.FromCanvas(ssCanvas);
        ssCallback(tga);
      };
      
      GameState.composer.render(delta);
      GameState.onScreenShot = undefined;
    }

    CameraShakeManager.afterRender();

    //NoClickTimer
    if( ((GameState.Mode == EngineMode.MINIGAME) || (GameState.Mode == EngineMode.INGAME)) && GameState.State != EngineState.PAUSED){
      if(GameState.noClickTimer){
        GameState.noClickTimer -= (1 * delta);
        if(GameState.noClickTimer < 0){
          GameState.noClickTimer = 0;
        }
      }
    }

    GameState.stats.update();
  }

  static updateTime(delta: number = 0){
    GameState.time += delta;
    GameState.deltaTime += delta;

    if(GameState.deltaTime > 1000)
      GameState.deltaTime = GameState.deltaTime % 1;
  }



















  public static GetObjectByTag(sTag = '', iNum = 0, oType = ModuleObjectType.ALL){

    /*ModuleObjectType.CREATURE         = 1;
    ModuleObjectType.ITEM             = 2;
    ModuleObjectType.TRIGGER          = 4;
    ModuleObjectType.DOOR             = 8;
    ModuleObjectType.AOE   = 16;
    ModuleObjectType.WAYPOINT         = 32;
    ModuleObjectType.PLACEABLE        = 64;
    ModuleObjectType.STORE            = 128;
    ModuleObjectType.ENCOUNTER        = 256;
    ModuleObjectType.SOUND            = 512;
    OBJECT_TYPE_ALL              = 32767;*/

    sTag = sTag.toLowerCase();
    let results: ModuleObject[] = [];
    let obj = undefined;
    if((oType & ModuleObjectType.PLACEABLE) == ModuleObjectType.PLACEABLE){
      for(let i = 0, len = GameState.module.area.placeables.length; i < len; i++){
        obj = GameState.module.area.placeables[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      for(let i = 0, len = GameState.module.area.creatures.length; i < len; i++){
        obj = GameState.module.area.creatures[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      for(let i = 0, len = PartyManager.party.length; i < len; i++){
        obj = PartyManager.party[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.STORE) == ModuleObjectType.STORE){
      for(let i = 0, len = GameState.module.area.stores.length; i < len; i++){
        obj = GameState.module.area.stores[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.DOOR) == ModuleObjectType.DOOR){
      for(let i = 0, len = GameState.module.area.doors.length; i < len; i++){
        obj = GameState.module.area.doors[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.TRIGGER) == ModuleObjectType.TRIGGER){
      for(let i = 0, len = GameState.module.area.triggers.length; i < len; i++){
        obj = GameState.module.area.triggers[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.WAYPOINT) == ModuleObjectType.WAYPOINT){
      for(let i = 0, len = GameState.module.area.waypoints.length; i < len; i++){
        obj = GameState.module.area.waypoints[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.SOUND) == ModuleObjectType.SOUND){
      for(let i = 0, len = GameState.module.area.sounds.length; i < len; i++){
        obj = GameState.module.area.sounds[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if((oType & ModuleObjectType.ITEM) == ModuleObjectType.ITEM){
      for(let i = 0, len = GameState.module.area.items.length; i < len; i++){
        obj = GameState.module.area.items[i];
        if(obj.getTag().toLowerCase() == sTag)
          results.push(obj);
      }
    }

    if(sTag == ''){
      return GameState.player;
    }else if(results.length){
      return results[iNum];
    }

    return undefined;

  }

  public static GetNearestObjectByTag(sTag = '', oObject: ModuleObject, iNum = 0){
    sTag = sTag.toLowerCase();
    let results: ModuleObject[] = [];
    let len = GameState.module.area.placeables.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.placeables[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.placeables[i])
          results.push(GameState.module.area.placeables[i]);
    }

    len = PartyManager.party.length;
    for(let i = 0; i < len; i++){
      if(PartyManager.party[i].getTag().toLowerCase() == sTag)
        if(oObject != PartyManager.party[i])
          results.push(PartyManager.party[i]);
    }

    len = GameState.module.area.creatures.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.creatures[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.creatures[i])
          results.push(GameState.module.area.creatures[i]);
    }

    len = GameState.module.area.items.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.items[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.items[i])
          results.push(GameState.module.area.items[i]);
    }

    len = GameState.module.area.doors.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.doors[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.doors[i])
          results.push(GameState.module.area.doors[i]);
    }

    len = GameState.module.area.triggers.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.triggers[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.triggers[i])
          results.push(GameState.module.area.triggers[i]);
    }

    len = GameState.module.area.waypoints.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.waypoints[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.waypoints[i])
          results.push(GameState.module.area.waypoints[i]);
    }

    len = GameState.module.area.sounds.length;
    for(let i = 0; i < len; i++){
      if(GameState.module.area.sounds[i].getTag().toLowerCase() == sTag)
        if(oObject != GameState.module.area.sounds[i])
          results.push(GameState.module.area.sounds[i]);
    }

    results.sort(
      function(a,b) {
        try{
          let distanceA = a.getModel().position.distanceTo(oObject.getModel().position);
          let distanceB = b.getModel().position.distanceTo(oObject.getModel().position);
          return (distanceB > distanceA) ? -1 : ((distanceA > distanceB) ? 1 : 0);
        }catch(e){
          return 0;
        }
      }
    );

    if(results.length){
      return results[iNum];
    }

    return undefined;

  }

  public static GetNearestInteractableObject(oObject?: ModuleObject){
    let results: ModuleObject[] = [];

    results = results.concat(PartyManager.party);
    results = results.concat(GameState.module.area.creatures);
    results = results.concat(GameState.module.area.doors);
    results = results.concat(GameState.module.area.placeables);

    results.sort(
      function(a,b) {
        try{
          let distanceA = a.position.distanceTo(oObject.position);
          let distanceB = b.position.distanceTo(oObject.position);
          return (distanceB > distanceA) ? -1 : ((distanceA > distanceB) ? 1 : 0);
        }catch(e){
          return 0;
        }
      }
    );

    let result = undefined;
    let count = results.length;

    for(let i = 0; i < count; i++){
      result = results[i];
      if( result != GameState.getCurrentPlayer() && result.isOnScreen() && result.isUseable() ){
        if( result.hasLineOfSight( GameState.getCurrentPlayer() ) ){
          break;
        }
      }
      result = undefined;
    }

    return result;

  }

  public static GetNearestObject(oType = 0, oObject: ModuleObject, iNum = 0){
    let results: ModuleObject[] = [];

    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      results = results.concat(GameState.module.area.creatures);
    }
    if((oType & ModuleObjectType.ITEM) == ModuleObjectType.ITEM){
      results = results.concat(GameState.module.area.items);
    }
    if((oType & ModuleObjectType.TRIGGER) == ModuleObjectType.TRIGGER){
      results = results.concat(GameState.module.area.triggers);
    }
    if((oType & ModuleObjectType.DOOR) == ModuleObjectType.DOOR){
      results = results.concat(GameState.module.area.doors);
    }
    if((oType & ModuleObjectType.AOE) == ModuleObjectType.AOE){
      //results = results.concat([]);
    }
    if((oType & ModuleObjectType.WAYPOINT) == ModuleObjectType.WAYPOINT){
      results = results.concat(GameState.module.area.waypoints);
    }
    if((oType & ModuleObjectType.PLACEABLE) == ModuleObjectType.PLACEABLE){
      results = results.concat(GameState.module.area.placeables);
    }
    if((oType & ModuleObjectType.STORE) == ModuleObjectType.STORE){
      results = results.concat(GameState.module.area.stores);
    }
    if((oType & ModuleObjectType.ENCOUNTER) == ModuleObjectType.ENCOUNTER){
      results = results.concat(GameState.module.area.encounters);
    }
    if((oType & ModuleObjectType.SOUND) == ModuleObjectType.SOUND){
      results = results.concat(GameState.module.area.sounds);
    }

    results.sort(
      function(a,b) {
        try{
          let distanceA = a.position.distanceTo(oObject.position);
          let distanceB = b.position.distanceTo(oObject.position);
          return (distanceB > distanceA) ? -1 : ((distanceA > distanceB) ? 1 : 0);
        }catch(e){
          return 0;
        }
      }
    );

    if(results.length){
      return results[iNum];
    }

    return undefined;

  }

  public static GetFirstObjectInArea(oArea = GameState.module.area, oType = 0){

    if(!(oArea instanceof ModuleArea)){
      console.error(oArea);
      oArea = GameState.module.area;
    }
      

    GameState.objSearchIndex = 0;

    let results: ModuleObject[] = [];
    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      results = results.concat(GameState.module.area.creatures);
    }
    if((oType & ModuleObjectType.ITEM) == ModuleObjectType.ITEM){
      results = results.concat(GameState.module.area.items);
    }
    if((oType & ModuleObjectType.TRIGGER) == ModuleObjectType.TRIGGER){
      results = results.concat(GameState.module.area.triggers);
    }
    if((oType & ModuleObjectType.DOOR) == ModuleObjectType.DOOR){
      results = results.concat(GameState.module.area.doors);
    }
    if((oType & ModuleObjectType.AOE) == ModuleObjectType.AOE){
      //results = results.concat([]);
    }
    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      results = results.concat(GameState.module.area.creatures);
    }
    if((oType & ModuleObjectType.WAYPOINT) == ModuleObjectType.WAYPOINT){
      results = results.concat(GameState.module.area.waypoints);
    }
    if((oType & ModuleObjectType.PLACEABLE) == ModuleObjectType.PLACEABLE){
      results = results.concat(GameState.module.area.placeables);
    }
    if((oType & ModuleObjectType.STORE) == ModuleObjectType.STORE){
      results = results.concat(GameState.module.area.stores);
    }
    if((oType & ModuleObjectType.ENCOUNTER) == ModuleObjectType.ENCOUNTER){
      results = results.concat(GameState.module.area.encounters);
    }
    if((oType & ModuleObjectType.SOUND) == ModuleObjectType.SOUND){
      results = results.concat(GameState.module.area.sounds);
    }

    if(results.length){
      return results[GameState.objSearchIndex];
    }
    return undefined;
  }

  public static GetNextObjectInArea(oArea = GameState.module.area, oType = 0){
    if(!(oArea instanceof ModuleArea)){
      console.error(oArea);
      oArea = GameState.module.area;
    }
    ++GameState.objSearchIndex;

    let results: ModuleObject[] = [];
    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      results = results.concat(GameState.module.area.creatures);
    }
    if((oType & ModuleObjectType.ITEM) == ModuleObjectType.ITEM){
      results = results.concat(GameState.module.area.items);
    }
    if((oType & ModuleObjectType.TRIGGER) == ModuleObjectType.TRIGGER){
      results = results.concat(GameState.module.area.triggers);
    }
    if((oType & ModuleObjectType.DOOR) == ModuleObjectType.DOOR){
      results = results.concat(GameState.module.area.doors);
    }
    if((oType & ModuleObjectType.AOE) == ModuleObjectType.AOE){
      //results = results.concat([]);
    }
    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){
      results = results.concat(GameState.module.area.creatures);
    }
    if((oType & ModuleObjectType.WAYPOINT) == ModuleObjectType.WAYPOINT){
      results = results.concat(GameState.module.area.waypoints);
    }
    if((oType & ModuleObjectType.PLACEABLE) == ModuleObjectType.PLACEABLE){
      results = results.concat(GameState.module.area.placeables);
    }
    if((oType & ModuleObjectType.STORE) == ModuleObjectType.STORE){
      results = results.concat(GameState.module.area.stores);
    }
    if((oType & ModuleObjectType.ENCOUNTER) == ModuleObjectType.ENCOUNTER){
      results = results.concat(GameState.module.area.encounters);
    }
    if((oType & ModuleObjectType.SOUND) == ModuleObjectType.SOUND){
      results = results.concat(GameState.module.area.sounds);
    }

    if(GameState.objSearchIndex < results.length-1){
      return results[GameState.objSearchIndex];
    }
    return undefined;
  }

  public static GetNearestCreature(nFirstCriteriaType: CreatureType, nFirstCriteriaValue: any, oTarget: ModuleObject, nNth=1, nSecondCriteriaType=-1, nSecondCriteriaValue=-1, nThirdCriteriaType=-1,  nThirdCriteriaValue=-1, list?: ModuleCreature[] ): ModuleCreature {
    
    if(!list){
      list = GameState.module.area.creatures;
      list = list.concat(PartyManager.party);
    }

    let results: ModuleCreature[] = [];
    
    switch(nFirstCriteriaType){
      case CreatureType.RACIAL_TYPE:

      break;
      case CreatureType.PLAYER_CHAR:

      break;
      case CreatureType.CLASS:

      break;
      case CreatureType.REPUTATION:
        switch(nFirstCriteriaValue){
          case ReputationType.FRIEND:
            for(let i = 0; i < list.length; i++){
              if(list[i].isFriendly(oTarget) && oTarget.hasLineOfSight(list[i])){
                results.push(list[i]);
              }
            }
          break;
          case ReputationType.ENEMY:
            for(let i = 0; i < list.length; i++){
              if(list[i].isHostile(oTarget) && oTarget.hasLineOfSight(list[i])){
                results.push(list[i]);
              }
            }
          break;  
          case ReputationType.NEUTRAL:
            for(let i = 0; i < list.length; i++){
              if(list[i].isNeutral(oTarget) && oTarget.hasLineOfSight(list[i])){
                results.push(list[i]);
              }
            }
          break;
        }
      break;
      case CreatureType.IS_ALIVE:
        for(let i = 0; i < list.length; i++){
          if(!list[i].isDead()){
            results.push(list[i]);
          }
        }
      break;
      case CreatureType.HAS_SPELL_EFFECT:

      break;
      case CreatureType.DOES_NOT_HAVE_SPELL_EFFECT:

      break;
      case CreatureType.PERCEPTION:
        for(let i = 0; i < list.length; i++){
          switch(nFirstCriteriaValue){
            case 0:// PERCEPTION_SEEN_AND_HEARD	0	Both seen and heard (Spot beats Hide, Listen beats Move Silently).
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && o.seen && o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 1:// PERCEPTION_NOT_SEEN_AND_NOT_HEARD	1	Neither seen nor heard (Hide beats Spot, Move Silently beats Listen).
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && !o.seen && !o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 2:// PERCEPTION_HEARD_AND_NOT_SEEN	2	 Heard only (Hide beats Spot, Listen beats Move Silently). Usually arouses suspicion for a creature to take a closer look.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && !o.seen && o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 3:// PERCEPTION_SEEN_AND_NOT_HEARD	3	Seen only (Spot beats Hide, Move Silently beats Listen). Usually causes a creature to take instant notice.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && o.seen && !o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 4:// PERCEPTION_NOT_HEARD 4 Not heard (Move Silently beats Listen), no line of sight.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && !o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 5:// PERCEPTION_HEARD 5 Heard (Listen beats Move Silently), no line of sight.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && o.heard ).length){
                results.push(list[i]);
              }
            break;
            case 6:// PERCEPTION_NOT_SEEN	6	Not seen (Hide beats Spot), too far away to heard or magically silcenced.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && !o.seen ).length){
                results.push(list[i]);
              }
            break;
            case 7:// PERCEPTION_SEEN	7	Seen (Spot beats Hide), too far away to heard or magically silcenced.
              if(oTarget.perceptionList.filter( (o: any) => o.object == list[i] && o.seen ).length){
                results.push(list[i]);
              }
            break;
          }

        }
      break;
    }

    if(nSecondCriteriaType >= 0){
      return GameState.GetNearestCreature(nSecondCriteriaType, nSecondCriteriaValue, oTarget, nNth, nThirdCriteriaType, nThirdCriteriaValue, -1, -1, results);
    }

    if(results.length){
      results.sort((a: any, b: any) => {
        return oTarget.position.distanceTo(a.position) - oTarget.position.distanceTo(b.position);
      });
      return results[nNth-1];
    }

    return undefined;
  }

  public static GetObjectsInShape(shape = -1, size = 1, target = new THREE.Vector3, lineOfSight = false, oType = -1, origin = new THREE.Vector3, idx = -1){

    let object_pool: ModuleObject[] = [];
    let results: ModuleObject[] = [];

    /*
    int    ModuleObjectType.CREATURE         = 1;
    int    ModuleObjectType.ITEM             = 2;
    int    ModuleObjectType.TRIGGER          = 4;
    int    ModuleObjectType.DOOR             = 8;
    int    ModuleObjectType.AOE   = 16;
    int    ModuleObjectType.WAYPOINT         = 32;
    int    ModuleObjectType.PLACEABLE        = 64;
    int    ModuleObjectType.STORE            = 128;
    int    ModuleObjectType.ENCOUNTER        = 256;
    int    ModuleObjectType.SOUND            = 512;
    int    OBJECT_TYPE_ALL              = 32767;
    */

    //console.log('GetObjectsInShape', objectFilter, shape);

    if((oType & ModuleObjectType.CREATURE) == ModuleObjectType.CREATURE){ //CREATURE
      object_pool = object_pool.concat(GameState.module.area.creatures);
    }

    if((oType & ModuleObjectType.ITEM) == ModuleObjectType.ITEM){ //ITEM
      object_pool = object_pool.concat(GameState.module.area.items);
    }

    if((oType & ModuleObjectType.TRIGGER) == ModuleObjectType.TRIGGER){ //TRIGGER
      object_pool = object_pool.concat(GameState.module.area.triggers); 
    }

    if((oType & ModuleObjectType.DOOR) == ModuleObjectType.DOOR){ //DOOR
      object_pool = object_pool.concat(GameState.module.area.doors); 
    }

    if((oType & ModuleObjectType.AOE) == ModuleObjectType.AOE){ //AOE
              
    }

    if((oType & ModuleObjectType.WAYPOINT) == ModuleObjectType.WAYPOINT){ //WAYPOINTS
      object_pool = object_pool.concat(GameState.module.area.waypoints);
    }
    
    if((oType & ModuleObjectType.PLACEABLE) == ModuleObjectType.PLACEABLE){ //PLACEABLE
      object_pool = object_pool.concat(GameState.module.area.placeables);
    }

    if((oType & ModuleObjectType.STORE) == ModuleObjectType.STORE){ //STORE
          
    }
    
    if((oType & ModuleObjectType.ENCOUNTER) == ModuleObjectType.ENCOUNTER){ //ENCOUNTER
          
    }
    
    if((oType & ModuleObjectType.SOUND) == ModuleObjectType.SOUND){ //SOUND
      object_pool = object_pool.concat(GameState.module.area.sounds);
    }

    for(let i = 0, len = object_pool.length; i < len; i++){
      if(object_pool[i] instanceof ModuleObject){
        if(object_pool[i].position.distanceTo(target) < size){
          results.push(object_pool[i]);
        }
      }
    }

    if(idx == -1){
      return results;
    }else{
      return results[idx];
    }

  }

  public static getNPCResRefById(nId: number){
    switch(nId){
      case 0:
        return 'p_bastilla'
      break;
      case 1:
        return 'p_cand'
      break;
      case 2:
        return 'p_carth'
      break;
      case 3:
        return 'p_hk47'
      break;
      case 4:
        return 'p_jolee'
      break;
      case 5:
        return 'p_juhani'
      break;
      case 6:
        return 'p_mission'
      break;
      case 7:
        return 'p_t3m4'
      break;
      case 8:
        return 'p_zaalbar'
      break;
    }
    return '';
  }

  public static isObjectPC(object: ModuleObject){
    return GameState.player === object;
  }

  public static setGlobalBoolean(name = '', value = false){
    if(GameState.Globals.Boolean.has(name.toLowerCase()))
    GameState.Globals.Boolean.get(name.toLowerCase()).value = value ? true : false;
  }

  public static getGlobalBoolean(name = ''){
    if(GameState.Globals.Boolean.has(name.toLowerCase()))
      return GameState.Globals.Boolean.get(name.toLowerCase()).value ? true : false;

    return false;
  }

  public static setGlobalNumber(name:string = '', value:number = 0){
    if(GameState.Globals.Number.has(name.toLowerCase()))
    GameState.Globals.Number.get(name.toLowerCase()).value = Math.floor(value);
  }

  public static getGlobalNumber(name:string = ''){
    if(GameState.Globals.Number.has(name.toLowerCase()))
      return GameState.Globals.Number.get(name.toLowerCase()).value;

    return 0;
  }

  public static setGlobalLocation(name = '', value = new EngineLocation){
    if(GameState.Globals.Location.has(name.toLowerCase()) && value instanceof EngineLocation)
    GameState.Globals.Location.get(name.toLowerCase()).value = value;
  }

  public static getGlobalLocation(name = ''){
    if(GameState.Globals.Location.has(name.toLowerCase()))
      return GameState.Globals.Location.get(name.toLowerCase()).value;

    return new EngineLocation;
  }

  public static async InitializeGameState(options: GameStateInitializeOptions = {} as GameStateInitializeOptions){
    const _default = {
      Game: GameEngineType.KOTOR,
      Env: GameEngineEnv.NODE,
    } as GameStateInitializeOptions;
    options = {..._default, ...options};

    GameState.GameKey = options.Game;

  }

}
