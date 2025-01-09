import * as tf from '@tensorflow/tfjs';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.setScore = null;
        this.setGameOver = null;
        this.fetchHighScore = null;
        this.isPhoneViewport = false;
        this.setPlayerData = null;
        this.projectileIdCounter = 1;
        this.projectileData = {};
        this.playerData = {};
        this.fpsText = null;
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

    setupJoystick() {
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
    

    async loadModel() {
        const model = await tf.loadLayersModel('/evil_tfjs/model.json');
        console.log('The AI has joined the game.');
        return model;
    }
    

    async create() {
        this.isPhoneViewport = this.sys.game.registry.get('isPhoneViewport');
        this.score = 0;
        this.text = this.add.text(0, 0);
        this.gameOver = false;
        this.setupJoystick()
        this.windowWidth = 500;
        this.windowHeight = 500;
        this.scoreText = this.add.text(400, 30, 'Score: 0', {
            fontSize: '12px',
            fill: '#ffffff',
        });
        this.fpsText = this.add.text(30, 30, 'FPS: 0', {
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
        this.updateCount = 0;
        this.model = await this.loadModel();
       // this.evilFunction(250, 250, 60);
    }

    evilFunction(x, y, xory) {
        const userTensor = [[x, y]];
        const inputTensor = tf.tensor2d(userTensor.map(row => row.map(value => value / 500)));
        const prediction = this.model.predict(inputTensor);
        const scaledPrediction = prediction.mul(500);
        const predictionArray = scaledPrediction.arraySync();
        tf.dispose([inputTensor, prediction, scaledPrediction]);
        return predictionArray[0][xory];
    }


    update() {
        const fps = Math.round(this.game.loop.actualFps);
        this.fpsText.setText(`FPS: ${fps}`);

        this.handleMovement();
        createTrail(this.player, this.trailCircles, 1, 1, 0.25);
        this.updateProjectiles();

        this.projectiles.map((projectile) => {
            const diffx = this.player.x - projectile.x;
            const diffy = this.player.y - projectile.y;
            const distance = Math.sqrt(diffx * diffx + diffy * diffy);
            
            this.projectileData[projectile.id].trackingData.push({
                playerCoords: { x: this.player.x.toFixed(2), y: this.player.y.toFixed(2) },
                projectileCoords: { x: projectile.x.toFixed(2), y: projectile.y.toFixed(2) },
                distance: distance
            });
        });

        this.projectiles.forEach((projectile) => {
            if(this.projectileData[projectile.id]){
                this.storeMinDistance(projectile);
            }
        });
    }

    storeMinDistance(projectile) {
        if (this.projectileData[projectile.id]) {
            const { trackingData, initialPlayerCoords, initialProjectileCoords } = this.projectileData[projectile.id];
    
            const { minDistance, minDistanceData } = trackingData.reduce((acc, data) => {
                if (data.distance < acc.minDistance) {
                    return { 
                        minDistance: data.distance,
                        minDistanceData: data
                    };
                }
                return acc;
            }, { minDistance: Infinity, minDistanceData: null });
    
            this.playerData[projectile.id] = {
                minDistance: minDistance,
                playerCoords: initialPlayerCoords,
                projectileCoords: initialProjectileCoords
            };
        }
    }


    setScoreFunction(setScoreFunction) {
        this.setScore = setScoreFunction;
    }

    setPlayerDataFunction(setPlayerDataFunction) {
        this.setPlayerData = setPlayerDataFunction;
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
        let startX = this.evilFunction(this.player.x, this.player.y, 0);
        let startY = this.evilFunction(this.player.x, this.player.y, 1);

        let distanceToPlayer = Math.sqrt(
            (startX - this.player.x) ** 2 + (startY - this.player.y) ** 2
        );

        if (distanceToPlayer < 50) {
            startX = Math.random() * (this.windowWidth - 100) + 50;
            startY = Math.random() * (this.windowHeight - 100) + 50;
        }

        let projectile = this.add.circle(startX, startY, 8, 0xC70039);
        this.physics.add.existing(projectile);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.setVelocity(0, 0);
        this.projectiles.push(projectile);

        projectile.id = this.projectileIdCounter;
        this.projectileIdCounter++;

        this.growAnimation(projectile)

        let trail = [];
        for (let i = 0; i < this.numTrailCircles; i++) {
            let trailCircle = this.add.circle(0, 0, 8, 0xC70039);
            trailCircle.setAlpha(0);
            trail.push(trailCircle);
            trailCircle.setPosition(projectile.x, projectile.y);
        }
        this.projectileTrails.push(trail);

        this.projectileData[projectile.id] = {
            initialPlayerCoords: { x: this.player.x, y: this.player.y },
            initialProjectileCoords: { x: startX, y: startY },
            trackingData: []
        };

        projectile.spawnTime = this.time.now;
        projectile.lastVelocity = { x: 0, y: 0 };
        projectile.body.onWorldBounds = true;
        projectile.body.world.on('worldbounds', (body) => {
            if (body.gameObject === projectile) {
                this.deferredCleanupProjectile(projectile);
                this.storeMinDistance(projectile);
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
        if (this.player && this.player.body) {
            const currentVelocity = this.player.body.velocity.clone();
            if (this.WASD.W.isDown || this.cursorKeys["up"].isDown || this.cursors["up"].isDown) {
                this.player.body.velocity.y = Math.max(currentVelocity.y - acceleration, -maxSpeed);
            } else if (this.WASD.S.isDown || this.cursorKeys["down"].isDown || this.cursors["down"].isDown) {
                this.player.body.velocity.y = Math.min(currentVelocity.y + acceleration, maxSpeed);
            } else {
                this.smoothStop(currentVelocity, 'y', acceleration);
            }

            if (this.WASD.A.isDown || this.cursorKeys["left"].isDown || this.cursors["left"].isDown) {
                this.player.body.velocity.x = Math.max(currentVelocity.x - acceleration, -maxSpeed);
            } else if (this.WASD.D.isDown || this.cursorKeys["right"].isDown || this.cursors["right"].isDown) {
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
        const projectileAcceleration = 15;
        const projectileMaxSpeed = 175;
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
                        circle.destroy();
                    });

                    this.projectileTrails.splice(index, 1);
                    this.projectiles.splice(index, 1);
                    this.physics.world.remove(projectile.body);
                    projectile.destroy();
                }
            },
        });
    }

    resetGameState() {
        this.playerData = {};
        this.projectileData = {};
        this.projectileIdCounter = 1;
        this.projectiles = [];
        this.trailCircles.forEach(circle => circle.destroy());
        this.trailCircles = [];
        this.projectileTrails.forEach(trail => trail.forEach(circle => circle.destroy()));
        this.projectileTrails = [];
        this.nibbles.clear(true, true);
    }

    gameOverProtocol() {
        this.gameOver = true;
        if (this.setGameOver) {
            this.setGameOver(this.gameOver);
        }

        if (this.playerData) {
            this.setPlayerData(this.playerData);
        }

        this.resetGameState();

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

    } else{
        projectile.body.velocity.x = projectile.lastVelocity.x;
        projectile.body.velocity.y = projectile.lastVelocity.y;
    }
}
