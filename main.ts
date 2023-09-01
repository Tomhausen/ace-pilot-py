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
//  sprites
let player_plane = sprites.create(assets.image`player`, SpriteKind.Player)
transformSprites.rotateSprite(player_plane, 90)
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

game.onUpdateInterval(4000, function spawn_enemy() {
    let enemy = sprites.create(assets.image`enemy`, SpriteKind.Enemy)
    sprites.setDataNumber(enemy, "turn", 0)
    transformSprites.rotateSprite(enemy, 90)
    place_sprite(enemy)
    transformSprites.rotateSprite(enemy, get_dir_to_player(enemy))
})
sprites.onOverlap(SpriteKind.player_projectile, SpriteKind.Enemy, function destroy_enemy(proj: Sprite, enemy: Sprite) {
    info.changeScoreBy(100)
    enemy.destroy()
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
    sprite.setVelocity(Math.sin(direction) * speed, Math.cos(direction) * -speed)
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
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_behaviour(enemy)
    }
})
