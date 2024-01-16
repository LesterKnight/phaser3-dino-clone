import Phaser from "phaser";
import { SpriteWithDynamicBody } from "../types";
import { Player } from "../entities/Player";
import BaseGameScene from "./BaseGameScene";
import { PRELOAD_CONFIG } from "..";

class PlayScene extends BaseGameScene {

    player: Player;
    ground: Phaser.GameObjects.TileSprite;
    startTrigger: SpriteWithDynamicBody;
    spawnInterval: number = 1500
    spawnTime: number = 0
    score: number = 0
    scoreInterval: number = 300
    scoreDeltaTime: number = 0
    scoreText: Phaser.GameObjects.Text
    hiScore: number = 0
    hiScoreText: Phaser.GameObjects.Text
    progressSound: Phaser.Sound.HTML5AudioSound
    obstacles: Phaser.Physics.Arcade.Group
    clouds: Phaser.GameObjects.Group
    gameSpeed: number = 10
    gameSpeedModifyer: number = 1
    gameOverText: Phaser.GameObjects.Image
    gameOverContainer: Phaser.GameObjects.Container
    restartText: Phaser.GameObjects.Image

    constructor() {
        //debugger
        super("PlayScene");
    }
    create() {
        this.createEnvironment();
        this.createPlayer();
        this.createObstacles()
        this.createGameoverContainer()
        this.createAnimations()
        this.createScore()
        this.handleGameStart()
        this.handleObstacleCollisions()
        this.handleGameRestart()
        this.progressSound = this.sound.add('progress', { volume: 1 }) as Phaser.Sound.HTML5AudioSound
    }
    createScore() {
        this.scoreText = this.add.text(this.gameWidth, 0, '00000', {
            fontSize: 30,
            fontFamily: 'Arial',
            color: '#535353'
        })
            .setOrigin(1, 0)
            .setAlpha(0)

        this.hiScoreText = this.add.text(this.gameWidth - 100, 0, '00000', {
            fontSize: 30,
            fontFamily: 'Arial',
            color: '#535353'
        })
            .setOrigin(1, 0)
            .setAlpha(0)
    }
    createAnimations() {
        this.anims.create({
            key: 'enemy-bird-fly',
            frames: this.anims.generateFrameNumbers('enemy-bird'),
            frameRate: 6,
            repeat: -1
        })
    }
    createPlayer() {
        this.player = new Player(this, 0, this.gameHeight)
    }
    createEnvironment() {
        this.ground = this.add
            .tileSprite(0, this.gameHeight, 88, 26, "ground")
            .setOrigin(0, 1);

        this.clouds = this.add.group()
        this.clouds = this.clouds.addMultiple([
            this.add.image(this.gameWidth / 2, 170, 'cloud'),
            this.add.image(this.gameWidth / 4, 80, 'cloud'),
            this.add.image(this.gameWidth / 1.3, 130, 'cloud')
        ])

        this.clouds.setAlpha(0)
    }

    createObstacles() {
        this.obstacles = this.physics.add.group();
    }

