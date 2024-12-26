class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        this.isPhoneViewport = false;
    }

    setPhoneViewport(isPhoneViewport) {
        this.isPhoneViewport = isPhoneViewport;
    }

    preload() {
    }

    create() {
        this.isPhoneViewport = this.sys.game.registry.get('isPhoneViewport');

        const lines = [
            "import tensorflow as tf",
            "newUser = MainModel(input_shape=(500, 500))",
            "print('Welcome to our secret minigame')",
            "print('Press ENTER to play')"
        ];

        
        if (this.isPhoneViewport) {
            lines.push(
                "    joystick_config = {'enabled': True, 'mode': 'analog'}",
            );
        }

        const cursor = this.createCursor();
        this.createTypingEffect(lines, cursor);

        this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
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

export default MainMenu;
