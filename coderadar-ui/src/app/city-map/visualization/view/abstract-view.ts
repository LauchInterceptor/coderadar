import {INode} from '../../interfaces/INode';
import {IPackerElement} from '../../interfaces/IPackerElement';
import {VisualizationConfig} from '../../VisualizationConfig';
import {
  InstancedBufferAttribute, InstancedBufferGeometry, Vector3,
  Mesh, Color,
  Material, ShaderMaterial, BoxBufferGeometry, ShaderMaterialParameters,REVISION
} from 'three';
import {IMetricMapping} from '../../interfaces/IMetricMapping';
import {ScreenType} from '../../enum/ScreenType';
import {NodeType} from '../../enum/NodeType';
import {CommitReferenceType} from '../../enum/CommitReferenceType';
import {ElementAnalyzer} from '../../helper/element-analyzer';
import {buffer} from "rxjs/operators";

declare var GrowingPacker: any;

export abstract class AbstractView {

  rootNode: INode;
  blockElements: Mesh[] = [];
  userData: any[] = [];
  //Instancing Attributes
  blockPositions: number[] = [];
  blockScales: number[] = [];
  blockColors: number[] = [];

  packer = new GrowingPacker();

  minModuleLevel = 1;
  maxModuleLevel: number;

  geometry: InstancedBufferGeometry;
  blockMaterial:Material ;
  pickMaterial:Material;
  blockMesh: Mesh;

  vertexShaderSource: string =
    "attribute vec3 instancePosition;\n" +
    "attribute vec3 instanceScale;\n" +
    "attribute vec3 instanceColor;\n" +
    "attribute float instanceID;\n" +
    //"uniform float numberOfInstances;\n" +
    "\n" +
    "varying vec3 vColor;\n" +
    "\n" +
    "vec3 applyTRS(vec3 position,vec3 translation, vec3 scale ) {\n" +
    "\tposition*=scale;\n" +
    "\treturn position+translation;\n" +
    "\n" +
    "}\n" +
    "\n" +
    "void main(){\n" +
    "\n" +
    "#ifdef PICKING\n" +
    "\tvColor = instanceColor\n" +
    "#else\n" +
    "\tvColor = instanceColor;\n"+//*(instanceID/numberOfInstances);\n" +
    "#endif\n" +
    "\n" +
    "\tvec3 transformed = applyTRS(position,instancePosition, instanceScale );\n" +
    "\n" +
    "\tgl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );\n" +
    "\n" +
    "}";
  fragmentShaderSource: string =
    "\t\tprecision highp float;\n" +
    "\t\tvarying vec3 vColor;\n" +
    "\n" +
    "\t\tvoid main() {\n" +
    "\n" +
    "\t\t\tgl_FragColor = vec4( vColor, 1.0 );\n" +
    "\n" +
    "\t\t}\n";

  constructor(protected screenType: ScreenType, protected metricMapping: IMetricMapping) {
    this.initMaterial();
  }

  initMaterial(){
    this.blockMaterial = new ShaderMaterial(
      {
        //uniforms:{numberOfInstances:{value:100.0}},
        vertexShader:this.vertexShaderSource,
        fragmentShader:this.fragmentShaderSource
      }
    );
    this.blockMaterial.name = "Instanced Shader Material";
    this.pickMaterial  = new ShaderMaterial(
      {
        //uniforms:{numberOfInstances:{value:100}},
        vertexShader:"define"+this.vertexShaderSource,
        fragmentShader:this.fragmentShaderSource
      }
    );
  }

  initMesh(){
    if(!(this.geometry == null)){
      this.geometry.dispose();
    }
    var bufferGeometry = new BoxBufferGeometry(1,1,1);
    this.geometry = new InstancedBufferGeometry();
    this.geometry.index = bufferGeometry.index;
    this.geometry.attributes.position = bufferGeometry.attributes.position;
    this.geometry.translate(0.5,0.5,0.5);
    //Attributes
    //Position
    this.geometry.addAttribute('instancePosition',new InstancedBufferAttribute(new Float32Array(this.blockPositions),3));
    //Scale
    this.geometry.addAttribute('instanceScale',new InstancedBufferAttribute(new Float32Array(this.blockScales),3));
    //Color
    this.geometry.addAttribute('instanceColor',new InstancedBufferAttribute(new Float32Array(this.blockColors),3));

    this.geometry.addAttribute('instanceID',new InstancedBufferAttribute(new Int32Array(this.blockScales.length),1));
    //TODO add instance id to shader

    this.blockMesh = new Mesh(this.geometry,this.blockMaterial);
    this.blockMesh.name = "Instanced Mesh";
  }

  setMetricTree(root: INode) {
    this.rootNode = root;
  }

  private updateUniforms(){
    this.blockMaterial.setValues({
      uniforms:{
        //numberOfInstances:{value:this.userData.length}
      }
    } as ShaderMaterialParameters);
  }

