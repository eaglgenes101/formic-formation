Formic-Formation
======

This is the Marching Formation submission for [Formic Functions](https://codegolf.stackexchange.com/questions/135102/formic-functions-ant-queen-of-the-hill-contest). 

Building
------

On a Unix-like system, install babel-minify, then run make. An unminified debug version can be found in "for\_debug", an unminified submission can be found in "collected", and a minified submission can be found in "for\_release". 

You can also generate the file manually by running "cat noprint commons patterns saboteur *.js main releasefooter" or "cat print commons patterns saboteur *.js main debugfooter" and redirecting stdout to a file of your choice, then optionally running an EcmaScript 6 compatible minifier on the result. 

Overview
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

The first four ants ants created are a gatherer and a marcher, A or B with equal probability, then one of each. After that, ants are created with probability after finding food, alternating between A and B. In the formation, the queen gatherer alternates between the two phases of marching, depending on the formation marcher last created. 

Early phase
------

When the queen spawns, she performs a bog-standard half-lightspeed straight-line walk, trying to avoid retracing her path. Once this gets her a single piece of food, she spawns a gatherer. After gathering 3 pieces of food, for every additional piece of food, the queen has a moderate probability of spawning 3 workers in a hard-coded formation creation routine, and the line takes off. 

General behavior
------

Ants march in lockstep, with phase A and phase B ants alternating between stopping and moving. The phase is recognised via matching the pattern of their neighboring allies, as the ants are unable to store state. Ants always move such that they remain adjacent to at least two other ants. 

When an ant is diagonally behind an obstacle, it spends its turn shooting down the appropriate signal. The signal travels instantaneously down towards the queen (thanks to all the workers being in creation order), while upwards it can only manage lightspeed. The adjacent upstream marcher recognises the signal and propogates a signal to shoot a different signal up the line. 

Workers disassociated from the line (either by mistake or by a panic signal) become saboteurs, scrambling nests and attempting to obstruct enemy workers they come across. They will actively avoid the formation if they run across it, as re-incorporation is impractical. 

Food collection
------

When food is encountered, the line halts. However, because signals can only manage lightspeed upstream, it takes time for the signal to propogate upwards, which causes upstream to get bent into a straight line. The ants on the end prevent it from completely straightening out by bending into a hook, but they too are halted. 

The worker encountering the food shoots down a food signal instead of the usual clear signal, which all downstream ants relay and heed. The next turn, the same signal is recognised upstream and translated to a realignment signal, which travels upstream and causes workers upstream to also halt as they receive the signal. The last workers at the end maintain a bend at the end to maintain proximity to other workers. 

The downstream signal makes it to the queen in a single turn, which the gatherer recognises as a signal to walk the line. Following the edge of the food signal, the gatherer walks forward until it finds food, and then goes the opposite direction to return it to the queen. If there is more pending food, the food signal persists; otherwise a stalled signal now shoots down the line, signalling the queen to shoot a ready signal, which in turn signals the point of the bend to shoot down the march signal. 

Once the line goes back to marching, the stalled workers resume their march as the line catches up to them. The process occurs to the ants as the signals come to them, so it is entirely practical (and does happen) that the line resumes before the realign signal reaches the end of the line, or for an upstream part of the line to halt downstream before it receives a realign signal downstream. 

Off of the line
------

The line is designed to survive shearing, and any contiguous line of workers longer 3, along with a queen and gatherer, in creation order, is a full-functioning marching formation. Though the line is quite reliable, it is vulnerable to obstruction by enemy workers. When this happens, the ant that is most directly in front of the enemy worker emits a panic signal. The next turn, it shears off the line and goes off on its own, followed by all upstream workers which subsequently discover the inconsistency in not having anyone at their right, and do likewise. The downstream marchers are not bothered by this event, and continue marching. 

Once off of the line, workers become saboteurs. They attempt to recolor colored areas with surrounding colors to create a mess that somewhat resembles the original area but does not contain the patterns critical to nest functioning. They will actively stick around enemy workers and try to obstruct or mislead them, and will actively avoid allies to prevent them from interfering with the line. If they are not surrounded by color, they perform a straight-line half-lightspeed walk to seek new colored areas to mix up. 

Sabotaging workers may end up in a formation serendipitously, but the lack of a queen anchoring the right end should mean that they break apart soon after. If it doesn't, file a bug. 

Extras 
------

Queen looting is a work in progress. The workers will recognise enemy queens as food rather than as enemy workers, but precisely how this interacts afterwards is untested and untuned. 

To prevent existing color signals from interfering with the line, workers will recolor surrounding areas white if they would send a color signal, but are already standing on the color signal they want to send. This surroundings-clearing is so powerful that a marching formation can bore through a colored nest at full speed without problems. 

Queen spawning is controlled by probability. As the game goes on and the queen has more food on hand, she becomes less eager to spawn new lines and add workers to existing lines, down to a tuneable asymptotic limit probability. 

To-do
------

* Clean out logical cruft
* Allow the queen to extend the line even if food is off-phase
* Test and refine queen looting
* See if enemy workers can be walked around
* Investigate signal state reduction
* See if intentially shearing off the end worker helps

Release notes
------

1.0: First version put up for submission, initial release

1.0.1: Performed logical reductions, made compatible with more controllers

1.1: Compacted a bunch of stuff, improved logic relating to error cases

1.1.1: Hotfix to solve disqualification problem


