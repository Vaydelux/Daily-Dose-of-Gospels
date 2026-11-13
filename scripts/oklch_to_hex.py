"""Convert the site's OKLCH design tokens to exact sRGB hex values.

These hexes must match src/app/globals.css so that the PWA manifest,
theme-color, PWA icons and the offline page all sit on the same palette.
"""

import math


def oklch_to_hex(L: float, C: float, H: float) -> str:
    h = math.radians(H)
    a = C * math.cos(h)
    b = C * math.sin(h)

    # OKLab -> LMS -> cube
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3

    # LMS -> linear sRGB
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def enc(x: float) -> int:
        x = min(1.0, max(0.0, x))
        return round(
            (12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055) * 255
        )

    return "#{:02X}{:02X}{:02X}".format(enc(r), enc(g), enc(bb))


TOKENS = {
    "light.background (cream)": (0.982, 0.011, 92),
    "light.foreground (ink navy)": (0.30, 0.045, 258),
    "light.primary (deep)": (0.40, 0.085, 258),
    "light.gold": (0.72, 0.115, 80),
    "light.card": (0.998, 0.004, 95),
    "dark.background": (0.215, 0.04, 262),
    "dark.gold": (0.78, 0.105, 82),
    "new.deep (proposed)": (0.38, 0.09, 260),
    "new.gold (proposed)": (0.755, 0.125, 82),
}

for name, (L, C, H) in TOKENS.items():
    print(f"{name:36s} oklch({L} {C} {H})  ->  {oklch_to_hex(L, C, H)}")
