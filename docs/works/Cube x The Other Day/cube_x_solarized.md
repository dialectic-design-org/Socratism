---
title: "Cube x Solarized"
slug: "/works/cube_x_solarized"
description: "Cube reacting to Solarized by Jeff Mills"
sidebar_position: 1
created: "2025-11-17"
issued: "2025-11-17"
creator: "Erwin Hoogerwoord"
contributor: "Jeff Mills"
subject: "Cube"
type: "digital"
format: "Visual audio-reactive"
source: "https://hyperobjects.ams3.cdn.digitaloceanspaces.com/2025-cube-x-tod/tod-solarized_cropped.mp4"
fileSource: "https://hyperobjects.ams3.cdn.digitaloceanspaces.com/2025-cube-x-tod/tod-solarized_cropped.mp4"
previewSource: "https://hyperobjects.ams3.cdn.digitaloceanspaces.com/2025-cube-x-tod/tod-solarized_preview_loop_cropped.mp4"
staticPreviewSource: "https://hyperobjects.ams3.cdn.digitaloceanspaces.com/2025-cube-x-tod/tod-solarized_cropped.mp4"
---

Cube reacting to Solarized by Jeff Mills.

Parameters tuned on the Cube scene through the Live Coding module in [HyperobjectsMacOS](https://github.com/dialectic-design-org/HyperobjectsMacOS) toolkit:

```javascript
var Solarized = {
    ...resetScene,
    ...SolarizedStart,
    
    "audio_add_Height": 0.1,
    "Outer Loop Cubes Count": 3,
    "Outer Loop Cubes spread y": 1.0,
    "Width delay": 0.2,
    "Height delay": 0.15,
    

    "audio_add_Depth": 0.3,
    "audio_delay_Depth": 0.3,
    "Depth delay": 0.1,


    "Rotation X": inputState["Rotation X"] < 2 ?
    inputState["Rotation X"] + 0.01 :
    inputState["Rotation X"],
    "Rotation Y": inputState["Rotation Y"] + 0.01, 
    
    "Rotation X Offset": inputState["Rotation X Offset"] < Math.PI * 100 ?
    inputState["Rotation X Offset"] + 0.02 :
    inputState["Rotation X Offset"],

    "Rotation Y Offset": inputState["Rotation Y Offset"] > -Math.PI * 100 ?
    inputState["Rotation Y Offset"] - 0.02 :
    inputState["Rotation Y Offset"],


    "Rotation Z Offset": inputState["Rotation Z Offset"] < Math.PI * 100 ?
    inputState["Rotation Z Offset"] + 0.02 :
    inputState["Rotation Z Offset"],


    "audio_add_Height": 1.0,
    "audio_add_Width": 0.1,
    "Outer Loop Cubes Count": 1,
    "Outer Loop Cubes spread y": 1.0,
    "Inner Loop Cubes Count": 3,
    "Inner Loop Cubes spread x": 1.0,


    "audio_add_Height": 0.5,
    "audio_add_Width": 0.5,
    "Outer Loop Cubes Count": 3,
    "Outer Loop Cubes spread y": 1.0,
    "Inner Loop Cubes Count": 3,
    "Inner Loop Cubes spread x": 1.0,


    "Width delay": 0.9,
    "Height delay": 0.6,
}
```