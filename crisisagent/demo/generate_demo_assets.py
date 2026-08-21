#!/usr/bin/env python3
"""
CrisisAgent Demo Asset Generator
Generates high-resolution, professional architectural floor plan images for:
- Building A: Corporate Office (1200x800px)
- Building B: Metropolitan Medical Center (1200x900px)

Usage:
    python generate_demo_assets.py
"""

from __future__ import annotations
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


# ============================================================================
# Color Palette & Styling Constants
# ============================================================================

BG_COLOR = (252, 253, 255)            # Crisp off-white architectural background
GRID_COLOR = (235, 240, 245)          # Very subtle blueprint coordinate grid
EXT_WALL_COLOR = (15, 23, 42)         # Slate-900 for thick exterior structural walls
INT_WALL_COLOR = (51, 65, 85)         # Slate-700 for interior dividing walls
DOOR_ARC_COLOR = (148, 163, 184)      # Slate-400 for door swing radius
DOOR_LEAF_COLOR = (71, 85, 105)       # Slate-600 for open door line

# Zone fills (subtle pastels for architectural clarity)
ROOM_FILL = (241, 245, 249)           # Soft slate tint
PATIENT_FILL = (239, 246, 255)        # Soft blue for patient rooms
OR_FILL = (236, 253, 245)             # Soft emerald for operating rooms
WAITING_FILL = (254, 243, 199)        # Soft amber for waiting area
NURSE_FILL = (238, 242, 255)          # Soft indigo for nurse station
ISO_FILL = (254, 242, 242)            # Soft rose for isolation ward
CORRIDOR_FILL = (248, 250, 252)       # Lightest gray for corridors
STAIR_FILL = (243, 244, 246)          # Neutral gray for stairwells

# High-contrast indicators
EXIT_GREEN = (16, 185, 129)           # Emerald-500
EXIT_GREEN_BG = (209, 250, 229)       # Emerald-100
EXIT_TEXT = (6, 95, 70)               # Emerald-800
STAIR_TREAD = (100, 116, 139)         # Slate-500
TEXT_MAIN = (15, 23, 42)              # Slate-900
TEXT_MUTED = (100, 116, 139)          # Slate-500
HEADER_BG = (15, 23, 42)              # Dark banner
HEADER_TEXT = (255, 255, 255)


def get_fonts() -> dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    """Load scalable true-type fonts with fallback to PIL default."""
    font_candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    
    font_path = None
    for candidate in font_candidates:
        if os.path.exists(candidate):
            font_path = candidate
            break
            
    if font_path:
        try:
            return {
                "title": ImageFont.truetype(font_path, 22),
                "header": ImageFont.truetype(font_path, 16),
                "room_id": ImageFont.truetype(font_path, 18),
                "room_name": ImageFont.truetype(font_path, 12),
                "meta": ImageFont.truetype(font_path, 10),
                "exit": ImageFont.truetype(font_path, 13),
                "legend": ImageFont.truetype(font_path, 11),
            }
        except Exception:
            pass
            
    # Fallback to default bitmap font
    default_font = ImageFont.load_default()
    return {
        "title": default_font,
        "header": default_font,
        "room_id": default_font,
        "room_name": default_font,
        "meta": default_font,
        "exit": default_font,
        "legend": default_font,
    }


def draw_subtle_grid(draw: ImageDraw.ImageDraw, width: int, height: int, step: int = 40) -> None:
    """Draw an architectural blueprint alignment grid."""
    for x in range(0, width, step):
        draw.line([(x, 50), (x, height - 30)], fill=GRID_COLOR, width=1)
    for y in range(50, height - 30, step):
        draw.line([(0, y), (width, y)], fill=GRID_COLOR, width=1)


def draw_title_bar(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    width: int,
    building_code: str,
    building_title: str,
    building_sub: str
) -> None:
    """Draw top header banner with title and metadata."""
    # Top banner bar
    draw.rectangle([(0, 0), (width, 48)], fill=HEADER_BG)
    draw.rectangle([(0, 48), (width, 52)], fill=(59, 130, 246))  # Accent blue line
    
    # Left title
    title_text = f"CRISISAGENT DIGITAL TWIN — {building_code}: {building_title.upper()}"
    draw.text((20, 14), title_text, fill=HEADER_TEXT, font=fonts["header"])
    
    # Right subtitle / status
    draw.text((width - 340, 16), f"MODEL: {building_sub}  |  STATUS: MONITORED", fill=(148, 163, 184), font=fonts["meta"])
    
    # Bottom footer border
    draw.line([(0, 0), (width, 0)], fill=EXT_WALL_COLOR, width=2)
    draw.line([(0, 0), (0, 800)], fill=EXT_WALL_COLOR, width=2)


