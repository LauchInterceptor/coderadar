import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import * as THREE from 'three';
import {Scene, WebGLRenderer} from 'three';
import * as TWEEN from '@tweenjs/tween.js';

import {Subscription} from 'rxjs';
import {OrbitControls} from 'three-orbitcontrols-ts';
import {AbstractView} from '../view/abstract-view';
import {SplitView} from '../view/split-view';
import {MergedView} from '../view/merged-view';
import {IFilter} from '../../interfaces/IFilter';
import {InteractionHandler} from '../interaction-handler/interaction-handler';
import {VisualizationConfig} from '../../VisualizationConfig';
import {INode} from '../../interfaces/INode';
import {FocusService} from '../../service/focus.service';
import {TooltipService} from '../../service/tooltip.service';
import {IMetricMapping} from '../../interfaces/IMetricMapping';
import {ComparisonPanelService} from '../../service/comparison-panel.service';
import {ScreenType} from '../../enum/ScreenType';
import {ViewType} from '../../enum/ViewType';
import {BlockConnection} from '../../geometry/block-connection';
import {NodeType} from '../../enum/NodeType';
import {ElementAnalyzer} from '../../helper/element-analyzer';
import {translateStatement} from "@angular/compiler-cli/src/ngtsc/translator";

@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.scss']
})
export class ScreenComponent implements OnInit, OnChanges, OnDestroy {

  @Input() screenType: ScreenType;
  @Input() activeViewType: ViewType;
  @Input() activeFilter: IFilter;
  @Input() metricTree: INode;
  @Input() metricMapping: IMetricMapping;

  subscriptions: Subscription[] = [];
  renderer: WebGLRenderer;
  scene: Scene = new Scene();
  // (see https://github.com/nicolaspanel/three-orbitcontrols-ts/issues/1)
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  interactionHandler: InteractionHandler;

  // use THREE.PerspectiveCamera instead of importing PerspectiveCamera to avoid warning for panning and zooming are disabled
  view: AbstractView;
  private isMergedView = false;
  private requestAnimationFrameId: number;
  private renderingIsPaused = false;

  constructor(
    private focusService: FocusService,
    private tooltipService: TooltipService,
    private comparisonPanelService: ComparisonPanelService
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.activeViewType !== null && this.metricTree !== null && this.activeFilter !== null) {
      this.isMergedView = this.activeViewType === ViewType.MERGED;
      this.interactionHandler.setIsMergedView(this.isMergedView);

      if (this.isMergedView) {
        this.view = new MergedView(this.screenType, this.metricMapping);
        if (this.screenType === ScreenType.RIGHT) {
          this.pauseRendering();
        }
        document.querySelector('#stage').classList.remove('split');

      } else {
        this.view = new SplitView(this.screenType, this.metricMapping);
        if (this.screenType === ScreenType.RIGHT) {
          this.resumeRendering();
        }
        document.querySelector('#stage').classList.add('split');
      }


      this.resetScene();
      this.prepareView(this.metricTree);
      this.applyFilter(this.activeFilter);
      this.handleViewChanged();
    }

