Formic-Formation
======

This is the (currently incomplete) Marrching Formation submission for Formic Functions. 

Building:
------

On a Unix-like system, install babel-minify, then run make. An unminified file can be found in "collected", and a minified file submission can be found in "all". 

You can also generate the file manually by running "cat *.js", then optionally running an EcmaScript 6 compatible minifier on the result. 

Overview:
------

This submission aims to create a line of ants that can sweep the area. Colors are used as signals to help the queen coordinate the line, not as trailmarkers. 

This submission uses three types of workers in addition to the queen:
    Type 1: Formation marcher, A phase
    Type 2: Formation matcher, B phase
    Type 3: Gatherer
    Type 4: Reserved for future use

Ants are created in a full-width diagonal line as follows: 

        A
        BA
         BA
          BA
           BA
            BA
             BA
              QG
               ..
                .

The first two ants created are a gatherer and an A-phase marcher. After that, ants are created with probability after finding food, alternating between A and B. In the formation, the gatherer alternates between an A-phase marcher and a B-phase marcher, depending on the formation matcher she last created. 

Early phase
------

When the queen spawns, she performs a bog-standard half-lightspeed straight-line walk, trying to avoid retracing her path. Once this gets her a single piece of food, she spawns a gatherer, and from there, the pair move diagonally at lightspeed until food is found, after which the queen spawns an A-phase marcher, and the matching strategy takes off. 

General behavior (unimplemented):
------

Ants march in lockstep, with phase A and phase B ants alternating between signal-sending and moving. Ants always move such that they remain adjavent to other ants. 

When an ant is diagonally behind an obstacle, it spends its signal phase shooting down the appropriate signal. The signal travels instantaneously down towards the queen (thanks to all the workers being in creation order), while upwards it can only manage lightspeed. The adjacent upstream marcher recognises the signal and propogates a signal to make the ants halt. 

If the signal is for food, the gatherer goes around, gets the food, and zips down to the queen with food. If the signal is for an obstructed worker, a panic gets sent upstream, while the remainder of the workers attempt to march on. 

(Ideally, the line would be more robust with workers trying to navigate around obstructions, but this is for later.) 

Workers disassociated from the line (either by mistake or by a panic signal) become saboteurs, scrambling nests and attempting to obstruct enemy workers they come across. They will actively avoid the formation if they run across it, as re-incorporation is impractical. 
