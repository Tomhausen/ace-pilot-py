namespace SpriteKind {
    export const player_projectile = SpriteKind.create()
    export const enemy_projectile = SpriteKind.create()
}

//  variables
let player_speed = 50
let player_turn = 3
let projectile_speed = 150
let enemy_speed = 50
let enemy_turn = 3
let enemy_count = 0
// 
let wave = 1
// 
//  sprites
let player_plane = sprites.create(assets.image`player`, SpriteKind.Player)
transformSprites.rotateSprite(player_plane, 90)
let enemy_count_sprite = textsprite.create("")
// 
enemy_count_sprite.setOutline(1, 15)
// 
enemy_count_sprite.setFlag(SpriteFlag.RelativeToCamera, true)
// 
enemy_count_sprite.bottom = 120
// 
enemy_count_sprite.left = 0
// 
//  setup
scene.setBackgroundColor(9)
scene.setTileMapLevel(assets.tilemap`level`)
scene.cameraFollowSprite(player_plane)
function fire(sprite: Sprite, speed: number, kind: number) {
    let proj = sprites.create(assets.image`projectile`, kind)
    proj.setFlag(SpriteFlag.DestroyOnWall, true)
    proj.setPosition(sprite.x, sprite.y)
    calculate_velocity(sprite, proj, speed)
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    fire(player_plane, projectile_speed, SpriteKind.player_projectile)
})
function place_sprite(sprite: Sprite) {
    let col = randint(1, grid.numColumns())
    let row = randint(1, grid.numRows())
    tiles.placeOnTile(sprite, tiles.getTileLocation(col, row))
    if (spriteutils.distanceBetween(sprite, player_plane) < 120) {
        place_sprite(sprite)
    }
    
}

function get_dir_to_player(enemy: Sprite): number {
    let target_dir = spriteutils.angleFrom(enemy, player_plane)
    target_dir = spriteutils.radiansToDegrees(target_dir) + 90
    return target_dir
}

function spawn_enemy() {
    
    // 
    let enemy = sprites.create(assets.image`enemy`, SpriteKind.Enemy)
    enemy_count += 1
    // 
    sprites.setDataNumber(enemy, "turn", 0)
    transformSprites.rotateSprite(enemy, 90)
    place_sprite(enemy)
    transformSprites.rotateSprite(enemy, get_dir_to_player(enemy))
}

//  game.on_update_interval(4000, spawn_enemy)
function new_wave() {
    // 
    
    for (let i = 0; i < wave; i++) {
        spawn_enemy()
    }
    let message = textsprite.create("NEW WAVE")
    message.setOutline(1, 15)
    message.setFlag(SpriteFlag.RelativeToCamera, true)
    message.setPosition(80, 40)
    message.lifespan = 3000
    wave += 1
}

// 
sprites.onOverlap(SpriteKind.player_projectile, SpriteKind.Enemy, function destroy_enemy(proj: Sprite, enemy: Sprite) {
    
    // 
    info.changeScoreBy(100)
    enemy.destroy()
    enemy_count -= 1
})
sprites.onOverlap(SpriteKind.enemy_projectile, SpriteKind.Player, function take_damage(proj: Sprite, player: Sprite) {
    proj.destroy()
    info.changeLifeBy(-1)
})
function hit_edge(sprite: Sprite, location: tiles.Location) {
    transformSprites.changeRotation(sprite, 180)
}

scene.onHitWall(SpriteKind.Player, hit_edge)
scene.onHitWall(SpriteKind.Enemy, hit_edge)
function calculate_velocity(direction_sprite: Sprite, sprite: Sprite, speed: number) {
    let direction = transformSprites.getRotation(direction_sprite)
    direction = spriteutils.degreesToRadians(direction)
    sprite.vx = Math.sin(direction) * speed
    sprite.vy = Math.cos(direction) * -speed
}

function player_controls() {
    if (controller.up.isPressed()) {
        transformSprites.changeRotation(player_plane, -player_turn)
    } else if (controller.down.isPressed()) {
        transformSprites.changeRotation(player_plane, player_turn)
    }
    
    calculate_velocity(player_plane, player_plane, player_speed)
}

function far_from_player(enemy: Sprite) {
    let direction = transformSprites.getRotation(enemy)
    if (get_dir_to_player(enemy) - direction < 3) {
        sprites.setDataNumber(enemy, "turn", -enemy_turn)
    }
    
    if (get_dir_to_player(enemy) - direction > 3) {
        sprites.setDataNumber(enemy, "turn", enemy_turn)
    }
    
}

function enemy_behaviour(enemy: Sprite) {
    if (spriteutils.distanceBetween(enemy, player_plane) > 80) {
        far_from_player(enemy)
    } else if (spriteutils.distanceBetween(enemy, player_plane) < 40) {
        sprites.setDataNumber(enemy, "turn", enemy_turn)
    } else {
        sprites.setDataNumber(enemy, "turn", 0)
    }
    
    transformSprites.changeRotation(enemy, sprites.readDataNumber(enemy, "turn"))
    calculate_velocity(enemy, enemy, enemy_speed)
    if (randint(1, 150) == 1) {
        fire(enemy, projectile_speed - 50, SpriteKind.enemy_projectile)
    }
    
}

game.onUpdate(function tick() {
    player_controls()
    if (enemy_count < 1) {
        // 
        new_wave()
    }
    
    // 
    enemy_count_sprite.setText("Enemy count: " + enemy_count)
    // 
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_behaviour(enemy)
    }
})
