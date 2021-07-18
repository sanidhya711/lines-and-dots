import * as THREE from 'https://cdn.skypack.dev/three@0.130.1';

// (function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

noise.seed(Math.random());

// var gui = new dat.GUI();
var debugParams = {noOfPoints: 75};
// gui.add(debugParams,"noOfPoints",1,100,1).onFinishChange(addPoints);

var scene,camera,renderer,composer;
var getCursorHelper;

function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({precision:"lowp",antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // invisible plain to get cursor position in 3d space
    getCursorHelper = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(10,10),
        new THREE.MeshBasicMaterial()
    );

    getCursorHelper.translateZ(0.001);

    getCursorHelper.visible = false;
    scene.add(getCursorHelper)
}

var points;
var drawnLines = [];
var verticies;
var pointShaderMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    precision:"lowp",
    vertexShader: document.getElementById("pointVertexShader").innerText,
    fragmentShader: document.getElementById("pointFragmentShader").innerText,
});

function addPoints(value){
    //remove stuff if it was already in da scene
    if(points){
        points.material.dispose();
        points.geometry.dispose();
        scene.remove(points);
    }
    if(drawnLines){
        for (let index = 0; index < drawnLines.length; index++) {
            scene.remove(drawnLines[index]);
        }
        drawnLines = [];
    }

    var pointGeometry = new THREE.BufferGeometry();
    verticies = new Float32Array(value * 3);

    for(let index = 0; index < verticies.length; index += 3) {
        verticies[index] = (Math.random() - 0.5) * 7;   
        verticies[index+1] = (Math.random() - 0.5) * 4; 
        0
    }

    pointGeometry.setAttribute('position',new THREE.BufferAttribute(verticies,3));

    points = new THREE.Points(pointGeometry,pointShaderMaterial);
    scene.add(points);
}

var saveLineColors = {};
function drawLines(){

    for (let index = 0; index < drawnLines.length; index++){
        drawnLines[index].material.dispose();
        drawnLines[index].geometry.dispose();
        scene.remove(drawnLines[index]);
    }

    drawnLines = [];
    var discardColorsOfBrokenLinesTEMP = {};

    for (let index = 0; index < verticies.length; index = index + 3){
        var main = new THREE.Vector3(verticies[index],verticies[index+1],verticies[index+2]);
        for (let j = index + 3; j < verticies.length; j = j + 3){
            var toCheck = new THREE.Vector3(verticies[j],verticies[j+1],verticies[j+2]);
            var distance = main.distanceTo(toCheck);
            if(distance < 0.8 && distance > 0.2){
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([main,toCheck]);
                var color = saveLineColors['a'+index+'b'+j] ?? Math.random() * 0xffffff;
                var line = new THREE.Line(lineGeometry,new THREE.MeshBasicMaterial({color}));
                scene.add(line);
                drawnLines.push(line);
                discardColorsOfBrokenLinesTEMP['a'+index+'b'+j] = color;
            }
        }
    }

    saveLineColors = {...discardColorsOfBrokenLinesTEMP};
}

var userPoint;
const raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector3();
var tempLines = [];
var intersects;
var cursorShaderMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    precision:"lowp",
    vertexShader: document.getElementById("cursorVertexShader").innerText,
    fragmentShader: document.getElementById("cursorFragmentShader").innerText,
    uniforms: {
        uColor: { value: new THREE.Color("pink") }
    }
});

function onMouseMove(eve){
    if(userPoint){
        userPoint.material.dispose();
        userPoint.geometry.dispose();
        scene.remove(userPoint);
    }

    mouse.x = (eve.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - ( eve.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse,camera);
    intersects = raycaster.intersectObject(getCursorHelper)[0];
   
    if(!intersects){
        return;
    }

    var userPointGeomtery =  new THREE.BufferGeometry().setFromPoints([intersects.point]);
    userPoint = new THREE.Points(userPointGeomtery,cursorShaderMaterial);
    scene.add(userPoint);
}

var saveUserLineColors = {};
function drawLinesToUserPoint(){

    for(let index = 0; index < tempLines.length; index++){
        tempLines[index].material.dispose();
        tempLines[index].geometry.dispose();
        scene.remove(tempLines[index]);
    }

    tempLines = [];
    var discardColorsOfBrokenLinesTEMP = {};

    //draw lines to user point
    if(intersects){
        for(let index = 0; index < verticies.length; index += 3){
            var toCheck = new THREE.Vector3(verticies[index],verticies[index+1],verticies[index+2]);
            var distance = intersects.point.distanceTo(toCheck);
            if(distance < 0.8 && distance > 0.2){
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([intersects.point,toCheck]);
                var color = saveUserLineColors['a'+-1+'b'+index] ?? Math.random() * 0xffffff;
                var line = new THREE.Line(lineGeometry,new THREE.MeshBasicMaterial({color}));
                scene.add(line);
                tempLines.push(line);
                discardColorsOfBrokenLinesTEMP['a'+-1+'b'+index] = color;
            }
        }
    }

    saveUserLineColors = {...discardColorsOfBrokenLinesTEMP};
}

function mouseOut(){
    // cursor left the screen so deleteing everything related to cursor and sursor lines
    intersects = null;

    if(userPoint){
        userPoint.material.dispose();
        userPoint.geometry.dispose();
        scene.remove(userPoint);
    }
    for(let index = 0; index < tempLines.length; index++){
        tempLines[index].material.dispose();
        tempLines[index].geometry.dispose();
        scene.remove(tempLines[index]);
    }
    tempLines = [];
}

function windowResized(){
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}


var clock = new THREE.Clock();
function render(){   
    var elapsedTime = clock.getElapsedTime();

    for (let index = 0; index < points.geometry.attributes.position.array.length; index+=3) {
        var offsetWithnNoise = noise.simplex3(points.geometry.attributes.position.array[index],points.geometry.attributes.position.array[index+1],elapsedTime * 0.1) / 100;
        points.geometry.attributes.position.array[index] += offsetWithnNoise;
        points.geometry.attributes.position.array[index+1] += offsetWithnNoise;
    }
    points.geometry.attributes.position.needsUpdate = true;

    drawLines();
    drawLinesToUserPoint();

    renderer.render(scene,camera);
    requestAnimationFrame(render);
}

init();
addPoints(debugParams.noOfPoints);
drawLines();
render();
document.addEventListener("mousemove",onMouseMove);
window.addEventListener("resize",windowResized);
document.onmouseout = mouseOut;;

