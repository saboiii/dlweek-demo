class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    async init(data) {
        this.finalScore = data.score;
        this.setGameOver = data.setGameOver;
        if (data.fetchHighScore) {
            this.fetchHighScore = data.fetchHighScore;
            this.highScore = await this.fetchHighScore();
        } else {
            this.highScore = 0;
        }
        this.events.emit('highScoreFetched');
    }

    create() {
        this.events.once('highScoreFetched', () => {

            const lines = [
                "loss = model.evaluate(x_test, y_test)",
                "if loss > threshold:",
                "    print('Game Over: Model failed to converge.')",
                `    print('Score:', np.round(${this.finalScore}))`,
                `    print('Highscore:', np.round(${this.highScore}))`,
                "    print('Press ENTER to go to Main Menu.')"
            ];

            const cursor = this.createCursor();
            this.createTypingEffect(lines, cursor);

            this.input.keyboard.once('keydown-ENTER', () => {
                if (this.setGameOver) {
                    this.setGameOver(false);
                }
                this.scene.start('MainMenuScene');
            });

            this.input.once('pointerdown', () => {
                if (this.setGameOver) {
                    this.setGameOver(false);
                }
                this.scene.start('MainMenuScene');
            });
        });
    }

    createCursor() {
        const cursor = this.add.text(10, 20, '┃', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0);
        this.time.addEvent({
            delay: 250,
            callback: () => {
                cursor.visible = !cursor.visible;
            },
            loop: true
        });
        return cursor;
    }

    createTypingEffect(lines, cursor) {
        const textDisplays = lines.map((_, i) =>
            this.add.text(10, 20 + i * 14, '', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0)
        );

        let currentLine = 0;
        let charIndex = 0;

        this.time.addEvent({
            delay: 30,
            callback: () => {
                if (currentLine < lines.length) {
                    const line = lines[currentLine];
                    const currentChar = line[charIndex];

                    if (currentChar) {
                        textDisplays[currentLine].text += currentChar;
                        cursor.setX(textDisplays[currentLine].width + 10);
                        cursor.setY(20 + currentLine * 14);
                        charIndex++;
                    } else {
                        currentLine++;
                        charIndex = 0;
                    }
                } else {
                    cursor.setX(textDisplays[lines.length - 1].width + 10);
                    cursor.setY(20 + (lines.length - 1) * 14);
                }
            },
            loop: true
        });
    }
}

export default GameOver;
