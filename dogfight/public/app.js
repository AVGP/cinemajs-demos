/* jshint asi:true */
var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
var plane = null, ws = null, playerName = '', isWsReady = false,
    player = new THREE.Object3D(),
    enemies = {},
    goal = new THREE.Mesh(new THREE.IcosahedronGeometry(10), new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.75,
      shininess: 100,
      color: 0xff0000
    })),
    baseOrientation = null
var renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
scene.add(new THREE.AmbientLight(0xffffff))

goal.position.set(100, 50, 100)
goal.bbox = new THREE.Box3().setFromObject(goal)
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
  playerName = document.querySelector('#playername').value
  if(!playerName) return
  document.getElementById('content').innerHTML = ''
  document.body.appendChild(renderer.domElement)

  ws = new WebSocket(window.location.href.replace(window.location.protocol, 'ws:'))
  ws.onopen = function() {
    ws.send(JSON.stringify({
      type: 'JOIN',
      name: playerName,
      position: player.position.toArray(),
      rotation: player.rotation.toArray()
    }))
    isWsReady = true
  }
  ws.onmessage = function(evt) {
    var msg = JSON.parse(evt.data)
    switch(msg.type) {
      case 'JOIN':
        enemies[msg.name] = plane.clone()
        enemies[msg.name].position.fromArray(msg.position)
        enemies[msg.name].rotation.fromArray(msg.rotation)
        scene.add(enemies[msg.name])
      break
      case 'POSITION':
        if(!enemies[msg.name]) return
        enemies[msg.name].position.fromArray(msg.position)
        enemies[msg.name].rotation.fromArray(msg.rotation)
      break
      case 'GOALPOSITION':
        goal.position.fromArray(msg.position)
        goal.bbox.setFromObject(goal)
      break
      case 'SCORE':
        if(msg.name === playerName) {
          document.getElementById('score').textContent = 'Score: ' + msg.score
        }
      break
    }
  }

  var touchStartPos = []
  window.addEventListener('touchstart', function(evt) {
    touchStartPos = [ evt.touches[0].screenX, evt.touches[0].screenY ]
    evt.preventDefault()
    evt.stopPropagation()
    return false
  }, true)
  window.addEventListener('touchmove', function(evt) {
    player.rotation.x -= (touchStartPos[1] - evt.touches[0].screenY) / (window.innerWidth * Math.PI)
    player.rotation.y += (touchStartPos[0] - evt.touches[0].screenX) / (window.innerHeight * Math.PI * 2)
    evt.preventDefault()
    evt.stopPropagation()
    return false
  }, true)

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
    }
    evt.preventDefault()
    evt.stopPropagation()
    return false
  })

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })
})

function setupWorld() {
  var sky = new THREE.Mesh(
    new THREE.BoxGeometry(1000, 1000, 1000),
    new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 0x88ccff})
  )
  scene.add(sky)
  var playerPlane = plane.clone()
  playerPlane.position.set(0, -7, -15)
  camera.add(playerPlane)
  player = camera
  player.bbox = new THREE.Box3().setFromObject(player)
  player.rotation.order = 'YXZ'
  scene.add(player)
  player.position.set(Math.random() * 300 - 150, Math.random() * 100 + 50, Math.random() * 300 - 150)
  player.lookAt(new THREE.Vector3(0, 0, 0))
  var loader = document.getElementById('loading')
  loader.parentNode.removeChild(loader)
  document.getElementById('content').style.display = 'block'
  draw()
}

function draw() {
  requestAnimationFrame(draw)
  renderer.render(scene, camera)
  player.translateZ(-0.2)
  if(isWsReady) ws.send(JSON.stringify({type: 'POSITION', position: player.position.toArray(), rotation: player.rotation.toArray()}))
  goal.rotation.x += Math.PI / 50
  if(player.position.y < -50) {
    player.position.set(0, 0, 0)
  }

  player.bbox.setFromObject(player)

  if(isWsReady && player.bbox.intersectsBox(goal.bbox)) {
    console.log('SCORED')
    goal.position.set(0, 0, -100) // avoid it being intersected any longer
    goal.bbox.setFromObject(goal)
    ws.send(JSON.stringify({type: 'SCORE'}))
  }
}
