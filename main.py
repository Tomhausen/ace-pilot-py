@namespace
class SpriteKind:
    player_projectile = SpriteKind.create()
    enemy_projectile = SpriteKind.create()
    effect = SpriteKind.create()

# variables
player_speed = 50
player_turn = 3
projectile_speed = 150
enemy_speed = 50
enemy_turn = 3
enemy_count = 0 #
wave = 1 #

# sprites
player_plane = sprites.create(assets.image("player"), SpriteKind.player)
transformSprites.rotate_sprite(player_plane, 90)
enemy_count_sprite = textsprite.create("") #
enemy_count_sprite.set_outline(1, 15) #
enemy_count_sprite.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True) #
enemy_count_sprite.bottom = 120 #
enemy_count_sprite.left = 0 #

# setup
scene.set_background_color(9)
scene.set_tile_map_level(assets.tilemap("level"))
scene.camera_follow_sprite(player_plane)

def fire(sprite: Sprite, speed: number, kind):
    proj = sprites.create(assets.image("projectile"), kind)
    proj.set_flag(SpriteFlag.DESTROY_ON_WALL, True)
    proj.set_position(sprite.x, sprite.y)
    calculate_velocity(sprite, proj, speed)

def player_fire():
    fire(player_plane, projectile_speed, SpriteKind.player_projectile)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def place_sprite(sprite: Sprite):
    col = randint(1, grid.num_columns())
    row = randint(1, grid.num_rows())
    tiles.place_on_tile(sprite, tiles.get_tile_location(col, row))
    if spriteutils.distance_between(sprite, player_plane) < 120:
        place_sprite(sprite)

def get_dir_to_player(enemy: Sprite):
    target_dir = spriteutils.angle_from(enemy, player_plane)
    target_dir = spriteutils.radians_to_degrees(target_dir) + 90
    return target_dir

def spawn_enemy():
    global enemy_count #
    enemy = sprites.create(assets.image("enemy"), SpriteKind.enemy)
    enemy_count += 1 #
    sprites.set_data_number(enemy, "turn", 0)
    transformSprites.rotate_sprite(enemy, 90)
    place_sprite(enemy)
    transformSprites.rotate_sprite(enemy, get_dir_to_player(enemy))
# game.on_update_interval(4000, spawn_enemy)

def new_wave(): #
    global wave
    for i in range(wave):
        spawn_enemy()
    message = textsprite.create("NEW WAVE")
    message.set_outline(1, 15)
    message.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
    message.set_position(80, 40)
    message.lifespan = 3000
    wave += 1

def destroy_enemy(proj, enemy):
    global enemy_count #
    info.change_score_by(100)
    sprites.destroy(enemy)
    enemy_count -= 1 #
sprites.on_overlap(SpriteKind.player_projectile, SpriteKind.enemy, destroy_enemy)

def take_damage(proj, player):
    sprites.destroy(proj)
    info.change_life_by(-1)
sprites.on_overlap(SpriteKind.enemy_projectile, SpriteKind.player, take_damage)

def hit_edge(sprite, location):
    transformSprites.change_rotation(sprite, 180)
scene.on_hit_wall(SpriteKind.player, hit_edge)
scene.on_hit_wall(SpriteKind.enemy, hit_edge)

def calculate_velocity(direction_sprite: Sprite, sprite: Sprite, speed: number):
    direction = transformSprites.get_rotation(direction_sprite)
    direction = spriteutils.degrees_to_radians(direction)
    sprite.vx = Math.sin(direction) * speed
    sprite.vy = Math.cos(direction) * -speed

def player_controls():
    if controller.up.is_pressed():
        transformSprites.change_rotation(player_plane, -player_turn)
    elif controller.down.is_pressed():
        transformSprites.change_rotation(player_plane, player_turn)
    calculate_velocity(player_plane, player_plane, player_speed)

def far_from_player(enemy: Sprite):
    direction = transformSprites.get_rotation(enemy)
    if (get_dir_to_player(enemy) - direction) < 3:
        sprites.set_data_number(enemy, "turn", -enemy_turn)
    if (get_dir_to_player(enemy) - direction) > 3:
        sprites.set_data_number(enemy, "turn", enemy_turn)

def enemy_behaviour(enemy: Sprite):
    if spriteutils.distance_between(enemy, player_plane) > 80:
        far_from_player(enemy)
    elif spriteutils.distance_between(enemy, player_plane) < 40:
        sprites.set_data_number(enemy, "turn", enemy_turn)
    else:
        sprites.set_data_number(enemy, "turn", 0)
    transformSprites.change_rotation(enemy, sprites.read_data_number(enemy, "turn"))
    calculate_velocity(enemy, enemy, enemy_speed)
    if randint(1, 50) == 1:
        fire(enemy, projectile_speed - 50, SpriteKind.enemy_projectile)
    
def destroy_smoke(smoke: Sprite): #
    for i in range(info.life() * 5):
        smoke.image.set_pixel(randint(0, 15), randint(0, 15), 0)

def spawn_smoke_trail(): #
    if info.life() < 3:
        smoke = sprites.create(assets.image("smoke"), SpriteKind.effect)
        smoke.set_position(player_plane.x, player_plane.y)
        smoke.scale = 1 / info.life()
        smoke.z = -5
        smoke.lifespan = 3000 / info.life()
game.on_update_interval(200, spawn_smoke_trail)

def tick():
    player_controls()
    if enemy_count < 1: #
        new_wave() #
    enemy_count_sprite.set_text("Enemy count: " + enemy_count) #
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        enemy_behaviour(enemy)
    for smoke in sprites.all_of_kind(SpriteKind.effect): # 
        destroy_smoke(smoke) # 
game.on_update(tick)
