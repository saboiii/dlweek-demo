export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.setScore = null;
        this.setGameOver = null;
        this.fetchHighScore = null;
        this.isPhoneViewport = false;
    }

    setFetchHighScore(fetchHighScore) {
        this.fetchHighScore = fetchHighScore;
    }

    setPhoneViewport(isPhoneViewport) {
        this.isPhoneViewport = isPhoneViewport;
    }

    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
    }

    setupJoystick(){
        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
            x: 400,
            y: 400,
            radius: 100,
            base: this.add.circle(0, 0, 50, 0x888888),
            thumb: this.add.circle(0, 0, 25, 0xcccccc),
        })
        this.joyStick.visible = this.isPhoneViewport;
        this.joyStick.enable = this.isPhoneViewport;
        this.cursorKeys = this.joyStick.createCursorKeys();
    }

    create() {
        this.isPhoneViewport = this.sys.game.registry.get('isPhoneViewport');
        this.score = 0;
        this.text = this.add.text(0, 0);
        this.gameOver = false;
        this.setupJoystick()
        this.windowWidth = 500;
        this.windowHeight = 500;
        this.scoreText = this.add.text(this.windowWidth - 100, 30, 'Score: 0', {
            fontSize: '12px',
            fill: '#ffffff',
        });
        this.createPlayer();
        this.setupControls();
        this.createPlayerTrail();
        this.spawnProjectiles();
        this.spawnNibbles();
        this.eatNibbles();
        this.physics.add.collider(this.player, this.projectiles, this.gameOverProtocol, null, this);
        this.player.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this.player) {
                this.gameOverProtocol();
            }
        });
    }


    update() {
        this.handleMovement();
        createTrail(this.player, this.trailCircles, 1, 1, 0.25)
        this.updateProjectiles();
    }

    setScoreFunction(setScoreFunction) {
        this.setScore = setScoreFunction;
    }

    setGameOverFunction(setGameOverFunction) {
        this.setGameOver = setGameOverFunction;
    }

    createPlayer() {
        this.player = this.add.circle(this.windowWidth / 2, this.windowHeight / 2, 8, 0xffffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setVelocity(0, 0);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cursorKeys = this.joyStick.createCursorKeys();
        this.WASD = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
        });
    }

    createPlayerTrail() {
        this.trailCircles = [];
        this.numTrailCircles = 10;
        for (let i = 0; i < this.numTrailCircles; i++) {
            let circle = this.add.circle(0, 0, 8, 0xffffff);
            circle.setAlpha(0);
            this.trailCircles.push(circle);
            circle.setPosition(this.player.x, this.player.y);
        }
    }

    growAnimation(gameObject) {
        this.tweens.add({
            targets: gameObject,
            scaleX: 1,
            scaleY: 1,
            duration: 1000,
            ease: 'Power2',
            onStart: () => {
                gameObject.setScale(0);
            }
        });
    }

    spawnProjectiles() {
        this.projectiles = [];
        this.projectileSpawnInterval = 2000;
        this.projectileTrails = [];
        this.time.addEvent({
            delay: this.projectileSpawnInterval,
            loop: true,
            callback: () => this.createProjectile(),
        });
    }

    spawnNibbles() {
        this.nibbles = this.physics.add.group();
        this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                if (this.nibbles.getChildren().length < 3) {
                    this.createNibble();
                }
            },
        });
    }


    createProjectile() {
        let startX, startY;
        let distanceToPlayer = 0;

        while (distanceToPlayer < 50) {
            startX = Math.random() * (this.windowWidth - 100) + 50;
            startY = Math.random() * (this.windowHeight - 100) + 50;
            distanceToPlayer = Math.sqrt(
                (startX - this.player.x) ** 2 + (startY - this.player.y) ** 2
            );
        }

        let projectile = this.add.circle(startX, startY, 8, 0xC70039);
        this.physics.add.existing(projectile);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.setVelocity(0, 0);
        this.projectiles.push(projectile);

        this.growAnimation(projectile)

        let trail = [];
        for (let i = 0; i < this.numTrailCircles; i++) {
            let trailCircle = this.add.circle(0, 0, 8, 0xC70039);
            trailCircle.setAlpha(0);
            trail.push(trailCircle);
            trailCircle.setPosition(projectile.x, projectile.y);
        }
        this.projectileTrails.push(trail);

        projectile.spawnTime = this.time.now;
        projectile.lastVelocity = { x: 0, y: 0 };
        projectile.body.onWorldBounds = true;
        projectile.body.world.on('worldbounds', (body) => {
            if (body.gameObject === projectile) {
                this.deferredCleanupProjectile(projectile);
            }
        });
    }

    nibbleAnimation(nibble) {
        this.tweens.add({
            targets: nibble,
            y: nibble.y - 10,
            yoyo: true,
            repeat: -1,
            duration: 1000,
            ease: 'Sine.easeInOut',
        });
    }


    createNibble() {
        let nibbleX = Math.random() * (this.windowWidth - 200) + 100;
        let nibbleY = Math.random() * (this.windowHeight - 200) + 100;
        let nibble = this.add.circle(nibbleX, nibbleY, 8, 0x5c9dc2);
        this.physics.add.existing(nibble);
        this.nibbles.add(nibble);
        this.growAnimation(nibble);
        this.nibbleAnimation(nibble);
    }

    eatNibbles() {
        this.physics.add.overlap(this.player, this.nibbles, (player, nibble) => {
            nibble.destroy();
            this.score += 10;
            if (this.setScore) {
                this.setScore(this.score);
            }
            this.scoreText.setText('Score: ' + this.score);
        });
    }

    handleMovement() {
        const acceleration = 25;
        const maxSpeed = 200;
        if (this.player && this.player.body){
            const currentVelocity = this.player.body.velocity.clone();
            if (this.WASD.W.isDown || this.cursorKeys["up"].isDown) {
                this.player.body.velocity.y = Math.max(currentVelocity.y - acceleration, -maxSpeed);
            } else if (this.WASD.S.isDown || this.cursorKeys["down"].isDown) {
                this.player.body.velocity.y = Math.min(currentVelocity.y + acceleration, maxSpeed);
            } else {
                this.smoothStop(currentVelocity, 'y', acceleration);
            }
    
            if (this.WASD.A.isDown || this.cursorKeys["left"].isDown) {
                this.player.body.velocity.x = Math.max(currentVelocity.x - acceleration, -maxSpeed);
            } else if (this.WASD.D.isDown || this.cursorKeys["right"].isDown) {
                this.player.body.velocity.x = Math.min(currentVelocity.x + acceleration, maxSpeed);
            } else {
                this.smoothStop(currentVelocity, 'x', acceleration);
            }
        }

    }

    smoothStop(currentVelocity, axis, acceleration) {
        if (currentVelocity[axis] > 0) {
            this.player.body.velocity[axis] = Math.max(currentVelocity[axis] - acceleration, 0);
        } else if (currentVelocity[axis] < 0) {
            this.player.body.velocity[axis] = Math.min(currentVelocity[axis] + acceleration, 0);
        }
    }


    updateProjectiles() {
        const projectileAcceleration = 10;
        const projectileMaxSpeed = 150;
        const currentTime = this.time.now;

        this.projectiles.forEach((projectile, index) => {
            updateProjectile(projectile, this.player, projectileAcceleration, projectileMaxSpeed, currentTime, this);
            createTrail(projectile, this.projectileTrails[index], 1, 1, 0.25);
        });
    }

    deferredCleanupProjectile(projectile) {
        this.time.addEvent({
            delay: 0,
            callback: () => {
                const index = this.projectiles.indexOf(projectile);
                if (index !== -1) {
                    this.projectileTrails[index].forEach((circle) => {
                        circle.setAlpha(1);
                        circle.setVisible(false);
                    });

                    this.projectileTrails.splice(index, 1);
                    this.projectiles.splice(index, 1);
                    projectile.destroy();
                }
            },
        });
    }

    gameOverProtocol() {
        this.gameOver = true;
        if (this.setGameOver) {
            this.setGameOver(this.gameOver);
        }

        this.scene.start('GameOverScene', {
            score: this.score,
            setGameOver: this.setGameOver,
            fetchHighScore: this.fetchHighScore
        });
    }
}

