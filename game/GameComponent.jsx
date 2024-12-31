"use client";
import React, { useEffect, useState, useRef } from 'react';
import Phaser from 'phaser';
import MainMenu from './scenes/MainMenu';
import GameScene from './scenes/Game';
import GameOver from './scenes/GameOver';
import axios from 'axios';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

const GameComponent = ({ pause, user }) => {
    const [score, setScore] = useState(0);
    const [playerData, setPlayerData] = useState([])
    const [gameOver, setGameOver] = useState(false);
    const gameRef = useRef(null);

    const savePlayerData = async () => {
        try {
            if (gameOver && playerData) {
                await axios.post('/api/playerdata', {
                    playerData, userId: user._id
                });
            }
        } catch (error) {
            console.error("Error saving player data:", error);
        }
    };    

    const saveHighScore = async () => {
        try {
            if (gameOver && score) {
                const response = await axios.post('/api/leaderboard', {
                    userId: user._id,
                    highScore: score,
                });
            }
        } catch (error) {
            console.error('Error saving high score:', error.response || error);
        }
    };

    const fetchHighScore = async () => {
        try {
            if (user?._id) {
                const response = await axios.get(`/api/user/${user._id}/highscore`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                });
                return response.data.highScore || 0;
            } else {
                console.error("Missing user ID");
                return 0;
            }
        } catch (error) {
            console.error("Error fetching high score:", error);
            return 0;
        }
    };

    useEffect(() => {
        if (gameOver) {
            //console.log(playerData);
            savePlayerData();
            saveHighScore();
        }
    }, [gameOver]);

    useEffect(() => {
        const configureGame = () => {
            const isPhoneViewport = document.documentElement.clientWidth <= 1024;
    
            const config = {
                type: Phaser.AUTO,
                pixelArt: true,
                width: 500,
                height: 500,
                audio: {
                    disableWebAudio: true,
                },
                backgroundColor: '#111111',
                roundPixels: true,
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { y: 0 }, debug: false },
                },
                scene: [MainMenu, GameScene, GameOver],
                plugins: {
                    global: [{
                        key: 'rexVirtualJoystick',
                        plugin: VirtualJoystickPlugin,
                        start: true
                    }
                    ]
                },
                callbacks: {
                    preBoot: (game) => {
                        game.registry.set('isPhoneViewport', isPhoneViewport);
                    },
                    postBoot: (game) => {
                        const mainMenuScene = game.scene.getScene('MainMenuScene');
                        const gameScene = game.scene.getScene('GameScene');

                        gameScene.setPlayerDataFunction(setPlayerData);
                        gameScene.setScoreFunction(setScore);
                        gameScene.setGameOverFunction(setGameOver);
                        gameScene.setFetchHighScore(fetchHighScore);
                        gameScene.setPhoneViewport(isPhoneViewport);
                        mainMenuScene.setPhoneViewport(isPhoneViewport);
                    },
                },
            };
    
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
    
            gameRef.current = new Phaser.Game(config);
            const gameContainer = document.getElementById('game-container');
            gameContainer.appendChild(gameRef.current.canvas);
        };
    
        const handleResize = () => {
            configureGame();
        };
    
        configureGame();
        window.addEventListener('resize', handleResize);
    
        return () => {
            window.removeEventListener('resize', handleResize);
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, []);
    

    useEffect(() => {
        if (gameRef.current) {
            if (pause) {
                gameRef.current.scene.pause('GameScene');
            } else {
                gameRef.current.scene.resume('GameScene');
            }
        }
    }, [pause]);

    return (
        <div className="flex justify-center items-center">
            <div id="game-container" className="flex" />
        </div>
    );
};

export default GameComponent;
