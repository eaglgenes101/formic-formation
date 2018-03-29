Formic-Formation
======

This is the (currently incomplete) Marrching Formation submission for Formic Functions. 

Building:
------

On a Unix-like system, install babel-minify, then run make. An unminified debug version can be found in "debug", an unminified submission can be found in "collected", and a minified submission can be found in "all". 

You can also generate the file manually by running "noprint commons patterns *.js main releasefooter" or "cat print commons patterns *.js main debugfooter" and redirecting stdout to a file of your choice, then optionally running an EcmaScript 6 compatible minifier on the result. 

Overview:
------

This submission aims to create a line of ants that can sweep the area. Colors are used as signals to help the queen coordinate the line, not as trailmarkers. 

This submission uses three types of workers in addition to the queen:
*    Type 1: Formation marcher, A phase
*    Type 2: Formation marcher, B phase
*    Type 3: Gatherer
*    Type 4: Reserved for future use

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

The first two ants created are a gatherer and an A-phase marcher. After that, ants are created with probability after finding food, alternating between A and B. In the formation, the gatherer alternates between an A-phase marcher and a B-phase marcher, depending on the formation marcher she last created. 

Early phase
------

When the queen spawns, she performs a bog-standard half-lightspeed straight-line walk, trying to avoid retracing her path. Once this gets her a single piece of food, she spawns a gatherer, and from there, the pair move diagonally at lightspeed until food is found, after which the queen spawns an A-phase marcher, and the marching strategy takes off. 

General behavior:
------

Ants march in lockstep, with phase A and phase B ants alternating between signal-sending and moving. Ants always move such that they remain adjacent to at least two other ants. 

When an ant is diagonally behind an obstacle, it spends its signal phase shooting down the appropriate signal. The signal travels instantaneously down towards the queen (thanks to all the workers being in creation order), while upwards it can only manage lightspeed. The adjacent upstream marcher recognises the signal and propogates a signal to make the ants halt. 

Workers disassociated from the line (either by mistake or by a panic signal) become saboteurs, scrambling nests and attempting to obstruct enemy workers they come across. They will actively avoid the formation if they run across it, as re-incorporation is impractical. 

Food collection
------

When food is encountered, the line halts. However, because signals can only manage lightspeed upstream, it takes time for the signal to propogate upwards, which causes upstream to get bent into a straight line. 

The worker encountering the food shoots down a food signal instead of the usual clear signal, which all downstream ants relay and heed. The next turn, the same signal is recognised upstream and translated to either a realign A or realign B signal, depending on the current phase of marching when the food is encountered. The last workers on the line can recognise the realign signal, and will maintain a bend at the end to maintain proximity to other workers. 

The downstream signal makes it to the queen in a single turn, and the queen in turn signals her gatherer to go up. Following the edge of the formation, the gatherer walks forward until it finds food, and then goes the opposite direction to return it to the queen. If there is more pending food, the food signal persists; otherwise a stalled signal now shoots down the line, signalling the queen to shoot a ready signal, which in turn signals the end of the line to signal the resumption of the march once it is straightened out. 

To enforce signal direction when both are running, the food signal is outprioritized by the realign signal except if the worker is adjacent to food, in which case the signal precedence is the other way around. 