function createTrail(gameObject, trailShapes, trailSpacing, maxAlpha, fadeSpeed) {
    if (!gameObject || !gameObject.body || !trailShapes || trailShapes.length === 0) {
        return;
    }

    const rotation = Math.atan2(gameObject.body.velocity.y, gameObject.body.velocity.x);
    const isStill = gameObject.body.velocity.x === 0 && gameObject.body.velocity.y === 0;

    for (let i = trailShapes.length - 1; i > 0; i--) {
        let currCircle = trailShapes[i - 1];
        let prevCircle = trailShapes[i];

        if (!isStill) {
            currCircle.setPosition(prevCircle.x - trailSpacing * Math.cos(rotation), prevCircle.y - trailSpacing * Math.sin(rotation));
        } else {
            currCircle.setPosition(
                Phaser.Math.Linear(currCircle.x, gameObject.x, 0.1),
                Phaser.Math.Linear(currCircle.y, gameObject.y, 0.1)
            );
        }

        currCircle.setScale(gameObject.scaleX, gameObject.scaleY);
        currCircle.setAlpha(1 - fadeSpeed * (trailShapes.length - i));
    }

    let lastCircle = trailShapes[trailShapes.length - 1];
    lastCircle.setPosition(gameObject.x, gameObject.y);
    lastCircle.setScale(gameObject.scaleX, gameObject.scaleY);
    lastCircle.setAlpha(maxAlpha);
}

function updateProjectile(projectile, target, acceleration, maxSpeed, currentTime, scene) {
    if (!projectile || !projectile.body) {
        return;
    }

    const timeElapsed = currentTime - projectile.spawnTime;

    if (timeElapsed < 5000) {
        const targetX = target.x - projectile.x;
        const targetY = target.y - projectile.y;
        const distance = Math.sqrt(targetX * targetX + targetY * targetY);

        if (distance > 1) {
            const directionX = targetX / distance;
            const directionY = targetY / distance;

            projectile.body.velocity.x += directionX * acceleration;
            projectile.body.velocity.y += directionY * acceleration;

            const speed = Math.sqrt(
                projectile.body.velocity.x ** 2 + projectile.body.velocity.y ** 2
            );
            if (speed > maxSpeed) {
                projectile.body.velocity.x *= maxSpeed / speed;
                projectile.body.velocity.y *= maxSpeed / speed;
            }
        }

        projectile.lastVelocity = {
            x: projectile.body.velocity.x,
            y: projectile.body.velocity.y,
        };

    } else if (timeElapsed < 10000) {
        projectile.body.velocity.x = projectile.lastVelocity.x;
        projectile.body.velocity.y = projectile.lastVelocity.y;
    }
}