  recalculate() {
    if (!this.rootNode) {
      throw new Error(`rootNode is not defined!`);
    }

    this.maxModuleLevel = ElementAnalyzer.getMaxModuleLevel(this.rootNode);

    this.calculateGroundAreas([this.rootNode]);
    this.calculateElements([this.rootNode], null, 0);
    //this.updateUniforms();
    this.initMesh();
    //console.log("Debug Data\nMesh:"+this.blockMesh.name+"\nMaterial:"+this.blockMaterial.name+"\nPositions:"+this.blockPositions+"\nScales:"+this.blockScales+"\nColors:"+this.blockColors);
  }

  calculateGroundAreas(nodes: INode[]) {
    if (!Array.isArray(nodes)) {
      nodes = [nodes];
    }

    for (const node of nodes) {
      const element: IPackerElement = {w: 0, h: 0};

      if (node.type === NodeType.FILE) {
        const edgeLength = this.getEdgeLength(node.commit1Metrics, node.commit2Metrics);
        if (!edgeLength) {
          element.w = element.h = 0;
        } else {
          element.w = edgeLength * VisualizationConfig.EDGE_LENGTH_FACTOR + 2 * VisualizationConfig.BLOCK_SPACING;
          element.h = edgeLength * VisualizationConfig.EDGE_LENGTH_FACTOR + 2 * VisualizationConfig.BLOCK_SPACING;
        }
      }

      // recursion
      if (node.children && node.children.length > 0) {
        const result = this.calculateGroundAreas(node.children);
        element.w = result.w + 2 * VisualizationConfig.BLOCK_SPACING;
        element.h = result.h + 2 * VisualizationConfig.BLOCK_SPACING;
      }

      node.packerInfo = element;
    }

    nodes.sort((a, b) => {
      return b.packerInfo.w - a.packerInfo.w;
    });

    this.packer.fit(nodes.map(node => node.packerInfo));
    return {
      packer: this.packer.root,
      w: this.packer.root.w,
      h: this.packer.root.h
    };
  }

  abstract calculateElements(nodes: INode[], parent: INode, bottom: number);

  createBlock(
    node: INode,
    parent: INode,
    color: Color,
    edgeLength: number,
    bottom: number,
    height: number,
    isTransparent: boolean,
    metrics?: any,
    commitType?: CommitReferenceType,
    changeTypes?: any
  ) {
    let finalX;
    let finalY;
    let finalZ;
    let finalWidth;
    let finalHeight;
    let finalDepth;

    finalX = node.packerInfo.fit.x + (parent ? parent.packerInfo.renderedX : 0) + VisualizationConfig.BLOCK_SPACING;
    finalY = bottom;
    finalZ = node.packerInfo.fit.y + (parent ? parent.packerInfo.renderedY : 0) + VisualizationConfig.BLOCK_SPACING;

    // save the rendered positions to draw children relative to their parent
    node.packerInfo.renderedX = finalX;
    node.packerInfo.renderedY = finalZ;

    finalWidth = node.type === NodeType.FILE ? edgeLength : node.packerInfo.w - 2 * VisualizationConfig.BLOCK_SPACING;
    finalHeight = height;
    finalDepth = node.type === NodeType.FILE ? edgeLength : node.packerInfo.h - 2 * VisualizationConfig.BLOCK_SPACING;

    this.userData.push(this.createUserData(node, parent, bottom, isTransparent, metrics, commitType, changeTypes));

    //this.blockElements.push(cube);
    this.blockPositions.push(finalX,finalY,finalZ);
    this.blockScales.push(finalWidth,finalHeight,finalDepth);
    var finalColor = color;
    this.blockColors.push(finalColor.r,finalColor.g,finalColor.b);
  }

  createUserData(
    node: INode,
    parent: INode,
    bottom: number,
    isTransparent: boolean,
    metrics: any,
    commitType?: CommitReferenceType,
    changeTypes?: any
  ) {
    return {
      parentName: parent ? parent.name : undefined,
      bottom,
      metrics,
      type: node.type,
      elementName: node.name,
      isHelper: isTransparent,
      commitType,
      changeTypes
    };
  }

  getBlockElements(): Mesh[] {
    return this.blockElements;
  }

  getInstancedMesh(): Mesh{
    return this.blockMesh;
  }

  getObjectByName(name:string): number{
    for(var i=0;i<this.userData.length;i++){
      if(this.userData[i]["elementName"]==name){
        return i;
      }
    }
    return -1;
  }

  getObjectPosition(id:number):number[]{
    return this.blockPositions.slice(id*3,id*3+3);
  }

  getObjectScale(id:number):number[]{
    return this.blockScales.slice(id*3,id*3+3);
  }

  getObjectColor(id:number):number[]{
    return this.blockColors.slice(id*3,id*3+3);
  }

  private getEdgeLength(commit1Metrics: any, commit2Metrics: any): number {
    const groundAreaValue = ElementAnalyzer.getMaxMetricValueByMetricName(
      commit1Metrics,
      commit2Metrics,
      this.metricMapping.groundAreaMetricName
    );
    return Math.sqrt(groundAreaValue);
  }

  resetScene() {
    this.blockPositions = [];
    this.blockScales = [];
    this.blockColors = [];
    this.blockColors = [];
  }
}
