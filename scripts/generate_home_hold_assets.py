from __future__ import annotations

import math
import os
import struct
import zlib
from dataclasses import dataclass
from pathlib import Path


SIZE = 1400


@dataclass(frozen=True)
class Ellipse:
    cx: float
    cy: float
    rx: float
    ry: float
    angle: float = 0.0


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def smooth_alpha(normalized_distance: float, softness_px: float, radius: float) -> float:
    softness = max(softness_px / max(radius, 1.0), 0.002)
    if normalized_distance <= 1.0 - softness:
        return 1.0
    if normalized_distance >= 1.0 + softness:
        return 0.0
    edge = (1.0 + softness - normalized_distance) / (2.0 * softness)
    return clamp(edge, 0.0, 1.0)


def blend_pixel(canvas: bytearray, index: int, color: tuple[int, int, int], alpha: float) -> None:
    if alpha <= 0:
        return
    src_a = clamp(alpha, 0.0, 1.0)
    inv_a = 1.0 - src_a

    dst_r = canvas[index] / 255.0
    dst_g = canvas[index + 1] / 255.0
    dst_b = canvas[index + 2] / 255.0
    dst_a = canvas[index + 3] / 255.0

    out_a = src_a + dst_a * inv_a
    if out_a <= 0:
        return

    src_r = color[0] / 255.0
    src_g = color[1] / 255.0
    src_b = color[2] / 255.0

    out_r = (src_r * src_a + dst_r * dst_a * inv_a) / out_a
    out_g = (src_g * src_a + dst_g * dst_a * inv_a) / out_a
    out_b = (src_b * src_a + dst_b * dst_a * inv_a) / out_a

    canvas[index] = int(out_r * 255)
    canvas[index + 1] = int(out_g * 255)
    canvas[index + 2] = int(out_b * 255)
    canvas[index + 3] = int(out_a * 255)


def ellipse_bounds(ellipse: Ellipse, expand: float = 0.0) -> tuple[int, int, int, int]:
    max_r = max(ellipse.rx, ellipse.ry) + expand
    left = int(max(0, math.floor(ellipse.cx - max_r)))
    top = int(max(0, math.floor(ellipse.cy - max_r)))
    right = int(min(SIZE - 1, math.ceil(ellipse.cx + max_r)))
    bottom = int(min(SIZE - 1, math.ceil(ellipse.cy + max_r)))
    return left, top, right, bottom


def draw_ellipse(
    canvas: bytearray,
    ellipse: Ellipse,
    color: tuple[int, int, int],
    alpha: float,
    softness_px: float = 5.0,
) -> None:
    cos_a = math.cos(math.radians(ellipse.angle))
    sin_a = math.sin(math.radians(ellipse.angle))
    left, top, right, bottom = ellipse_bounds(ellipse, softness_px * 2)
    min_radius = max(min(ellipse.rx, ellipse.ry), 1.0)

    for y in range(top, bottom + 1):
        dy = y + 0.5 - ellipse.cy
        for x in range(left, right + 1):
            dx = x + 0.5 - ellipse.cx
            xr = dx * cos_a + dy * sin_a
            yr = -dx * sin_a + dy * cos_a
            normalized = math.sqrt((xr / ellipse.rx) ** 2 + (yr / ellipse.ry) ** 2)
            edge_alpha = smooth_alpha(normalized, softness_px, min_radius)
            if edge_alpha <= 0:
                continue
            idx = (y * SIZE + x) * 4
            blend_pixel(canvas, idx, color, alpha * edge_alpha)


def draw_shadow(
    canvas: bytearray,
    ellipses: list[Ellipse],
    offset_x: float,
    offset_y: float,
    color: tuple[int, int, int],
    alpha: float,
) -> None:
    blur_layers = [
        (72, 0.028),
        (56, 0.038),
        (40, 0.055),
        (26, 0.075),
    ]
    for expand, layer_alpha in blur_layers:
        for ellipse in ellipses:
            shifted = Ellipse(
                cx=ellipse.cx + offset_x,
                cy=ellipse.cy + offset_y,
                rx=ellipse.rx + expand,
                ry=ellipse.ry + expand * 0.92,
                angle=ellipse.angle,
            )
            draw_ellipse(canvas, shifted, color, alpha * layer_alpha, softness_px=expand * 0.55)


def draw_rim(
    canvas: bytearray,
    ellipses: list[Ellipse],
    offset_x: float,
    offset_y: float,
    color: tuple[int, int, int],
) -> None:
    for expand, layer_alpha in ((28, 0.52), (18, 0.62), (10, 0.76)):
        for ellipse in ellipses:
            shifted = Ellipse(
                cx=ellipse.cx + offset_x,
                cy=ellipse.cy + offset_y,
                rx=ellipse.rx + expand,
                ry=ellipse.ry + expand * 0.88,
                angle=ellipse.angle,
            )
            draw_ellipse(canvas, shifted, color, layer_alpha, softness_px=expand * 0.5)


