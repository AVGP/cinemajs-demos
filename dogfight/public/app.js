/* jshint asi:true */
var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
var plane = null,
    player = new THREE.Object3D(),
    enemies = [],
    goal = new THREE.Mesh(new THREE.IcosahedronGeometry(10), new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.75,
      shininess: 100,
      color: 0xff0000
    }))
var renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
scene.add(new THREE.AmbientLight(0xffffff))

goal.position.set(100, 50, 100)
scene.add(goal)

var sun = new THREE.PointLight(0xffffff, 2.0, 1000, 2)
sun.position.set(0, 200, 0)
scene.add(sun)

new THREE.MTLLoader().load('landscape.mtl', function(materials) {
  materials.preload()
  var loader = new THREE.OBJLoader()
  loader.setMaterials(materials)
  loader.load('landscape.obj', function(landscape) {
    landscape.position.set(0, -50, 0)
    landscape.scale.set(50, 50, 50)
    scene.add(landscape)
  })
})

new THREE.MTLLoader().load('plane.mtl', function(materials) {
  materials.preload()
  var loader = new THREE.OBJLoader()
  loader.setMaterials(materials)
  loader.load('plane.obj', function(object) {
    object.rotation.set(0, Math.PI, 0)
    object.scale.set(0.05, 0.05, 0.05)
    plane = object
    setupWorld()
  })
})


document.querySelector('button').addEventListener('click', function() {
  document.getElementById('content').innerHTML = ''
  document.body.appendChild(renderer.domElement)
})

function setupWorld() {
  var sky = new THREE.Mesh(
    new THREE.BoxGeometry(1000, 1000, 1000),
    new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 0x88ccff})
  )
  scene.add(sky)
  var playerPlane = plane.clone()
  playerPlane.position.set(0, -7, -15)
  player.rotation.order = 'YXZ'
  player.add(playerPlane)
  player.add(camera)
  scene.add(player)
  var loader = document.getElementById('loading')
  loader.parentNode.removeChild(loader)
  document.getElementById('content').style.display = 'block'

  window.addEventListener('keydown', function(evt) {
    switch(evt.keyCode) {
      case 37:
        player.rotation.y += Math.PI / 200
      break
      case 38:
        player.rotation.x -= Math.PI / 200
      break
      case 39:
        player.rotation.y -= Math.PI / 200
      break
      case 40:
        player.rotation.x += Math.PI / 200
      break
      case 32:
        console.log('boom')
      break
    }
    evt.preventDefault()
    evt.stopPropagation()
    return false
  })

}

function draw() {
  requestAnimationFrame(draw)
  renderer.render(scene, camera)
  player.translateZ(-0.2)

  if(player.position.y < -50) {
    player.position.set(0, 0, 0)
  }
}

draw()
