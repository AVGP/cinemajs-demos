/* jshint asi:true */
var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
var players = {},
    plane = null,
    goal = new THREE.Mesh(new THREE.IcosahedronGeometry(10), new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.75,
      shininess: 100,
      color: 0xff0000
    })),
    scores = {}

var renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
scene.add(new THREE.AmbientLight(0xffffff))

goal.position.set(100, 50, 100)
scene.add(goal)

camera.rotation.x = -Math.PI/2
camera.position.set(-50, 350, -30)

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
    setupWorld()
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
  })
})


function setupWorld() {
  var sky = new THREE.Mesh(
    new THREE.BoxGeometry(1000, 1000, 1000),
    new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 0x88ccff})
  )
  scene.add(sky)
  var loader = document.getElementById('loading')
  loader.parentNode.removeChild(loader)
  document.getElementById('content').style.display = 'block'
  document.body.appendChild(renderer.domElement)

  var list = document.querySelector('ol')
  ws = new WebSocket(window.location.href.replace(window.location.protocol, 'ws:'))
  ws.onmessage = function(evt) {
    var msg = JSON.parse(evt.data)
    switch(msg.type) {
      case 'JOIN':
        players[msg.name] = new THREE.Object3D()
        players[msg.name].add(plane.clone())
        players[msg.name].position.fromArray(msg.position)
        players[msg.name].rotation.fromArray(msg.rotation)
        scores[msg.name] = 0
        updatePlayerRanking()
        scene.add(players[msg.name])
      break
      case 'POSITION':
        if(!players[msg.name]) return
        players[msg.name].position.fromArray(msg.position)
        players[msg.name].rotation.fromArray(msg.rotation)
      break
      case 'GOALPOSITION':
        goal.position.fromArray(msg.position)
      break
      case 'SCORE':
        scores[msg.name] = msg.score
        updatePlayerRanking()
      break
    }
  }
}

function updatePlayerRanking() {
  var list = document.querySelector('ol')
  list.innerHTML = ''

  Object.keys(scores)
  .map(function(playerName) { return {name: playerName, score: scores[playerName]} })
  .sort(function(a, b) { return a.score > b.score })
  .map(function(player) {
    return player.name + ' (' + player.score + ')'
  }).forEach(function(itemText) {
    var li = document.createElement('li')
    li.textContent = itemText
    list.appendChild(li)
  })
}

function draw() {
  requestAnimationFrame(draw)
  renderer.render(scene, camera)
}

draw()
