const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let monkey;
let cursors;
let clouds;
let score = 0;
let scoreText;

function preload() {
    // 添加加载进度监控
    this.load.on('progress', (value) => {
        console.log(`加载进度: ${Math.round(value * 100)}%`);
    });

    // 图片加载
    this.load.image('sky', 'image/sky.png');
    this.load.image('monkey', 'image/monkey.png');
    this.load.image('cloud', 'image/cloud1.0.png');

    // 错误处理
    this.load.on('loaderror', (file) => {
        console.error('加载失败:', file.key, '错误:', file.error);
    });
}

let lastCloudX = 400; // 记录上一个云朵的X坐标
let direction = -1; // 移动方向：-1向左，1向右
let cloudCount = 0; // 跟踪当前云朵数量
const MAX_CLOUDS = 8; // 将最大云朵数量改为8

function create() {
    // 背景
    this.add.image(400, 300, 'sky');

    // 猴子角色
    monkey = this.physics.add.sprite(100, 450, 'monkey');
    monkey.setCollideWorldBounds(true);
    monkey.setScale(0.5);

    // 键盘控制
    cursors = this.input.keyboard.createCursorKeys();

    // 云朵平台
    // 修改云朵组创建方式（从staticGroup改为dynamicGroup）
    clouds = this.physics.add.group();



    // 碰撞检测与云朵消失（增加跳跃高度）
    this.physics.add.collider(monkey, clouds, (monkey, cloud) => {
        monkey.setVelocityY(-800); // 从-330提高到-450
        score += 5;
        scoreText.setText('分数: ' + score);

        // 云朵消失效果
        cloud.disableBody(true, true);

        // 创建新云朵
        createCloud(this, Phaser.Math.Between(100, 700), monkey.y - Phaser.Math.Between(200, 300));
    });

    // 分数显示
    scoreText = this.add.text(16, 16, '分数: 0', { fontSize: '24px', fill: '#000' });



    // 修改猴子物理属性（降低重力加速度）
    // 进一步降低重力加速度
    monkey.setGravityY(200); // 从300降低到200
    monkey.setBounce(0.05); // 进一步降低弹跳效果

    // 移除所有嵌套定时器，只保留一个云朵生成器
    // 修改云朵生成逻辑，调整垂直间距
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (cloudCount < MAX_CLOUDS) {
                lastCloudX += direction * 100; // 从150减少到100

                if (lastCloudX < 100) {
                    lastCloudX = 100;
                    direction = 1;
                } else if (lastCloudX > 700) {
                    lastCloudX = 700;
                    direction = -1;
                }

                const newY = monkey.y - 360;
                createCloud(this, lastCloudX, newY);
                cloudCount++;
            }
        },
        loop: true
    });

    // 修改云朵生成逻辑，加快生成速度
    this.time.addEvent({
        delay: 500,  // 从1000改为500毫秒
        callback: () => {
            if (cloudCount < MAX_CLOUDS) {
                lastCloudX += direction * 100;

                if (lastCloudX < 100) {
                    lastCloudX = 100;
                    direction = 1;
                } else if (lastCloudX > 700) {
                    lastCloudX = 700;
                    direction = -1;
                }

                // 调整生成位置，使云朵更连贯
                const newY = monkey.y - Phaser.Math.Between(300, 400); // 从固定360改为300-400随机
                createCloud(this, lastCloudX, newY);
                cloudCount++;
            }
        },
        loop: true
    });

    // 修改碰撞检测中的跳跃高度
    this.physics.add.collider(monkey, clouds, (monkey, cloud) => {
        monkey.setVelocityY(-450); // 保持与跳跃高度一致
        score += 5;
        scoreText.setText('分数: ' + score);
        cloud.disableBody(true, true);
        cloudCount--;
    });
    // 修改碰撞检测逻辑，添加二次跳跃能力
    this.physics.add.collider(monkey, clouds, (monkey, cloud) => {
        // 允许从上方或下方触碰云朵时跳跃
        if (monkey.body.touching.down || monkey.body.touching.up) {
            monkey.setVelocityY(-450);
            score += 5;
            scoreText.setText('分数: ' + score);

            // 云朵消失效果
            cloud.disableBody(true, true);
            cloudCount--;

            // 立即生成新云朵
            if (cloudCount < MAX_CLOUDS) {
                const newX = Phaser.Math.Between(100, 700);
                const newY = monkey.y - 360;
                createCloud(this, newX, newY);
                cloudCount++;
            }
        }
    });
}

function createCloud(scene, x, y) {
    const cloud = clouds.create(x, y, 'cloud');
    cloud.setScale(0.5);
    cloud.body.immovable = false;
    cloud.body.allowGravity = true;
    cloud.body.setGravityY(200);  // 
    cloud.body.setCollideWorldBounds(false);
    return cloud;
}

function update() {
    // 左右移动（将速度从300提高到500）
    if (cursors.left.isDown) {
        monkey.setVelocityX(-400);
        monkey.flipX = true;
    }
    else if (cursors.right.isDown) {
        monkey.setVelocityX(500);
        monkey.flipX = false;
    }
    else {
        monkey.setVelocityX(0);
    }

    // 跳跃控制（仅在接触地面时允许跳跃）
    if (cursors.up.isDown && monkey.body.blocked.down) {
        monkey.setVelocityY(-450);
    }

    // 强制下坠速度（防止卡在空中）
    if (!monkey.body.blocked.down && monkey.body.velocity.y < 300) {
        monkey.setVelocityY(monkey.body.velocity.y + 5);
    }

    // 优化后的自动滚动逻辑
    if (monkey.y < 400) {
        const scrollAmount = 400 - monkey.y;
        monkey.y += scrollAmount * 0.05;

        // 云朵同步滚动（添加坠落检测）
        clouds.children.iterate(function (cloud) {
            if (cloud && cloud.body) {
                cloud.body.updateFromGameObject();
                cloud.y += scrollAmount * 0.05;

                // 检测云朵是否坠落到底部
                if (cloud.y > 600) {
                    cloud.destroy();
                    cloudCount--;
                }
            }
        }, this);
    }


    // 检查通关条件（放在update中确保每帧检测）
    if (score >= 300 && !this.gameOver) {
        this.gameOver = true;
        this.physics.pause();
        this.scene.pause();
        this.add.text(400, 250, '恭喜通关！', {  // 将Y坐标从300改为250
            fontSize: '48px',
            fill: '#ff0000',
            align: 'center',
            backgroundColor: '#ffffff',  // 添加白色背景
            padding: { x: 20, y: 10 }    // 增加内边距
        }).setOrigin(0.5).setDepth(9999);  // 将深度设为最大值
        return;
    }

}