def draw_body(canvas: bytearray, ellipses: list[Ellipse]) -> None:
    for ellipse in ellipses:
        draw_ellipse(canvas, ellipse, (14, 14, 14), 0.92, softness_px=6.0)
        draw_ellipse(
            canvas,
            Ellipse(
                cx=ellipse.cx - ellipse.rx * 0.06,
                cy=ellipse.cy - ellipse.ry * 0.04,
                rx=ellipse.rx * 0.96,
                ry=ellipse.ry * 0.96,
                angle=ellipse.angle,
            ),
            (6, 6, 6),
            0.75,
            softness_px=5.0,
        )


def draw_highlights(canvas: bytearray, highlights: list[tuple[Ellipse, tuple[int, int, int], float]]) -> None:
    for ellipse, color, alpha in highlights:
        draw_ellipse(canvas, ellipse, color, alpha, softness_px=12.0)


def save_png(path: Path, width: int, height: int, pixels: bytearray) -> None:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(pixels[start : start + stride])

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack("!I", len(data))
            + tag
            + data
            + struct.pack("!I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0)))
    png.extend(chunk(b"IDAT", zlib.compress(bytes(raw), level=9)))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(png)


def render_asset(
    filename: str,
    ellipses: list[Ellipse],
    rim_color: tuple[int, int, int],
    rim_offset: tuple[float, float],
    shadow_offset: tuple[float, float],
    highlights: list[tuple[Ellipse, tuple[int, int, int], float]],
) -> None:
    canvas = bytearray(SIZE * SIZE * 4)
    draw_shadow(canvas, ellipses, shadow_offset[0], shadow_offset[1], (0, 0, 0), 1.0)
    draw_rim(canvas, ellipses, rim_offset[0], rim_offset[1], rim_color)
    draw_body(canvas, ellipses)
    draw_highlights(canvas, highlights)
    save_png(ASSET_DIR / filename, SIZE, SIZE, canvas)


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "src" / "assets" / "home"


def main() -> None:
    os.makedirs(ASSET_DIR, exist_ok=True)

    render_asset(
        "hold-orb-blue.png",
        ellipses=[
            Ellipse(610, 640, 350, 330, -10),
            Ellipse(500, 735, 230, 205, 16),
            Ellipse(760, 545, 195, 180, -22),
        ],
        rim_color=(13, 63, 191),
        rim_offset=(24, 18),
        shadow_offset=(0, 72),
        highlights=[
            (Ellipse(420, 480, 138, 118, -18), (42, 58, 96), 0.34),
            (Ellipse(460, 475, 94, 72, -20), (64, 88, 128), 0.16),
        ],
    )

    render_asset(
        "hold-pillar-yellow.png",
        ellipses=[
            Ellipse(760, 640, 132, 310, 5),
            Ellipse(760, 430, 120, 110, 10),
            Ellipse(756, 900, 122, 112, -6),
        ],
        rim_color=(201, 150, 6),
        rim_offset=(18, 16),
        shadow_offset=(0, 54),
        highlights=[
            (Ellipse(708, 470, 52, 118, 9), (95, 74, 18), 0.2),
        ],
    )

    render_asset(
        "hold-chip-green.png",
        ellipses=[
            Ellipse(690, 690, 146, 88, -34),
            Ellipse(760, 664, 72, 48, -24),
        ],
        rim_color=(47, 149, 102),
        rim_offset=(-18, 16),
        shadow_offset=(0, 44),
        highlights=[
            (Ellipse(620, 630, 56, 28, -34), (72, 100, 78), 0.16),
        ],
    )

    render_asset(
        "hold-disc-pink.png",
        ellipses=[
            Ellipse(690, 690, 236, 236, 0),
            Ellipse(615, 760, 120, 102, 18),
        ],
        rim_color=(193, 95, 103),
        rim_offset=(20, 18),
        shadow_offset=(0, 58),
        highlights=[
            (Ellipse(598, 586, 86, 72, -18), (86, 54, 58), 0.16),
        ],
    )

    render_asset(
        "hold-blob-orange.png",
        ellipses=[
            Ellipse(640, 650, 250, 280, 8),
            Ellipse(740, 730, 162, 174, -26),
            Ellipse(520, 828, 134, 118, 22),
        ],
        rim_color=(196, 95, 31),
        rim_offset=(18, 24),
        shadow_offset=(0, 68),
        highlights=[
            (Ellipse(540, 470, 104, 120, -24), (92, 52, 26), 0.16),
        ],
    )


if __name__ == "__main__":
    main()
