;(function() {
  var Game = function() {
    var screen = document.getElementById("canvas").getContext('2d');

    this.size = { x: screen.canvas.width, y: screen.canvas.height };
    this.center = { x: this.size.x / 2, y: this.size.y / 2 };
    this.counter = 0;
    this.player = new Player(this);
    this.running = true;

    this.bodies = createInvaders(this, 24).concat(this.player);

    var self = this;
    var tick = function() {
      self.update();
      self.draw(screen);
      if (self.running) {
        requestAnimationFrame(tick);
      }
    };

    tick();
  };

  Game.prototype = {
    update: function() {
      if(this.counter % 10 === 0) {
        this.bodies = this.bodies.concat(createInvaders(this, 1));
      }

      if(this.player.size.x > this.size.x*2 || this.bodies.indexOf(this.player) === -1) {
        this.running = false;
      }

      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].update !== undefined) {
          this.bodies[i].update();
        }
      }

      reportCollisions(this.bodies);
    },

    draw: function(screen) {
      screen.clearRect(0, 0, this.size.x, this.size.y);
      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].draw !== undefined) {
          this.bodies[i].draw(screen);
        }
      }

      screen.textAlign = "right";
      screen.fillText(this.counter++, this.size.x, 10);
      if(!this.running) {
        if(this.bodies.indexOf(this.player) === -1) {
          screen.clearRect(0, 0, this.size.x, this.size.y);
          screen.fillText("YOU LOST", this.size.x/2, this.size.y/2);
        } else {
          screen.fillStyle = "white";
          screen.fillText("YOU WIN", this.size.x/2, this.size.y/2);
        }
      }
    },

    addBody: function(body) {
      this.bodies.push(body);
    },

    removeBody: function(body) {
      var bodyIndex = this.bodies.indexOf(body);
      if (bodyIndex !== -1) {
        this.bodies.splice(bodyIndex, 1);
      }
    }
  };

  var createInvaders = function(game, n) {
    var invaders = [];
    for (var i = 0; i < n; i++) {
      var x = Math.random()*game.size.x;
      var y = Math.random()*game.size.y;
      invaders.push(new Invader(game, { x: x, y: y}));
    }

    return invaders;
  };

  var Invader = function(game, center) {
    size = Math.random()*50+5;
    this.game = game;
    this.size = { x: size, y: size };
    this.center = center;
    this.speedX = (Math.random()+1)*3-5;
    this.speedY = (Math.random()+1)*3-5;
    this.position = { x: 0, y: 0};
  };

  Invader.prototype = {
    update: function() {
      this.center.x += this.speedX;
      this.center.y += this.speedY;

      this.patrolX += this.speedX;
    },

    draw: function(screen) {
      drawBody(screen, this);
    },

    collision: function() {
      this.game.removeBody(this);
    },

    area: function() {
      return this.size.x * this.size.y;
    }
  };

  var Player = function(game) {
    this.game = game;
    this.size = { x: 10, y: 10 };
    this.center = { x: game.center.x, y: game.center.y };
    this.keyboarder = new Keyboarder();
  };

  Player.prototype = {
    update: function() {
      if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        this.center.x -= 2;
      } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
        this.center.x += 2;
      }
      if (this.keyboarder.isDown(this.keyboarder.KEYS.UP)) {
        this.center.y -= 2;
      } else if (this.keyboarder.isDown(this.keyboarder.KEYS.DOWN)) {
        this.center.y += 2;
      }
    },

    draw: function(screen) {
      drawBody(screen, this);
    },

    collision: function() {
      this.game.removeBody(this);
    },

    area: function() {
      return this.size.x * this.size.y;
    }
  };

  var Keyboarder = function() {
    var keyState = {};

    window.addEventListener('keydown', function(e) {
      keyState[e.keyCode] = true;
    });

    window.addEventListener('keyup', function(e) {
      keyState[e.keyCode] = false;
    });

    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
    };

    this.KEYS = { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32 };
  };

  var drawBody = function(screen, body) {
    if(body instanceof Player) {
      screen.fillStyle = 'grey';
    } else {
      screen.fillStyle = 'black';
    }
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x,
                    body.size.y);
  };

  var isColliding = function(b1, b2) {
    return !(
      b1 === b2 ||
        b1.center.x + b1.size.x / 2 <= b2.center.x - b2.size.x / 2 ||
        b1.center.y + b1.size.y / 2 <= b2.center.y - b2.size.y / 2 ||
        b1.center.x - b1.size.x / 2 >= b2.center.x + b2.size.x / 2 ||
        b1.center.y - b1.size.y / 2 >= b2.center.y + b2.size.y / 2
    );
  };

  var reportCollisions = function(bodies) {
    var bodyPairs = [];
    for (var i = 0; i < bodies.length; i++) {
      for (var j = i + 1; j < bodies.length; j++) {
        if (isColliding(bodies[i], bodies[j])) {
          bodyPairs.push([bodies[i], bodies[j]]);
        }
      }
    }

    for (var i = 0; i < bodyPairs.length; i++) {

      if (bodyPairs[i][1] instanceof Player && bodyPairs[i][1].area() > bodyPairs[i][0].area()) {
        //console.log('encountered a small invader', bodyPairs[i][0]);
        bodyPairs[i][1].size.x += bodyPairs[i][0].size.x;
        bodyPairs[i][1].size.y += bodyPairs[i][0].size.y;
        bodyPairs[i][0].collision(bodyPairs[i][0]);
      } else if (bodyPairs[i][0] instanceof Player && bodyPairs[i][0].area() > bodyPairs[i][1].area()) {
        //console.log('encountered a small invader', bodyPairs[i][1]);
        bodyPairs[i][0].size.x += bodyPairs[i][1].size.x;
        bodyPairs[i][0].size.y += bodyPairs[i][1].size.y;
        bodyPairs[i][1].collision(bodyPairs[i][1]);
      } else if (bodyPairs[i][0] instanceof Invader && bodyPairs[i][1] instanceof Invader) {
        //invader vs invader
        continue;
      } else {
        if (bodyPairs[i][0] instanceof Player) {
          //console.log('you died');
          bodyPairs[i][0].collision(bodyPairs[i][0]);
        } else if (bodyPairs[i][1] instanceof Player) {
          //console.log('you died');
          bodyPairs[i][1].collision(bodyPairs[i][1]);
        } else {
          //console.debug('Removed', bodyPairs[i][1]);
          bodyPairs[i][0].collision(bodyPairs[i][0]);
          bodyPairs[i][1].collision(bodyPairs[i][1]);
        }
      }
    }
  };

  window.addEventListener('load', function() {
    new Game();
  });
})();