def draw_north_arrow_and_scale(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    x: int,
    y: int,
    scale_meters: int = 10
) -> None:
    """Draw a compass North arrow and architectural scale bar."""
    # Compass Rose
    cx, cy, r = x, y, 16
    draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline=INT_WALL_COLOR, width=1)
    # North pointer
    draw.polygon([(cx, cy - r + 2), (cx - 5, cy + 2), (cx, cy - 2)], fill=EXT_WALL_COLOR)
    draw.polygon([(cx, cy - r + 2), (cx + 5, cy + 2), (cx, cy - 2)], outline=EXT_WALL_COLOR, fill=(255, 255, 255))
    draw.text((cx - 4, cy - r - 12), "N", fill=EXT_WALL_COLOR, font=fonts["meta"])
    
    # Scale Bar
    sx = x + 35
    sy = y - 4
    scale_px = 90
    draw.line([(sx, sy), (sx + scale_px, sy)], fill=EXT_WALL_COLOR, width=2)
    draw.line([(sx, sy - 4), (sx, sy + 4)], fill=EXT_WALL_COLOR, width=2)
    draw.line([(sx + scale_px // 2, sy - 3), (sx + scale_px // 2, sy + 3)], fill=EXT_WALL_COLOR, width=1)
    draw.line([(sx + scale_px, sy - 4), (sx + scale_px, sy + 4)], fill=EXT_WALL_COLOR, width=2)
    draw.text((sx, sy + 6), "0", fill=TEXT_MUTED, font=fonts["meta"])
    draw.text((sx + scale_px // 2 - 4, sy + 6), f"{scale_meters//2}m", fill=TEXT_MUTED, font=fonts["meta"])
    draw.text((sx + scale_px - 8, sy + 6), f"{scale_meters}m", fill=TEXT_MUTED, font=fonts["meta"])


def draw_stairwell(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    rect: tuple[int, int, int, int],
    stair_id: str,
    name: str = "Stairs",
    orientation: str = "vertical"
) -> None:
    """Draw a detailed architectural stairwell with zigzag / tread hatch and arrow."""
    x1, y1, x2, y2 = rect
    draw.rectangle([rect[0:2], rect[2:4]], fill=STAIR_FILL, outline=EXT_WALL_COLOR, width=2)
    
    # Inner border
    draw.rectangle([(x1 + 3, y1 + 3), (x2 - 3, y2 - 3)], outline=INT_WALL_COLOR, width=1)
    
    # Draw treads
    if orientation == "vertical":
        step = 10
        tread_y = y1 + 10
        while tread_y < y2 - 10:
            draw.line([(x1 + 6, tread_y), (x2 - 6, tread_y)], fill=STAIR_TREAD, width=1)
            tread_y += step
        # Central directional line with arrow
        mid_x = (x1 + x2) // 2
        draw.line([(mid_x, y2 - 14), (mid_x, y1 + 14)], fill=EXT_WALL_COLOR, width=2)
        draw.polygon([(mid_x, y1 + 10), (mid_x - 4, y1 + 18), (mid_x + 4, y1 + 18)], fill=EXT_WALL_COLOR)
    else:
        step = 10
        tread_x = x1 + 10
        while tread_x < x2 - 10:
            draw.line([(tread_x, y1 + 6), (tread_x, y2 - 6)], fill=STAIR_TREAD, width=1)
            tread_x += step
        mid_y = (y1 + y2) // 2
        draw.line([(x1 + 14, mid_y), (x2 - 14, mid_y)], fill=EXT_WALL_COLOR, width=2)
        draw.polygon([(x2 - 10, mid_y), (x2 - 18, mid_y - 4), (x2 - 18, mid_y + 4)], fill=EXT_WALL_COLOR)
        
    # Badge Label
    badge_w, badge_h = 44, 20
    bx = (x1 + x2 - badge_w) // 2
    by = (y1 + y2 - badge_h) // 2
    draw.rectangle([(bx, by), (bx + badge_w, by + badge_h)], fill=(255, 255, 255), outline=INT_WALL_COLOR, width=1)
    draw.text((bx + 6, by + 2), stair_id, fill=TEXT_MAIN, font=fonts["room_id"])
    
    # Subtitle
    draw.text((x1 + 6, y2 - 16), "STAIRS (UP/DN)", fill=TEXT_MUTED, font=fonts["meta"])


def draw_exit_badge(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    rect: tuple[int, int, int, int],
    exit_id: str,
    label: str = "EXIT",
    arrow_dir: str = "left"
) -> None:
    """Draw a prominent green emergency exit door marker with directional indicator."""
    x1, y1, x2, y2 = rect
    draw.rectangle([rect[0:2], rect[2:4]], fill=EXIT_GREEN_BG, outline=EXIT_GREEN, width=3)
    
    # Inner border
    draw.rectangle([(x1 + 3, y1 + 3), (x2 - 3, y2 - 3)], outline=EXIT_GREEN, width=1)
    
    # Green icon badge
    mid_x = (x1 + x2) // 2
    mid_y = (y1 + y2) // 2
    
    # Draw EXIT text badge
    draw.text((mid_x - 22, mid_y - 12), f"🚨 {label}", fill=EXIT_TEXT, font=fonts["exit"])
    draw.text((mid_x - 14, mid_y + 4), f"[{exit_id}]", fill=EXIT_TEXT, font=fonts["meta"])
    
    # Directional arrow
    if arrow_dir == "left":
        draw.polygon([(x1 - 10, mid_y), (x1 - 2, mid_y - 6), (x1 - 2, mid_y + 6)], fill=EXIT_GREEN)
        draw.line([(x1 - 2, mid_y), (x1 + 8, mid_y)], fill=EXIT_GREEN, width=3)
    elif arrow_dir == "right":
        draw.polygon([(x2 + 10, mid_y), (x2 + 2, mid_y - 6), (x2 + 2, mid_y + 6)], fill=EXIT_GREEN)
        draw.line([(x2 + 2, mid_y), (x2 - 8, mid_y)], fill=EXIT_GREEN, width=3)
    elif arrow_dir == "down":
        draw.polygon([(mid_x, y2 + 10), (mid_x - 6, y2 + 2), (mid_x + 6, y2 + 2)], fill=EXIT_GREEN)
        draw.line([(mid_x, y2 + 2), (mid_x, y2 - 8)], fill=EXIT_GREEN, width=3)


def draw_door_swing(
    draw: ImageDraw.ImageDraw,
    hinge: tuple[int, int],
    swing_radius: int,
    angle_start: float,
    angle_end: float,
    orientation: str = "horizontal"
) -> None:
    """Draw architectural 90-degree door swing arc and open door leaf line."""
    hx, hy = hinge
    # Arc bounding box
    bbox = [hx - swing_radius, hy - swing_radius, hx + swing_radius, hy + swing_radius]
    draw.arc(bbox, start=angle_start, end=angle_end, fill=DOOR_ARC_COLOR, width=1)
    
    # Door leaf (open door panel)
    rad = math.radians(angle_start)
    leaf_x = hx + int(swing_radius * math.cos(rad))
    leaf_y = hy + int(swing_radius * math.sin(rad))
    draw.line([(hx, hy), (leaf_x, leaf_y)], fill=DOOR_LEAF_COLOR, width=2)


def draw_room(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    rect: tuple[int, int, int, int],
    room_id: str,
    room_name: str,
    room_type: str = "room",
    fill_color: tuple[int, int, int] = ROOM_FILL,
    door_wall: str | None = "bottom",
    door_offset: int = 40,
    door_width: int = 34,
    meta_info: str = ""
) -> None:
    """Draw an architectural room with labeled interior, walls, and door opening."""
    x1, y1, x2, y2 = rect
    
    # Fill room area
    draw.rectangle([rect[0:2], rect[2:4]], fill=fill_color)
    
    # Interior wall lines with door openings
    # Top wall
    if door_wall == "top":
        dw_start = x1 + door_offset
        draw.line([(x1, y1), (dw_start, y1)], fill=INT_WALL_COLOR, width=3)
        draw.line([(dw_start + door_width, y1), (x2, y1)], fill=INT_WALL_COLOR, width=3)
        # Door swing
        draw_door_swing(draw, (dw_start, y1), door_width, 0, 90)
    else:
        draw.line([(x1, y1), (x2, y1)], fill=INT_WALL_COLOR, width=3)
        
    # Bottom wall
    if door_wall == "bottom":
        dw_start = x1 + door_offset
        draw.line([(x1, y2), (dw_start, y2)], fill=INT_WALL_COLOR, width=3)
        draw.line([(dw_start + door_width, y2), (x2, y2)], fill=INT_WALL_COLOR, width=3)
        # Door swing
        draw_door_swing(draw, (dw_start, y2), door_width, 270, 360)
    else:
        draw.line([(x1, y2), (x2, y2)], fill=INT_WALL_COLOR, width=3)
        
    # Left wall
    if door_wall == "left":
        dw_start = y1 + door_offset
        draw.line([(x1, y1), (x1, dw_start)], fill=INT_WALL_COLOR, width=3)
        draw.line([(x1, dw_start + door_width), (x1, y2)], fill=INT_WALL_COLOR, width=3)
        draw_door_swing(draw, (x1, dw_start), door_width, 0, 90)
    else:
        draw.line([(x1, y1), (x1, y2)], fill=INT_WALL_COLOR, width=3)
        
    # Right wall
    if door_wall == "right":
        dw_start = y1 + door_offset
        draw.line([(x2, y1), (x2, dw_start)], fill=INT_WALL_COLOR, width=3)
        draw.line([(x2, dw_start + door_width), (x2, y2)], fill=INT_WALL_COLOR, width=3)
        draw_door_swing(draw, (x2, dw_start), door_width, 90, 180)
    else:
        draw.line([(x2, y1), (x2, y2)], fill=INT_WALL_COLOR, width=3)
        
    # Room Center Text & Badges
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    
    # ID Pill
    id_w = 42
    draw.rounded_rectangle([(cx - id_w // 2, cy - 28), (cx + id_w // 2, cy - 6)], radius=4, fill=(255, 255, 255), outline=INT_WALL_COLOR, width=1)
    draw.text((cx - 14, cy - 27), room_id, fill=TEXT_MAIN, font=fonts["room_id"])
    
    # Room Name (centered)
    name_w = len(room_name) * 7
    draw.text((cx - name_w // 2, cy - 2), room_name, fill=TEXT_MAIN, font=fonts["room_name"])
    
    # Meta / Sensor badge
    if meta_info:
        meta_w = len(meta_info) * 5
        draw.text((cx - meta_w // 2, cy + 18), meta_info, fill=TEXT_MUTED, font=fonts["meta"])


def draw_corridor(
    draw: ImageDraw.ImageDraw,
    fonts: dict,
    rect: tuple[int, int, int, int],
    corridor_id: str,
    label: str = "Main Corridor",
    orientation: str = "horizontal"
) -> None:
    """Draw a wide corridor path with dashed centerline and zone badge."""
    x1, y1, x2, y2 = rect
    draw.rectangle([rect[0:2], rect[2:4]], fill=CORRIDOR_FILL)
    
    # Dashed navigation centerline
    if orientation == "horizontal":
        cy = (y1 + y2) // 2
        for x in range(x1 + 10, x2 - 10, 20):
            draw.line([(x, cy), (min(x + 10, x2 - 10), cy)], fill=(203, 213, 225), width=1)
    else:
        cx = (x1 + x2) // 2
        for y in range(y1 + 10, y2 - 10, 20):
            draw.line([(cx, y), (cx, min(y + 10, y2 - 10))], fill=(203, 213, 225), width=1)
            
    # Corridor Badge
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    badge_w, badge_h = 36, 18
    draw.rounded_rectangle([(cx - badge_w // 2, cy - badge_h // 2), (cx + badge_w // 2, cy + badge_h // 2)], radius=3, fill=(255, 255, 255), outline=(148, 163, 184), width=1)
    draw.text((cx - 10, cy - badge_h // 2 + 2), corridor_id, fill=TEXT_MAIN, font=fonts["meta"])
    draw.text((cx + badge_w // 2 + 8, cy - 6), label, fill=TEXT_MUTED, font=fonts["meta"])


# ============================================================================
# BUILDING A GENERATOR: Corporate Office (1200x800)
# ============================================================================

def generate_building_a(output_path: Path) -> None:
    """
    Building A - Corporate Office (1200x800px):
    - White background with black perimeter
    - 6 rooms: R1-R6 in 2 rows of 3
    - 2 corridors: C1 (upper) & C2 (lower)
    - 2 stairwells: S1 (top-left) & S2 (bottom-right)
    - 2 exits: E1 (far-left) & E2 (far-right)
    - Clean architectural drawing style with door gaps & swing arcs
    """
    width, height = 1200, 800
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)
    fonts = get_fonts()
    
    # 1. Subtle grid background
    draw_subtle_grid(draw, width, height, step=40)
    
    # 2. Outer structural walls (Thick border around the floor plan)
    draw.rectangle([(80, 70), (1120, 750)], outline=EXT_WALL_COLOR, width=4)
    
    # 3. Corridors
    # C1 (Horizontal Top Corridor): x in [220, 1080], y in [270, 360]
    draw_corridor(draw, fonts, (220, 270, 1080, 360), "C1", "North Concourse Corridor", "horizontal")
    
    # C2 (Horizontal Bottom Corridor): x in [120, 980], y in [460, 550]
    draw_corridor(draw, fonts, (120, 460, 980, 550), "C2", "South Concourse Corridor", "horizontal")
    
    # Central Vertical Connectors linking C1 and C2
    draw.rectangle([(220, 360), (320, 460)], fill=CORRIDOR_FILL)
    draw.rectangle([(980, 360), (1080, 460)], fill=CORRIDOR_FILL)
    draw.rectangle([(570, 360), (670, 460)], fill=CORRIDOR_FILL)  # Central lobby passage
    draw.text((585, 404), "ATRIUM LINK", fill=TEXT_MUTED, font=fonts["meta"])
    
    # 4. Top Row of Rooms (R1, R2, R3)
    # R1: Executive Boardroom
    draw_room(
        draw, fonts,
        rect=(240, 90, 500, 270),
        room_id="R1",
        room_name="Executive Boardroom",
        room_type="room",
        fill_color=ROOM_FILL,
        door_wall="bottom",
        door_offset=60,
        door_width=36,
        meta_info="Cap: 16 | Sensors: Active"
    )
    
    # R2: Open Workspace Alpha
    draw_room(
        draw, fonts,
        rect=(520, 90, 800, 270),
        room_id="R2",
        room_name="Open Workspace Alpha",
        room_type="room",
        fill_color=ROOM_FILL,
        door_wall="bottom",
        door_offset=100,
        door_width=36,
        meta_info="Cap: 28 | Sensors: Active"
    )
    
    # R3: Server & Tech Operations
    draw_room(
        draw, fonts,
        rect=(820, 90, 1080, 270),
        room_id="R3",
        room_name="Server & Tech Hub",
        room_type="room",
        fill_color=(240, 249, 255),
        door_wall="bottom",
        door_offset=80,
        door_width=36,
        meta_info="Cap: 8 | Critical Infrastructure"
    )
    
    # 5. Bottom Row of Rooms (R4, R5, R6)
    # R4: Finance & Operations
    draw_room(
        draw, fonts,
        rect=(120, 550, 380, 730),
        room_id="R4",
        room_name="Finance & Operations",
        room_type="room",
        fill_color=ROOM_FILL,
        door_wall="top",
        door_offset=80,
        door_width=36,
        meta_info="Cap: 14 | Sensors: Active"
    )
    
    # R5: Engineering Lab
    draw_room(
        draw, fonts,
        rect=(400, 550, 680, 730),
        room_id="R5",
        room_name="Engineering Lab",
        room_type="room",
        fill_color=ROOM_FILL,
        door_wall="top",
        door_offset=90,
        door_width=36,
        meta_info="Cap: 22 | Sensors: Active"
    )
    
    # R6: Cafeteria & Lounge
    draw_room(
        draw, fonts,
        rect=(700, 550, 960, 730),
        room_id="R6",
        room_name="Cafeteria & Lounge",
        room_type="room",
        fill_color=(254, 243, 199),
        door_wall="top",
        door_offset=80,
        door_width=36,
        meta_info="Cap: 45 | High Density"
    )
    
    # 6. Stairwells
    # S1 (Top Left Stairwell)
    draw_stairwell(draw, fonts, (100, 90, 220, 250), "S1", "West Stairwell", orientation="vertical")
    draw.line([(220, 230), (220, 270)], fill=CORRIDOR_FILL, width=3)
    draw_door_swing(draw, (220, 235), 30, 0, 90)
    
    # S2 (Bottom Right Stairwell)
    draw_stairwell(draw, fonts, (980, 570, 1100, 730), "S2", "East Stairwell", orientation="vertical")
    draw.line([(980, 550), (980, 570)], fill=CORRIDOR_FILL, width=3)
    draw_door_swing(draw, (980, 550), 30, 270, 360)
    
    # 7. Exits (E1 far left, E2 far right)
    # E1: West Main Exit
    draw_exit_badge(draw, fonts, (40, 380, 120, 460), "E1", "EXIT 1", arrow_dir="left")
    draw.line([(80, 390), (80, 450)], fill=EXIT_GREEN_BG, width=6)
    
    # E2: East Emergency Exit
    draw_exit_badge(draw, fonts, (1080, 360, 1160, 440), "E2", "EXIT 2", arrow_dir="right")
    draw.line([(1120, 370), (1120, 430)], fill=EXIT_GREEN_BG, width=6)
    
    # 8. Legend Block
    draw.rectangle([(80, 755), (600, 792)], fill=(255, 255, 255), outline=INT_WALL_COLOR, width=1)
    draw.text((90, 762), "LEGEND:", fill=TEXT_MAIN, font=fonts["legend"])
    
    draw.rectangle([(155, 764), (165, 774)], fill=EXIT_GREEN)
    draw.text((172, 763), "Emergency Exit", fill=TEXT_MUTED, font=fonts["legend"])
    
    draw.rectangle([(275, 764), (285, 774)], fill=STAIR_TREAD)
    draw.text((292, 763), "Stairwell (S1/S2)", fill=TEXT_MUTED, font=fonts["legend"])
    
    draw.rectangle([(410, 764), (420, 774)], fill=ROOM_FILL, outline=INT_WALL_COLOR, width=1)
    draw.text((427, 763), "Monitored Zone", fill=TEXT_MUTED, font=fonts["legend"])
    
    # 9. Compass Rose and Scale Bar
    draw_north_arrow_and_scale(draw, fonts, x=1030, y=768, scale_meters=15)
    
    # 10. Title bar
    draw_title_bar(
        draw, fonts, width,
        building_code="BUILDING A",
        building_title="Corporate Office Complex",
        building_sub="LEVEL 2 FLOOR PLAN (1,200 SQM)"
    )
    
    # Save Image
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG", dpi=(150, 150))
    print(f"✅ Generated Building A floor plan: {output_path} ({width}x{height}px)")


# ============================================================================
# BUILDING B GENERATOR: Medical Center (1200x900)
# ============================================================================

def generate_building_b(output_path: Path) -> None:
    """
    Building B - Metropolitan Medical Center (1200x900px):
    - 4 Patient Rooms (P1-P4) on the left wing
    - 2 Operating Rooms (OR1, OR2) on the right wing
    - 1 Waiting Area (W1) center-top
    - 1 Nurse Station (N1) center-middle
    - 1 Isolation Ward (ISO1) far right wing bottom
    - 3 Corridors: C1 (Main Horizontal), C2 (Left Wing), C3 (Right Wing)
    - 3 Stairwells: S1 (Left), S2 (Center South), S3 (Right)
    - 3 Exits: E1 (West Wing), E2 (South Ambulatory), E3 (East Surgical)
    """
    width, height = 1200, 900
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)
    fonts = get_fonts()
    
    # 1. Subtle grid background
    draw_subtle_grid(draw, width, height, step=40)
    
    # 2. Outer structural wall perimeter
    draw.rectangle([(60, 65), (1140, 850)], outline=EXT_WALL_COLOR, width=4)
    
    # 3. Corridors
    # C2 (Left Wing Corridor - Vertical): x in [270, 350], y in [80, 830]
    draw_corridor(draw, fonts, (270, 80, 350, 830), "C2", "West Patient Concourse", "vertical")
    
    # C3 (Right Wing Corridor - Vertical): x in [840, 920], y in [80, 830]
    draw_corridor(draw, fonts, (840, 80, 920, 830), "C3", "East Surgical Concourse", "vertical")
    
    # C1 (Main Central Corridor - Horizontal): x in [350, 840], y in [440, 520]
    draw_corridor(draw, fonts, (350, 440, 840, 520), "C1", "Main Central Concourse", "horizontal")
    
    # 4. Left Wing: Patient Rooms (P1 - P4)
    # P1: ICU Room 1
    draw_room(
        draw, fonts,
        rect=(80, 80, 270, 245),
        room_id="P1",
        room_name="Intensive Care (ICU 1)",
        room_type="room",
        fill_color=PATIENT_FILL,
        door_wall="right",
        door_offset=50,
        door_width=34,
        meta_info="Critical Care | 4 Beds"
    )
    
    # P2: Trauma & Acute Care
    draw_room(
        draw, fonts,
        rect=(80, 265, 270, 430),
        room_id="P2",
        room_name="Trauma & Acute Care",
        room_type="room",
        fill_color=PATIENT_FILL,
        door_wall="right",
        door_offset=50,
        door_width=34,
        meta_info="Monitored | 6 Beds"
    )
    
    # P3: General Inpatient Care
    draw_room(
        draw, fonts,
        rect=(80, 480, 270, 645),
        room_id="P3",
        room_name="General Inpatient Care",
        room_type="room",
        fill_color=PATIENT_FILL,
        door_wall="right",
        door_offset=50,
        door_width=34,
        meta_info="Telemetry | 8 Beds"
    )
    
    # P4: Post-Op Recovery
    draw_room(
        draw, fonts,
        rect=(80, 665, 270, 830),
        room_id="P4",
        room_name="Post-Op Recovery (PACU)",
        room_type="room",
        fill_color=PATIENT_FILL,
        door_wall="right",
        door_offset=50,
        door_width=34,
        meta_info="Monitored | 8 Beds"
    )
    
    # 5. Center Hub: Waiting Area (W1) & Nurse Command Station (N1)
    # W1: Main Reception & Triage Waiting Area
    draw_room(
        draw, fonts,
        rect=(370, 80, 590, 420),
        room_id="W1",
        room_name="Triage & Family Waiting",
        room_type="room",
        fill_color=WAITING_FILL,
        door_wall="bottom",
        door_offset=70,
        door_width=44,
        meta_info="High Density | Cap: 50"
    )
    
    # N1: Central Nurse Command & Telemetry Station
    draw_room(
        draw, fonts,
        rect=(610, 80, 820, 420),
        room_id="N1",
        room_name="Nurse Command Station",
        room_type="room",
        fill_color=NURSE_FILL,
        door_wall="bottom",
        door_offset=60,
        door_width=44,
        meta_info="24/7 Operations Hub"
    )
    
    # Center South Area: Stairwell S2 & Utility
    draw_stairwell(draw, fonts, (480, 650, 620, 830), "S2", "Central Stairwell", orientation="vertical")
    draw.rectangle([(480, 520), (620, 650)], fill=CORRIDOR_FILL)
    draw.text((505, 575), "AMBULANCE ACCESS", fill=TEXT_MUTED, font=fonts["meta"])
    
    # 6. Right Wing: Operating Rooms (OR1, OR2) & Isolation Ward (ISO1)
    # OR1: Surgical Suite Alpha
    draw_room(
        draw, fonts,
        rect=(920, 80, 1120, 310),
        room_id="OR1",
        room_name="Surgical Suite Alpha",
        room_type="room",
        fill_color=OR_FILL,
        door_wall="left",
        door_offset=70,
        door_width=36,
        meta_info="Sterile OR 1 | Positive Pressure"
    )
    
    # OR2: Surgical Suite Beta
    draw_room(
        draw, fonts,
        rect=(920, 330, 1120, 560),
        room_id="OR2",
        room_name="Surgical Suite Beta",
        room_type="room",
        fill_color=OR_FILL,
        door_wall="left",
        door_offset=70,
        door_width=36,
        meta_info="Robotic Surgery | Sterile"
    )
    
    # ISO1: Airborne Infection Isolation Unit
    draw_room(
        draw, fonts,
        rect=(920, 580, 1120, 770),
        room_id="ISO1",
        room_name="Airborne Isolation (ISO)",
        room_type="room",
        fill_color=ISO_FILL,
        door_wall="left",
        door_offset=60,
        door_width=34,
        meta_info="Negative Pressure | Bio-Containment"
    )
    
    # 7. Additional Stairwells (S1 in left wing, S3 in right wing)
    draw_stairwell(draw, fonts, (270, 730, 350, 830), "S1", "West Stairs", orientation="vertical")
    draw_stairwell(draw, fonts, (840, 730, 920, 830), "S3", "East Stairs", orientation="vertical")
    
    # 8. Emergency Exits (E1, E2, E3)
    # E1: West Emergency Exit
    draw_exit_badge(draw, fonts, (20, 435, 80, 505), "E1", "EXIT 1", arrow_dir="left")
    draw.line([(60, 445), (60, 495)], fill=EXIT_GREEN_BG, width=6)
    
    # E2: South Main Ambulance Exit
    draw_exit_badge(draw, fonts, (500, 830, 600, 885), "E2", "EXIT 2 (AMBULATORY)", arrow_dir="down")
    draw.line([(515, 850), (585, 850)], fill=EXIT_GREEN_BG, width=6)
    
    # E3: East Emergency Exit
    draw_exit_badge(draw, fonts, (1120, 435, 1180, 505), "E3", "EXIT 3", arrow_dir="right")
    draw.line([(1140, 445), (1140, 495)], fill=EXIT_GREEN_BG, width=6)
    
    # 9. Legend Block
    draw.rectangle([(60, 858), (760, 892)], fill=(255, 255, 255), outline=INT_WALL_COLOR, width=1)
    draw.text((70, 866), "CLINICAL ZONES:", fill=TEXT_MAIN, font=fonts["legend"])
    
    draw.rectangle([(190, 868), (200, 878)], fill=PATIENT_FILL, outline=INT_WALL_COLOR, width=1)
    draw.text((207, 867), "Inpatient (P1-P4)", fill=TEXT_MUTED, font=fonts["legend"])
    
    draw.rectangle([(330, 868), (340, 878)], fill=OR_FILL, outline=INT_WALL_COLOR, width=1)
    draw.text((347, 867), "Surgical (OR1-OR2)", fill=TEXT_MUTED, font=fonts["legend"])
    
    draw.rectangle([(480, 868), (490, 878)], fill=ISO_FILL, outline=INT_WALL_COLOR, width=1)
    draw.text((497, 867), "Isolation (ISO1)", fill=TEXT_MUTED, font=fonts["legend"])
    
    draw.rectangle([(615, 868), (625, 878)], fill=EXIT_GREEN)
    draw.text((632, 867), "Emergency Exits (E1-E3)", fill=TEXT_MUTED, font=fonts["legend"])
    
    # 10. Compass Rose and Scale Bar
    draw_north_arrow_and_scale(draw, fonts, x=1050, y=868, scale_meters=20)
    
    # 11. Title Bar
    draw_title_bar(
        draw, fonts, width,
        building_code="BUILDING B",
        building_title="Metropolitan Medical Center",
        building_sub="LEVEL 1 EMERGENCY & SURGICAL WING (2,400 SQM)"
    )
    
    # Save Image
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG", dpi=(150, 150))
    print(f"✅ Generated Building B floor plan: {output_path} ({width}x{height}px)")


# ============================================================================
# Main Entrypoint
# ============================================================================

def main() -> None:
    script_dir = Path(__file__).resolve().parent
    demo_dir = script_dir
    
    print(f"Generating CrisisAgent demo assets in: {demo_dir}")
    
    building_a_path = demo_dir / "building_a.png"
    building_b_path = demo_dir / "building_b.png"
    
    generate_building_a(building_a_path)
    generate_building_b(building_b_path)
    
    print("\n🎉 All demo floor plans successfully generated!")


if __name__ == "__main__":
    main()
