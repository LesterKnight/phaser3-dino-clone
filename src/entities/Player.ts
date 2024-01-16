import BaseGameScene from "../scenes/BaseGameScene";

export class Player extends Phaser.Physics.Arcade.Sprite {

    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    scene: BaseGameScene
    jumpSound: Phaser.Sound.HTML5AudioSound
    dieSound: Phaser.Sound.HTML5AudioSound
    constructor(scene: BaseGameScene, x: number, y: number) {
        super(scene, x, y, 'dino-run');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.init()
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this)
    }

    init() {
        this.cursors = this.scene.input.keyboard.createCursorKeys()
        this
            .setOrigin(0, 0)
            .setGravityY(4000)
            .setCollideWorldBounds(true)
            .setBodySize(50, 90)
            .setOffset(20, 0)
            .setDepth(1)
        this.registerAnimations()
        this.registerSounds()
        //this.registerPlayerControl();


    }
    registerSounds() {
        this.jumpSound = this.scene.sound.add('jump', { volume: 1 }) as Phaser.Sound.HTML5AudioSound
        this.dieSound = this.scene.sound.add('hit', { volume: 1 }) as Phaser.Sound.HTML5AudioSound
    }
    registerPlayerControl() {// OLD
        const spaceBar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceBar.on('down', () => {
            this.setVelocityY(-5000);

        })
    }
    update(...args: any[]): void {
        const { space, down } = this.cursors
        const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space)

        const isDownJustDown = Phaser.Input.Keyboard.JustDown(down)
        const isDownJustUp = Phaser.Input.Keyboard.JustUp(down)

        const onFloor = (this.body as Phaser.Physics.Arcade.Body).onFloor()

        if (isSpaceJustDown && onFloor) {
            this.setVelocityY(-1420);
            if (this.scene.isGameRunning)
                this.jumpSound.play()
        }


        if (isDownJustDown && onFloor) {
            this.body.setSize(this.body.width, 58)//diminui body size
            this.setOffset(60, 34)//altera a referencia de inicio no sprite
        }

        if (isDownJustUp && onFloor) {
            this.body.setSize(44, 92)
            this.setOffset(20, 0)
        }

        if (!this.scene.isGameRunning) {//(this.scene as any).isGameRunning)
            return
        }
        if (this.body.deltaAbsY() > 0) {//console.log(this.body.y)
            this.anims.stop()
            this.setTexture('dino-run', 0)
        }
        else {
            this.playRunAnimation()
        }
    }
    registerAnimations() {
        this.anims.create({
            key: 'dino-runs',
            frames: this.anims.generateFrameNames('dino-run', { start: 2, end: 3 }),
            frameRate: 10,
            repeat: -1,

        })

        this.anims.create({
            key: 'dino-down',
            frames: this.anims.generateFrameNames('dino-down'),
            frameRate: 10,
            repeat: -1,

        })
    }
    playRunAnimation() {
        this.body.height <= 58 ?
            this.play('dino-down', true) :
            this.play('dino-runs', true)
    }
    die() {
        this.anims.pause()
        this.setTexture('dino-hurt')
        this.dieSound.play()
    }
}