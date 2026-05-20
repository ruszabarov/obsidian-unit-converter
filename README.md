# Unit Conversion in Obsidian

This plugin allows you to seamlessly convert units directly within your Obsidian notes, making it easier to work with data across various systems and contexts without leaving your markdown editor.

## Basic Syntax

Use the following syntax within your notes to perform inline conversion:
`[<value><source unit>|<target unit>]`

## Example

<img src="https://github.com/user-attachments/assets/a191b540-decd-4f2e-930b-0aa8a9f71678" alt="obsidian-unit-converter" width="500">

## Features

- [Autosuggest](#autosuggest)
- [Convert units command](#convert-units-command)
- [Custom units](#custom-units)

### Autosuggest

The plugin will automatically suggest relevant units. This option can be disabled in settings.

<img src="https://github.com/user-attachments/assets/b6988894-83da-4a76-8ca9-87f335d72082" alt="autosuggest example" width="200">

### Convert units command

You can open a modal to perform a unit conversion. This is mostly done to improve the mobile experience.

<img src="https://github.com/user-attachments/assets/ca168075-8408-41e3-812f-181c511b1585" alt="convert units command example" width="350">

### Custom units

You can add custom units in settings. Each custom unit belongs to an existing measure and is defined as a positive factor of a built-in anchor unit.

## Supported Units

**Length**: mm, cm, m, km, in, yd, ft-us, ft, mi

**Area**: mm2, cm2, m2, ha, km2, in2, yd2, ft2, ac, mi2

**Mass**: mcg, mg, g, kg, mt, oz, lb, t

**Volume**: mm3, cm3, ml, cl, dl, l, kl, m3, km3, krm, tsk, msk, kkp, glas, kanna, tsp, Tbs, in3, fl-oz, cup, pnt, qt, gal, ft3, yd3

**Volume Flow Rate**: mm3/s, cm3/s, ml/s, cl/s, dl/s, l/s, l/min, l/h, kl/s, kl/min, kl/h, m3/s, m3/min, m3/h, km3/s, tsp/s, Tbs/s, in3/s, in3/min, in3/h, fl-oz/s, fl-oz/min, fl-oz/h, cup/s, pnt/s, pnt/min, pnt/h, qt/s, gal/s, gal/min, gal/h, ft3/s, ft3/min, ft3/h, yd3/s, yd3/min, yd3/h

**Each**: ea, dz

**Temperature**: C, K, F, R

**Time**: ns, mu, ms, s, min, h, d, week, month, year

**Frequency**: mHz, Hz, kHz, MHz, GHz, THz, rpm, deg/s, rad/s

**Parts Per**: ppm, ppb, ppt, ppq

**Speed**: m/s, km/h, m/h, knot, ft/s

**Pace**: min/km, s/m, min/mi, s/ft

**Pressure**: Pa, kPa, MPa, hPa, bar, torr, psi, ksi

**Digital**: b, Kb, Mb, Gb, Tb, B, KB, MB, GB, TB

**Illuminance**: lx, ft-cd

**Voltage**: V, mV, kV

**Current**: A, mA, kA

**Power**: W, mW, kW, MW, GW

**Apparent Power**: VA, mVA, kVA, MVA, GVA

**Reactive Power**: VAR, mVAR, kVAR, MVAR, GVAR

**Energy**: Wh, mWh, kWh, MWh, GWh, J, kJ

**Reactive Energy**: VARh, mVARh, kVARh, MVARh, GVARh

**Angle**: rad, deg, grad, arcmin, arcsec
