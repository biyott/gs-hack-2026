# /// script
# dependencies = []
# ///
# ─── How to run ───
# Imported by the scene builder inside Blender; call build(Builder(scene)).
"""Six-axle road carrier for the deployed legacy SK1265-AT6."""

from math import cos, pi, sin
from typing import Final

from crane_geometry import Builder

AXLES: Final = (-5.305, -3.008, -1.394, -0.049, 1.296, 2.638)
Vec3 = tuple[float, float, float]


def _wheel(h: Builder, position: tuple[float, float]) -> None:
    """Model a profiled heavy-duty tire with disconnected tread blocks."""
    x, side = position
    name = f"Axle_{x:+.3f}_{side:+.0f}"
    profile = ((-.18, .28), (-.23, .35), (-.23, .48), (-.18, .555),
               (-.11, .574), (.11, .574), (.18, .555), (.23, .48),
               (.23, .35), (.18, .28))
    vertices = [(x + r * cos(2 * pi * n / 64), side * (1.25 + y),
                 .64 + r * sin(2 * pi * n / 64))
                for y, r in profile for n in range(64)]
    faces = [(j * 64 + n, j * 64 + (n + 1) % 64,
              ((j + 1) % len(profile)) * 64 + (n + 1) % 64,
              ((j + 1) % len(profile)) * 64 + n)
             for j in range(len(profile)) for n in range(64)]
    h.mesh(f"{name}_Tire", vertices, faces, "rubber")
    tread_vertices: list[Vec3] = []
    tread_faces: list[tuple[int, ...]] = []
    for n in range(40):
        for band in range(3):
            offset = len(tread_vertices)
            angle = 2 * pi * n / 40 + (band % 2) * .025
            for radius in (.568, .59):
                for y, theta in ((-.163 + band * .109, -.054),
                                 (-.163 + band * .109, .054),
                                 (-.069 + band * .109, .074),
                                 (-.069 + band * .109, -.034)):
                    tread_vertices.append((x + radius * cos(angle + theta),
                                           side * (1.25 + y),
                                           .64 + radius * sin(angle + theta)))
            for face in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
                         (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
                tread_faces.append(tuple(offset + index for index in face))
    h.mesh(f"{name}_Tread", tread_vertices, tread_faces, "rubber")
    for radius, start, end, material in ((.325, 1.39, 1.487, "metal"),
                                        (.279, 1.49, 1.498, "charcoal"),
                                        (.215, 1.495, 1.508, "metal"),
                                        (.111, 1.505, 1.56, "charcoal")):
        h.cylinder(f"{name}_Hub_{radius}", (x, side * start, .64),
                   (x, side * end, .64), radius, material, vertices=32)
    for bolt in range(10):
        theta = bolt * 2 * pi / 10
        bx, bz = x + .249 * cos(theta), .64 + .249 * sin(theta)
        h.cylinder(f"{name}_Bolt_{bolt}", (bx, side * 1.498, bz),
                   (bx, side * 1.526, bz), .023, "chrome", vertices=6)
    arch_vertices = [(x + radius * cos(n * pi / 18), side * y,
                      .64 + radius * sin(n * pi / 18))
                     for radius, y in ((.657, 1.00), (.657, 1.515),
                                       (.715, 1.515), (.715, 1.00))
                     for n in range(19)]
    arch_faces = [(ring * 19 + n, ring * 19 + n + 1,
                   ((ring + 1) % 4) * 19 + n + 1, ((ring + 1) % 4) * 19 + n)
                  for ring in range(4) for n in range(18)]
    h.mesh(f"{name}_Mudguard", arch_vertices, arch_faces, "charcoal")


def _cab(h: Builder) -> None:
    """Reproduce the sloping windscreen and asymmetric door glazing."""
    profile = ((-8., .62), (-8., 1.35), (-7.34, 2.66), (-5.97, 2.66), (-5.97, .62))
    vertices = [(x, y, z) for y in (-1.37, 1.37) for x, z in profile]
    faces = [(0, 4, 3, 2, 1), (5, 6, 7, 8, 9)]
    faces.extend((n, (n + 1) % 5, (n + 1) % 5 + 5, n + 5) for n in range(5))
    h.mesh("RoadCab_SculptedShell", vertices, faces, "yellow")
    windshield = [(-8.014, -1.245, 1.43), (-8.014, 1.245, 1.43),
                  (-7.445, 1.245, 2.53), (-7.445, -1.245, 2.53)]
    h.mesh("RoadCab_Windscreen", windshield, [(0, 1, 2, 3)], "glass")
    h.line("Windscreen_Seal", windshield + [windshield[0]], .027, "charcoal")
    h.line("Windscreen_CentreMullion", [(-8.025, 0, 1.43), (-7.455, 0, 2.53)], .025, "yellow")
    for side in (-1., 1.):
        y = side * 1.378
        window = [(-7.82, y, 1.52), (-7.30, y, 2.51), (-6.58, y, 2.51), (-6.58, y, 1.58)]
        h.mesh(f"RoadCab_SideWindow_{side}", window, [(0, 1, 2, 3)], "glass")
        h.line(f"RoadCab_SideSeal_{side}", window + [window[0]], .025, "charcoal")
        h.box(f"RoadCab_QuarterWindow_{side}", (-6.255, y, 2.075), (.44, .015, .86), "glass", .035)
        h.line(f"RoadCab_DoorSeam_{side}", [(-7.83, y, 1.40), (-7.80, y, .75),
               (-6.56, y, .75), (-6.56, y, 2.55)], .009, "charcoal")
        h.box(f"RoadCab_DoorHandle_{side}", (-6.74, side * 1.399, 1.47), (.18, .035, .048), "charcoal", .01)
        h.line(f"Mirror_Arm_{side}", [(-7.44, side * 1.36, 2.34),
               (-7.57, side * 1.75, 2.32), (-7.62, side * 1.75, 1.95)], .025, "charcoal")
        h.box(f"RoadCab_MirrorHousing_{side}", (-7.64, side * 1.75, 2.08), (.12, .22, .38), "charcoal", .04)
        h.box(f"RoadCab_MirrorGlass_{side}", (-7.569, side * 1.75, 2.08), (.012, .18, .32), "chrome", .025)
        h.line(f"Wiper_{side}", [(-8.039, side * .81, 1.46),
               (-7.906, side * .50, 1.69), (-7.683, side * .78, 2.10)], .014, "charcoal")
        h.box(f"Headlamp_Recess_{side}", (-8.027, side * 1.12, 1.115), (.037, .25, .32), "charcoal", .035)
        h.box(f"Headlamp_{side}", (-8.052, side * 1.12, 1.18), (.019, .19, .11), "white", .024)
        h.box(f"Indicator_Front_{side}", (-8.052, side * 1.12, 1.035), (.02, .18, .065), "amber", .012)
        h.box(f"SideTurnSignal_{side}", (-7.85, side * 1.395, 1.31), (.15, .021, .08), "amber", .014)
        for step in range(2):
            h.box(f"CabStep_{side}_{step}", (-6.99, side * 1.43, .54 + step * .14), (.64, .20, .045), "metal", .008)
        for x in (-7.24, -6.74):
            h.box(f"CabStepHanger_{side}_{x}", (x, side * 1.39, .65), (.045, .10, .27), "charcoal", .006)
        h.cylinder(f"RoofBeaconBase_{side}", (-6.39, side * .97, 2.67), (-6.39, side * .97, 2.72), .10, "charcoal")
        h.cylinder(f"RoofBeacon_{side}", (-6.39, side * .97, 2.72), (-6.39, side * .97, 2.88), .085, "amber")
    h.box("RoadCab_FrontBumper", (-8.06, 0, .64), (.16, 2.83, .18), "charcoal", .035)
    h.box("RoadCab_Radiator", (-8.027, 0, 1.018), (.024, 1.59, .32), "charcoal", .015)
    for z in (.89, .96, 1.03, 1.10, 1.17):
        h.box(f"RoadCab_GrilleSlat_{z}", (-8.046, 0, z), (.023, 1.56, .018), "metal", .003)
    h.box("RoadCab_RoofLip", (-6.66, 0, 2.68), (1.49, 2.83, .095), "yellow", .035)
    h.box("RoadCab_NumberPlate", (-8.155, 0, .68), (.014, .50, .10), "white", .006)


def _outriggers(h: Builder) -> None:
    """Use the wide 7.95 × 7.66 m support configuration and elongated plates."""
    h.collection("02_Outriggers")
    for x in (-4.615, 3.335):
        h.box(f"Outrigger_TransverseHousing_{x}", (x, 0, 1.46), (.66, 3.06, .30), "yellow_dark", .025)
        for side in (-1., 1.):
            name, y = f"Outrigger_{x}_{side}", side * 3.83
            h.box(f"{name}_OuterBeam", (x, side * 2.06, 1.445), (.57, 1.70, .28), "yellow", .018)
            h.box(f"{name}_InnerBeam", (x, side * 3.26, 1.445), (.43, 1.50, .205), "charcoal", .012)
            h.box(f"{name}_JackHousing", (x, y, 1.24), (.55, .53, .80), "yellow", .025)
            h.cylinder(f"{name}_JackCylinder", (x, y, .89), (x, y, 1.68), .156, "yellow_dark", vertices=24)
            h.cylinder(f"{name}_JackChrome", (x, y, .27), (x, y, .96), .092, "chrome", vertices=24)
            h.box(f"{name}_Foot", (x, y, .23), (.75, .60, .12), "metal", .035)
            plan = ((-1.12, -.50), (1.12, -.50), (1.25, -.34), (1.25, .34),
                    (1.12, .50), (-1.12, .50), (-1.25, .34), (-1.25, -.34))
            pad_vertices = [(x + px, y + py, z) for z in (.01, .17) for px, py in plan]
            pad_faces = [tuple(range(7, -1, -1)), tuple(range(8, 16))]
            pad_faces.extend((n, (n + 1) % 8, (n + 1) % 8 + 8, n + 8) for n in range(8))
            h.mesh(f"{name}_GroundPlate", pad_vertices, pad_faces, "yellow_dark")
            for stripe in range(3):
                z = .86 + stripe * .22
                h.mesh(f"{name}_JackWarning_{stripe}", [(x - .276, y - .266, z),
                       (x - .276, y + .266, z + .10), (x - .276, y + .266, z + .18),
                       (x - .276, y - .266, z + .08)], [(0, 1, 2, 3)], "charcoal")
            h.line(f"{name}_HydraulicHose", [(x + .20, side * 1.35, 1.64),
                   (x + .20, side * 2.7, 1.61), (x + .18, y, 1.68),
                   (x + .15, y, 1.38)], .019, "rubber")
            for offset in (-.91, .91):
                h.line(f"{name}_PlateHandle_{offset}", [(x + offset - .10, y, .17),
                       (x + offset - .10, y, .23), (x + offset + .10, y, .23),
                       (x + offset + .10, y, .17)], .02, "metal")


def build(h: Builder) -> None:
    """Build the carrier using documented axle coordinates in metres."""
    h.collection("01_Carrier")
    h.box("Carrier_MainDeck", (-.9455, 0, 1.465), (10.049, 2.92, .23), "yellow", .035)
    for side in (-1., 1.):
        h.box(f"Carrier_FrameRail_{side}", (-1.92, side * .71, .96), (11.83, .25, .46), "charcoal", .025)
        h.box(f"Carrier_DeckEdge_{side}", (-.9455, side * 1.477, 1.405), (10.049, .055, .235), "yellow_dark", .012)
        h.box(f"Carrier_Walkway_{side}", (-.7, side * 1.04, 1.603), (8.51, .57, .03), "metal", .008)
        for x in (-5.55, -3.7, -2.4, -.8, .6, 2.0, 3.48):
            h.box(f"SideMarker_{side}_{x}", (x, side * 1.513, 1.43), (.11, .026, .058), "amber", .009)
        for x in (-4.05, -2.3, -.95, .4, 1.75, 3.72):
            h.box(f"DeckPanelSeam_{side}_{x}", (x, side * 1.03, 1.622), (.012, .54, .006), "charcoal", 0)
        h.box(f"EngineCowling_{side}", (-4.94, side * .96, 1.92), (1.96, .73, .65), "yellow", .06)
        h.box(f"EngineGrille_{side}", (-4.82, side * 1.333, 1.915), (1.16, .018, .36), "charcoal", .018)
        for slat in range(14):
            h.box(f"EngineGrilleSlat_{side}_{slat}", (-5.345 + slat * .081, side * 1.348, 1.915), (.021, .024, .33), "metal", .003)
        for x in (-3.75, 3.83):
            h.box(f"DeckAccessStep_{side}_{x}", (x, side * 1.26, .70), (.38, .41, .05), "metal", .006)
            h.line(f"DeckAccessRail_{side}_{x}", [(x, side * 1.45, .65), (x, side * 1.45, 1.49)], .022, "metal")
        h.box(f"RearLampMount_{side}", (4.092, side * 1.09, 1.10), (.035, .56, .20), "charcoal", .025)
        for y, material in ((.94, "red"), (1.13, "red"), (1.32, "amber")):
            h.box(f"RearLamp_{side}_{y}", (4.117, side * y, 1.105), (.018, .14, .11), material, .019)
    for x in AXLES:
        h.cylinder(f"AxleShaft_{x}", (x, -1.19, .64), (x, 1.19, .64), .12, "charcoal")
        h.cylinder(f"AxleDifferential_{x}", (x, -.24, .64), (x, .24, .64), .245, "charcoal", vertices=20)
        for side in (-1., 1.):
            _wheel(h, (x, side))
    h.box("Carrier_RearBumper", (4.08, 0, .66), (.16, 2.89, .18), "charcoal", .025)
    h.box("Carrier_RearPanel", (3.99, 0, 1.10), (.14, 2.74, .69), "yellow", .025)
    for stripe in range(9):
        y = -1.30 + stripe * .29
        h.mesh(f"RearWarningStripe_{stripe}", [(4.067, y, .78), (4.067, y + .13, .78),
               (4.067, min(y + .40, 1.365), 1.39), (4.067, y + .27, 1.39)], [(0, 1, 2, 3)], "charcoal")
    _cab(h)
    _outriggers(h)