    if (
      changes.metricTree
      && changes.metricTree.currentValue
      && ElementAnalyzer.hasMetricValuesForCurrentCommit(
      changes.metricTree.currentValue,
      this.activeViewType === ViewType.MERGED,
      this.screenType
      )
    ) {
      this.resetCamera();
      this.resetControls();
    }
  }

  ngOnInit() {
    this.view = new SplitView(this.screenType, this.metricMapping);

    this.createCamera();
    this.createControls();
    this.createLight();
    this.createRenderer();
    this.createInteractionHandler();

    this.initializeEventListeners();

    this.render();

    this.subscriptions.push(
      this.focusService.elementFocussed$.subscribe((elementName) => {
        this.focusElementByName(elementName);
        this.comparisonPanelService.show({
          elementName,
          foundElement: ElementAnalyzer.findElementByName(this.metricTree, elementName)
        });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  createRenderer() {
    this.renderer = new WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    this.renderer.setClearColor(0xf0f0f0);
    this.renderer.setSize(this.getScreenWidth() - 0, window.innerHeight);

    if(this.renderer.extensions.get('ANGLE_instanced_arrays') === null){
      console.debug("GPU Instancing not supported");
    }else{
      console.debug("GPU Instancing is supported");
    }


    document.querySelector('#stage').appendChild(this.renderer.domElement);
  }

  updateRenderer() {
    this.renderer.setSize(this.getScreenWidth() - 0, window.innerHeight);
  }

  createLight() {
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      (this.getScreenWidth() - 0) / window.innerHeight,
      VisualizationConfig.CAMERA_NEAR,
      VisualizationConfig.CAMERA_FAR
    );
    this.scene.add(this.camera);
  }

  updateCamera() {
    this.camera.aspect = (this.getScreenWidth() - 0) / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  resetCamera() {
    const root = this.view.getObjectByName('root');
    // pythagoras
    var rootScale = this.view.getObjectScale(root);
    const diagonal = Math.sqrt(Math.pow(rootScale[0], 2) + Math.pow(rootScale[2], 2));
    this.camera.position.x = rootScale[0] * 2;
    this.camera.position.y = diagonal * 1.5;
    this.camera.position.z = rootScale[2] * 2;
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, document.querySelector('#stage') as HTMLElement);
  }

  resetControls() {
    const centralCoordinates = this.getCentralCoordinates();
    this.controls.target.x = centralCoordinates.x;
    this.controls.target.y = centralCoordinates.y;
    this.controls.target.z = centralCoordinates.z;
  }

  render() {
    this.requestAnimationFrameId = requestAnimationFrame(() => {
      this.render();
    });

    this.controls.update();
    this.objectPicking()
    this.renderer.setRenderTarget(null);
    var date = new Date();
    var tStartRender = date.getMilliseconds();
    this.renderer.render(this.scene, this.camera);
    var tEndRender = date.getMilliseconds();
    var tRender = tEndRender - tStartRender;
    console.log("Took "+tRender+"ms to render");
    this.interactionHandler.update(this.camera);
    TWEEN.update();
  }

  objectPicking(){

  }

  pauseRendering() {
    if (this.requestAnimationFrameId) {
      cancelAnimationFrame(this.requestAnimationFrameId);
      this.resetScene();
      this.renderingIsPaused = true;
    }
  }

  resumeRendering() {
    if (this.renderingIsPaused) {
      this.render();
      this.renderingIsPaused = false;
    }
  }

  prepareView(metricTree) {
    if (metricTree.children.length === 0) {
      return;
    }
    this.view.setMetricTree(metricTree);
    this.view.recalculate();
    this.scene.add(this.view.getInstancedMesh());

    if (this.view instanceof MergedView) {
      this.view.calculateConnections(this.scene);
      this.view.getConnections().forEach((blockConnection: BlockConnection) => {
        this.scene.add(blockConnection.getCurve());
      });
    }
  }

  createInteractionHandler() {
    this.interactionHandler = new InteractionHandler(
      this.scene,
      this.renderer,
      this.isMergedView,
      this.focusService,
      this.tooltipService
    );
  }

  resetScene() {
    this.view.resetScene();
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const child = this.scene.children[i];

      // only remove Blocks and Lines. Don't remove lights, cameras etc.
      if (child.type === 'Mesh' || child.type === 'Line') {
        this.scene.remove(child);
      }
    }
  }

  focusElementByName(elementName) {
    const element = this.view.getObjectByName(elementName);
    var elementPosition = this.view.getObjectPosition(element);
    var elementScale = this.view.getObjectScale(element);
    if (!element) {
      return;
    }

    const root = this.view.getObjectByName('root');

    var rootScale = this.view.getObjectScale(root);
    // pythagoras
    const diagonal = Math.sqrt(Math.pow(rootScale[0], 2) + Math.pow(rootScale[2], 2));

    new TWEEN.Tween(this.camera.position)
      .to({
        x: elementPosition[0] + rootScale[0] / 5,
        y: elementPosition[1] + diagonal / 5,
        z: elementPosition[2] + rootScale[2] / 5
      }, VisualizationConfig.CAMERA_ANIMATION_DURATION)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();

    new TWEEN.Tween(this.controls.target)
      .to({
        x: elementPosition[0] + elementScale[0] / 2,
        y: elementPosition[1],
        z: elementPosition[2] + elementScale[2] / 2
      }, VisualizationConfig.CAMERA_ANIMATION_DURATION)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();
  }

  private getCentralCoordinates() {
    const root = this.view.getObjectByName('root');
    var rootScale = this.view.getObjectScale(root);
    if (root==-1) {
      console.warn(`no root found in screen #${this.screenType}`);
      return;
    }

    return {
      x: rootScale[0] / 2,
      y: 0,
      z: rootScale[2] / 2
    };
  }

  private getScreenWidth() {
    if (this.isMergedView) {
      return window.innerWidth;
    }
    return window.innerWidth / 2;
  }

  private initializeEventListeners() {
    window.addEventListener('resize', this.handleViewChanged.bind(this), false);
  }

  private handleViewChanged() {
    this.updateCamera();
    this.updateRenderer();
  }

  private applyFilter(activeFilter: IFilter) {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const node = this.scene.children[i];
      if (node.userData && (node.userData.type === NodeType.FILE || node.userData.type === NodeType.CONNECTION)) {
        node.visible = true;

        if (
          activeFilter.unmodified === false
          && node.userData.changeTypes
          && node.userData.changeTypes.modified === false
          && node.userData.changeTypes.deleted === false
          && node.userData.changeTypes.added === false
          && node.userData.changeTypes.renamed === false
        ) {
          node.visible = false;
        }

        if (activeFilter.modified === false && node.userData.changeTypes && node.userData.changeTypes.modified === true) {
          node.visible = false;
        }

        if (activeFilter.deleted === false && node.userData.changeTypes && node.userData.changeTypes.deleted === true) {
          node.visible = false;
        }

        if (activeFilter.added === false && node.userData.changeTypes && node.userData.changeTypes.added === true) {
          node.visible = false;
        }

        if (activeFilter.renamed === false && node.userData.changeTypes && node.userData.changeTypes.renamed === true) {
          node.visible = false;
        }
      }
    }
  }
}
