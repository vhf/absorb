;(function() {
  var Game = function() {
    var screen = document.getElementById("canvas").getContext('2d');

    this.size = { x: screen.canvas.width, y: screen.canvas.height };
    this.center = { x: this.size.x / 2, y: this.size.y / 2 };
    this.counter = 0;
    this.player = new Player(this);
    this.running = true;

    this.bodies = createInvaders(this, 40).concat(this.player);

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
      if (this.counter % 10 === 0) {
        this.bodies = this.bodies.concat(createInvaders(this, 1));
      }

      if (this.bodies.length === 1) {
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

      if (!this.running) {
        if (this.bodies.indexOf(this.player) === -1) {
          screen.fillStyle = "white";
          screen.fillRect(0, 0, this.size.x, this.size.y);
          screen.fillStyle = "black";
          screen.fillText("YOU LOST", this.size.x/2, this.size.y/2);
        } else {
          screen.fillStyle = "grey";
          screen.fillRect(0, 0, this.size.x, this.size.y);
          screen.fillStyle = "white";
          screen.fillText("YOU WIN", this.size.x/2, this.size.y/2);
        }
      }

      screen.textAlign = "right";
      screen.fillText(this.counter++, this.size.x, 10);
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
      var x, y, invader;
      // don't generate an invader touching the player or right next to him
      do {
        x = Math.random()*game.size.x;
        y = Math.random()*game.size.y;
        invader = new Invader(game, { x: x, y: y});
        playerSafeArea = {
          size: {
            x: game.player.center.x + 5,
            y: game.player.center.y + 5
          },
          center: {
            x: game.player.center.x,
            y: game.player.center.y
          }
        };
      } while (isColliding(invader, playerSafeArea));

      invaders.push(invader);
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
      this.center.x += this.speedX + Math.random();
      this.center.y += this.speedY + Math.random();
    },

    draw: function(screen) {
      drawBody(screen, this);
    },

    remove: function() {
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

    remove: function() {
      this.game.removeBody(this);
      this.game.running = false;
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
    if (body instanceof Player) {
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

  var isOutOfBound = function(b) {
    return (
        b.center.x + b.size.x / 2 <= 0 ||
        b.center.y + b.size.y / 2 <= 0 ||
        b.center.x - b.size.x / 2 >= 900 ||
        b.center.y - b.size.y / 2 >= 600
    );
  };

  var reportCollisions = function(bodies) {
    var bodyPairs = [];
    for (var i = 0; i < bodies.length; i++) {
      if (isOutOfBound(bodies[i])) {
        bodies[i].remove(bodies[i]);
      }
      for (var j = i + 1; j < bodies.length; j++) {
        if (isColliding(bodies[i], bodies[j])) {
          if (bodies[i] instanceof Player) {
            bodyPairs.push([bodies[i], bodies[j]]);
          } else if (bodies[j] instanceof Player) {
            bodyPairs.push([bodies[j], bodies[i]]);
          }
        }
      }
    }

    for (var i = 0; i < bodyPairs.length; i++) {
      var player = bodyPairs[i][0];
      var invader = bodyPairs[i][1];
      if (player.area() > invader.area()) {
        player.size.x += invader.size.x;
        player.size.y += invader.size.y;
        invader.remove(invader);
      } else {
        player.remove(player);
      }
    }
  };

  window.addEventListener('load', function() {
    new Game();
  });
})();
