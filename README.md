Overview:
======

This is the (currently incomplete) Marrching Formation submission for Formic Functions

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

Ants are created with probability after finding food, alternating between A and B. In the formation, the gatherer alternates between an A-phase marcher and a B-phase marcher, depending on the formation matcher she last created. 

General behavior:
------

Ants march in lockstep, with phase A and phase B ants alternating between signal-sending and moving. Ants always move such that they remain adjavent to other ants. 

When an ant is diagonally behind an obstacle, it spends its signal phase shooting down the appropriate signal. The signal travels instantaneously down towards the queen (thanks to all the workers being in creation order), while upwards it can only manage lightspeed. The adjacent upstream marcher recognises the signal and propogates a signal to make the ants halt. 

If the signal is for food, the gatherer goes around, gets the food, and zips down to the queen with food. If the signal is for an obstructed worker, a panic gets sent upstream, while the remainder of the workers attempt to march on. 

(Ideally, the line would be more robust with workers trying to navigate around obstructions, but this is for later.) 

Workers disassociated from the line (either by mistake or by a panic signal) become sabotauers, scrambling nests and attempting to obstruct enemy workers they come across. They will actively avoid the formation if they run across it, as re-incorporation is impractical. 