    createGameoverContainer() {
        this.gameOverText = this.add.image(0, 0, 'game-over')
        this.restartText = this.add.image(0, 80, 'restart').setInteractive()
        this.gameOverContainer = this.add.container(this.gameWidth / 2, (this.gameHeight / 2) - 50)
            .add(this.gameOverText)
            .add(this.restartText)
            .setAlpha(0)
    }
    spawnObstacle() {
        const obstaclesCount = PRELOAD_CONFIG.birdsCount + PRELOAD_CONFIG.cactusesCount
        const obstacleNum = Math.floor(Math.random() * obstaclesCount) + 1
        const distance = Phaser.Math.Between(600, 900)
        if (obstacleNum > PRELOAD_CONFIG.cactusesCount) {
            const enemyPossibleHeight = [20, 70]
            const enemyHeight = enemyPossibleHeight[Math.floor(Math.random() * 2)]
            this.obstacles
                .create(distance, this.gameHeight - enemyHeight, `enemy-bird`)
                .setOrigin(0, 1)
                .setImmovable()
                .play('enemy-bird-fly', true)

        } else {
            this.obstacles
                .create(distance, this.gameHeight, `obstacle-${obstacleNum}`)
                .setOrigin(0, 1)
                .setImmovable()
        }
    }
    handleGameStart() {
        this.startTrigger = this.physics.add.sprite(0, 10, null)
            .setAlpha(0)
            .setOrigin(0, 1)

        this.physics.add.overlap(this.startTrigger, this.player, () => {
            if (this.startTrigger.y === 10) {
                this.startTrigger.body.reset(0, this.gameHeight)
                return
            }

            this.startTrigger.body.reset(999, 999)
            const rollOutEvent = this.time.addEvent({
                delay: 1000 / 60,
                loop: true,
                callback: () => {
                    this.player.playRunAnimation()
                    this.player.setVelocityX(50)
                    this.ground.width += 17

                    if (this.ground.width >= this.gameWidth) {
                        rollOutEvent.remove()
                        this.ground.width = this.gameWidth
                        this.player.setVelocityX(0)
                        this.clouds.setAlpha(1)
                        this.scoreText.setAlpha(1)
                        this.hiScoreText.setAlpha(0)
                        this.isGameRunning = true
                    }
                }
            })
        })

    }
    handleGameRestart() {
        this.restartText.on('pointerdown', () => {
            this.physics.resume()
            this.player.setVelocityY(0)
            this.obstacles.clear(true, true)
            this.gameOverContainer.setAlpha(0)
            this.anims.resumeAll()
            this.hiScoreText.setAlpha(0)
            this.isGameRunning = true
        })
    }
    handleObstacleCollisions() {
        this.physics.add.collider(this.obstacles, this.player, () => {
            this.isGameRunning = false
            this.physics.pause()
            this.anims.pauseAll()
            this.player.die()
            this.gameOverContainer.setAlpha(1)

            if (this.score > this.hiScore) {
                this.hiScore = this.score
                this.hiScoreText.setText('HI ' + this.scoreText.text)
                this.hiScoreText.setAlpha(1)
            }
            this.spawnTime = 0
            this.gameSpeed = 12 * this.gameSpeedModifyer
            this.scoreDeltaTime = 0
            this.score = 0//RESTART
            this.gameSpeedModifyer = 1
        })
    }
    update(time: number, delta: number): void {
        if (!this.isGameRunning) return

        this.spawnTime += delta
        this.scoreDeltaTime += delta

        if (this.scoreDeltaTime >= this.scoreInterval) {
            this.scoreDeltaTime = 0
            this.score++
            console.log(this.score)

            if (this.score % 10 === 0) {
                this.gameSpeedModifyer += 0.1
                this.tweens.add({
                    targets: this.scoreText,
                    duration: 100,
                    repeat: 3,
                    alpha: 0,
                    yoyo: true
                })
                this.progressSound.play()
            }
        }

        if (this.spawnTime > this.spawnInterval) {
            this.spawnObstacle()
            this.spawnTime = 0
        }
        const obstaclesArray = this.obstacles.getChildren()
        const cloudsArray = this.clouds.getChildren()
        Phaser.Actions.IncX(obstaclesArray, - this.gameSpeed * this.gameSpeedModifyer)
        Phaser.Actions.IncX(cloudsArray, - 0.5)

        const score = Array.from(String(this.score), Number)

        for (let i = 0; i < 5 - String(this.score).length; i++) {
            score.unshift(0)
        }

        this.scoreText.setText(score.join(''))

        obstaclesArray.forEach((obstacle: SpriteWithDynamicBody) => {
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle)
            }
        })

        cloudsArray.forEach((cloud: SpriteWithDynamicBody) => {
            if (cloud.getBounds().right < 0) {
                cloud.setX(this.gameWidth + 30)//cloud.x = 
            }
        })

        this.ground.tilePositionX += this.gameSpeed * this.gameSpeedModifyer
    }
}

export default PlayScene;