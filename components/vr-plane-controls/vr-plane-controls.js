AFRAME.registerComponent('vr-plane-controls', {
  schema: {
    plane: {default: null},
    acceleration: {default: 25},
    adAxis: {default: 'x', oneOf: ['x', 'y', 'z']},
    easing: {default: 20},
    enabled: {default: true},
    wsAxis: {default: 'z', oneOf: ['x', 'y', 'z']},
    goForward: {default: false},
    camera: {type: 'selector', default: "#camera"},
    plane: {type: 'selector', default: "#plane"},
    div: {type: 'selector', default: "#tapToGo"},
    maxDelta: {default: 0.2},
    clampVelocity: {default: 0.00001}
  },
  init: function(){
    console.log("Initing vr-plane-controls", this)
    this.bindListeners();
    this.position = {};
    this.velocity = new THREE.Vector3();
  },
  tick: function (time, delta){
    this.updatePositionOfPlane();
    this.updateSpeedAndCoords(time, delta);
  },
  bindListeners: function(){
    //bind listeners to plane
    var elem = this.data.plane;
    var self = this;
    elem.addEventListener('mouseenter', function() {
        self.data.goForward = true;
    }, true);
    elem.addEventListener('mouseleave', function() {  
        self.data.goForward = false;
    }, true);
    this.data.div.addEventListener('mouseenter', function() {
        self.data.goForward = true;
    }, true);
    this.data.div.addEventListener('mouseleave', function() {
        self.data.goForward = false;
    }, true);
    this.data.div.addEventListener("touchstart", function(){
      self.data.goForward = true;
    })
    this.data.div.addEventListener("touchend", function(){
      self.data.goForward = false;
    })

    //bind listeners to the scene
    this.el.sceneEl.addEventListener('enter-vr', function () {
      console.log("ENTERED VR");
      elem.setAttribute('scale', '1 1 1')
    });
    this.el.sceneEl.addEventListener('exit-vr', function () {
      console.log("EXIT VR");
      elem.setAttribute('scale', '0.000000000001 0.000000000001 0.000000000001')
    });


  },
  updatePositionOfPlane: function(){
    var el = this.data.camera;
    var rotation = el.getAttribute('rotation')
    var y = rotation.y
    var new_z = 0 + Math.cos(Math.radians(y) + Math.radians(180))
    var new_x = 0 + Math.sin(Math.radians(y) + Math.radians(180))
    var new_position = new_x + " 0.6 " + new_z;
    this.data.plane.setAttribute('position', new_position)
  },
  updateSpeedAndCoords: function (time, delta) {
    var currentPosition;
    var data = this.data;
    var el = this.el;
    var movementVector;
    var position = this.position;
    var velocity = this.velocity;

    // if (!velocity[data.adAxis] && !velocity[data.wsAxis] &&
    //     isEmptyObject(this.keys)) { console.log('no updateVelocity'); return; }

    // Update velocity.
    delta = delta / 1000;
    this.updateVelocity(delta);

    if (!velocity[data.adAxis] && !velocity[data.wsAxis]) { return; }

    // Get movement vector and translate position.
    currentPosition = el.getAttribute('position');
    movementVector = this.getMovementVector(delta);
    position.x = currentPosition.x + movementVector.x;
    position.y = currentPosition.y + movementVector.y;
    position.z = currentPosition.z + movementVector.z;
    el.setAttribute('position', position);
  },
  updateVelocity: function (delta) {
    var acceleration;
    var adAxis;
    var adSign;
    var data = this.data;
    var keys = this.keys;
    var velocity = this.velocity;
    var wsAxis;
    var wsSign;

    adAxis = data.adAxis;
    wsAxis = data.wsAxis;

    // If FPS too low, reset velocity.
    if (delta > this.data.maxDelta) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      //console.log('return on delta')
      return;
    }

    // Decay velocity.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] -= velocity[adAxis] * data.easing * delta;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] -= velocity[wsAxis] * data.easing * delta;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < this.data.clampVelocity) { velocity[adAxis] = 0; }
    if (Math.abs(velocity[wsAxis]) < this.data.clampVelocity) { velocity[wsAxis] = 0; }

    if (!data.enabled && !this.data.goForward) { 
      //console.log('return111'); 
      return; 
    }

    
    if (this.data.goForward){
        //get rotation of user
        var camera_rotation = this.data.camera.getAttribute('rotation')
        var vel_ad = Math.sin(Math.radians(camera_rotation.y));
        var vel_ws = Math.cos(Math.radians(camera_rotation.y));

        acceleration = data.acceleration;
        velocity[adAxis] -= acceleration * delta * vel_ad; 
        velocity[wsAxis] -= acceleration * delta * vel_ws; 
        return;
    }
  },
  getMovementVector: (function () {
    var directionVector = new THREE.Vector3(0, 0, 0);
    var rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    return function (delta) {
      var rotation = this.el.getAttribute('rotation');
      var velocity = this.velocity;
      var xRotation;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);

      // Absolute.
      if (!rotation) { return directionVector; }

      xRotation = this.data.fly ? rotation.x : 0;

      // Transform direction relative to heading.
      rotationEuler.set(THREE.Math.degToRad(xRotation), THREE.Math.degToRad(rotation.y), 0);
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })()
});
