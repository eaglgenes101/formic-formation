//Constants
var MARCHER_A = 1;
var MARCHER_B = 2;
var GATHERER = 3;
var QUEEN = 5;

//Lookup tables (All scan orders generated with random.org)
var SCAN_ORDER = 		[0,6,3,8,5,1,2,7];
var INCOMPLETE_SCAN_ORDER = 	[2,6,1,7,0,5];
var HALF_SCAN_ORDER = 		[8,2,1,5];
var SPARSE_SCAN_ORDER = 	[3,5];
var RH_ENUMERATION = [	[0,3,6,7,8,5,2,1],	[1,0,3,6,7,8,5,2],	[2,1,0,3,6,7,8,5],
			[3,6,7,8,5,2,1,0],	[4,4,4,4,4,4,4,4],	[5,2,1,0,3,6,7,8],
			[6,7,8,5,2,1,0,3],	[7,8,5,2,1,0,3,6],	[8,5,2,1,0,3,6,7]];
var FREE_ORDER = [	[0,1,3,6,2,5,7,8,4], 	[1,0,2,5,3,6,8,7,4], 	[2,5,1,0,8,7,3,6,4],
			[3,6,0,1,7,8,2,5,4], 	[4],                 	[5,2,8,7,1,0,6,3,4],
			[6,3,7,8,0,1,5,2,4], 	[7,8,6,3,5,2,0,1,4], 	[8,7,5,2,6,3,1,0,4]];
var RIGHT_ORDER = [	[0,1,3,6,7,4], 		[1,0,3,4], 		[2,5,1,0,3,4],
			[3,6,7,4],     		[4],       		[5,2,1,4],
			[6,3,7,8,5,4], 		[7,8,5,4], 		[8,7,5,2,1,4]];
var LEFT_ORDER = [	[0,3,1,2,5,4], 		[1,2,5,4], 		[2,1,5,8,7,4],
			[3,0,1,4],     		[4],       		[5,8,7,4],
			[6,7,3,0,1,4], 		[7,6,3,4], 		[8,5,7,6,3,4]];

//Downstream signal colors (travel instantaneously)
var CLEAR_COLOR = 0; //We're all ready! Let's go!
var FOUND_FOOD_COLOR = 1; //We found food!
var OBSTRUCTED_WORKER_COLOR = 2; //We found an enemy worker!
var GATHERER_EXISTS_COLOR = 3; //Gatherer: "I'm still here!"

//Upstream signal colors (travel at lightspeed)
var MOVE_COLOR = 4; //Alright, everybody move on
var REALIGN_COLOR = 5; //Stop, let's realign the ranks
var TEST_COLOR = 6; //Where in creation order are you? 
var PANIC_COLOR = 7; //Everyone! Scatter! 

//Tuneables
var MOVEMENT_RAND_THRESHOLD = 4;
var GATHERER_SPAWN_THRESHOLD = 1;
var WORKER_SPAWN_THRESHOLD = 2;

/*
Functions shared by all ant types
*/

function this_ant()
{
	return view[4].ant;
}

//Movement submission sanitizer, for lone units
function sanitize(prospective, trial_matrix)
{
	//Bounds-checking
	if (prospective.cell < 0 || prospective.cell > 8) prospective.cell = 4;
	if (prospective.color < 1 || prospective.color > 7) delete prospective.color;
	if (prospective.type < 1 || prospective.type > 4) delete prospective.type;

	//Prevent workers from trying to birth worker ants
	if (prospective.hasOwnProperty("type") && this_ant().type !== QUEEN) delete prospective.type;

	//Prevent birthing of workers in occupied areas
	if (prospective.hasOwnProperty("type"))
	{
		for (try_cell of trial_matrix[prospective.cell])
		{
			if (view[try_cell].food === 0 && view[try_cell].ant === null)
			{
				prospective.cell = try_cell;
				return prospective;
			}
		}
		return {cell:4};
	}

	//If we're just coloring spaces, it's fine
	if (prospective.hasOwnProperty("color"))
		return prospective;


	for (try_cell of trial_matrix[prospective.cell])
	{
		if (view[try_cell].ant === null && (this_ant().type === QUEEN || this_ant().food === 0 || view[try_cell].food === 0))
		{
			prospective.cell = try_cell;
			return prospective;
		}
	}
	return {cell:4};
}

//Fallback function for workers
function saboteur()
{
	//Actively avoid other allied workers
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true) return {cell:RH_ENUMERATION[try_cell][4]};

	//Obstruct enemy workers
	for (try_cell of INCOMPLETE_SCAN_ORDER)
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === false) return {cell:try_cell};

	var c = this_ant().type+1
	for (try_cell of INCOMPLETE_SCAN_ORDER)
		if (view[try_cell].color > 1 && view[try_cell].color !== c) 
		{
			c = view[try_cell].color
			break;
		}

	//If there are more than 2 colored neighbors, settle in and scramble
	//Otherwise, do straight-line motion
	var colored_neighbors = 0;
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].color > 1)
			colored_neighbors++;
	if (colored_neighbors > 2)
	{
		//Recolor squares at random
		if (view[1].color !== view[6].color && view[6].color !== 1)
			return {cell:1, color:view[6].color};
		//if (view[3].color !== view[5].color && view[3].color !== 1)
		if (view[2].color !== view[3].color)
			return {cell:3, color:view[2].color};

		//Try to not move away from color
		if (view[1].color !== 1 && (view[0].color !== 1 && view[2].color !== 1)) return {cell:1};
		if (view[3].color !== 1 && (view[0].color !== 1 && view[6].color !== 1)) return {cell:3};
		if (view[5].color !== 1 && (view[8].color !== 1 && view[2].color !== 1)) return {cell:5};
		if (view[7].color !== 1 && (view[8].color !== 1 && view[6].color !== 1)) return {cell:7};
		if (view[1].color !== 1 && (view[0].color !== 1 || view[2].color !== 1)) return {cell:1};
		if (view[3].color !== 1 && (view[0].color !== 1 || view[6].color !== 1)) return {cell:3};
		if (view[5].color !== 1 && (view[8].color !== 1 || view[2].color !== 1)) return {cell:5};
		if (view[7].color !== 1 && (view[8].color !== 1 || view[6].color !== 1)) return {cell:7};

		return {cell:1};
	}
	else
	{
		if (view[4].color === 1) return {cell: 4, color: c};

		//Try to move in straight lines
		if (view[0].color === 1 && view[8].color !== 1) return {cell:0};
		if (view[2].color === 1 && view[6].color !== 1) return {cell:2};
		if (view[6].color === 1 && view[2].color !== 1) return {cell:6};
		if (view[8].color === 1 && view[0].color !== 1) return {cell:8};	
		if (view[2].color !== 1 && view[6].color !== 1 && view[0].color === 1) return {cell:0};
		if (view[0].color !== 1 && view[8].color !== 1 && view[2].color === 1) return {cell:2};
		if (view[0].color !== 1 && view[8].color !== 1 && view[6].color === 1) return {cell:6};
		if (view[2].color !== 1 && view[6].color !== 1 && view[8].color === 1) return {cell:8};

		return {cell:1};
	}
}

/*
Queen: Everything revolves around her. She is the one to be fed, she births all the workers, and she forms the right side of the marching formation. 

Strategy: For the opener (detected by the lack of surrounding workers), the queen moves in a straight line via color 3 (cyan), then once she has food, she spawns a gatherer. From there is the early phase, where the queen and the gatherer move at lightspeed. And then from there, the real march starts. If the queen is in formation but loses her gatherer, she spawns another one. 

If the queen loses the formation but has a gatherer or has food, she spawns a gatherer if needed and revers to early-phase. If she loses all food and the gatherer, she sends a panic, then reverts to the opener. 
*/

//Opening-phase queen (when the gatherer is not visible and the queen has no food)
function opening_queen()
{
	if (this_ant().food > 0) return {cell:0, type:GATHERER};

	//If one of the adjacent spaces has food, gather it
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].food === 1) return {cell:try_cell};

	//Actively avoid other workers
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].ant !== null) return {cell:RH_ENUMERATION[try_cell][4]};

	//If the color at the current cell is 0 (white), color it 4 (cyan)
	if (view[4].color !== 6) return {cell: 4, color: 6};

	//If any of the ground is cyan, avoid it.
	//Otherwise, just choose a direction that won't cause a run-in. 
	else if (view[0].color !== 6 && view[8].color === 6) return {cell:0};
	else if (view[2].color !== 6 && view[6].color === 6) return {cell:2};
	else if (view[6].color !== 6 && view[2].color === 6) return {cell:6};
	else if (view[8].color !== 6 && view[0].color === 6) return {cell:8};
	else if (view[2].color === 6 && view[6].color === 6 && view[0].color !== 6) return {cell:0};
	else if (view[0].color === 6 && view[8].color === 6 && view[2].color !== 6) return {cell:2};
	else if (view[0].color === 6 && view[8].color === 6 && view[6].color !== 6) return {cell:6};
	else if (view[2].color === 6 && view[6].color === 6 && view[8].color !== 6) return {cell:8};

	else return {cell:0};
	
}

//Early-phase queen (when the queen and the gatherer are moving together at lightspeed, trying to find more food)
function early_queen()
{
	//Find the gatherer, revolve counterclockwise around her
	var gatherer_cell = null;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true && view[try_cell].ant.type === GATHERER)
		{
			gatherer_cell = try_cell;
			break;
		}
	}
	if (gatherer_cell === null || gatherer_cell%2 === 0)
		return {cell:4};
	return {cell:RH_ENUMERATION[gatherer_cell][1]};
}

/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as buddies and the other kind as the ones they alternate with. 

The oldest marcher still in the formation initiates the signal. 

*/



/*

The gatherer is the right hand (wo)man to the queen. She guides her during the early phase, she gets food for her during midgame, and she tells her to not revert to early-game tactics. 

*/

function early_gatherer()
{
	//Revolve clockwise around the queen
	var queen_cell = null;
	var food_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true && view[try_cell].ant.type === QUEEN)
		{
			queen_cell = try_cell;
			break;
		}
		if (view[try_cell].food > 0)
		{
			return {cell:4};
		}
	}
	if (queen_cell === null)
		return {cell:4};
	//If a food cell is adjacent to the queen, get it
	if (this_ant().food === 0)
	{
		if (view[0].food > 0 && (queen_cell === 1 || queen_cell === 3)) return {cell:0};
		if (view[2].food > 0 && (queen_cell === 1 || queen_cell === 5)) return {cell:2};
		if (view[8].food > 0 && (queen_cell === 7 || queen_cell === 5)) return {cell:8};
		if (view[6].food > 0 && (queen_cell === 7 || queen_cell === 3)) return {cell:6};
		if (view[1].food > 0 && (queen_cell === 0 || queen_cell === 2 || queen_cell === 3 || queen_cell === 5))
			return {cell:1};
		if (view[3].food > 0 && (queen_cell === 0 || queen_cell === 6 || queen_cell === 1 || queen_cell === 7))
			return {cell:3};
		if (view[7].food > 0 && (queen_cell === 8 || queen_cell === 6 || queen_cell === 3 || queen_cell === 5))
			return {cell:7};
		if (view[5].food > 0 && (queen_cell === 8 || queen_cell === 2 || queen_cell === 1 || queen_cell === 7))
			return {cell:5};
	}
	return {cell:RH_ENUMERATION[queen_cell][7]};
	
}

//Functions for collection of casework

function queen_decision()
{
	marcher_count = 0;
	gatherer_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === GATHERER)
				gatherer_count++;
		}
	}
	/*
	if (marcher_count > 0)
	{
		
	}
	*/
	if (gatherer_count === 1)
	{
		return sanitize(early_queen(), LEFT_ORDER);
	}
	return sanitize(opening_queen(), FREE_ORDER);
}

function marcher_a_decision()
{
}

function marcher_b_decision()
{
}

function gatherer_decision()
{
	marcher_count = 0;
	queen_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === QUEEN)
				queen_count++;
		}
	}
	/*
	if (marcher_count > 0)
	{
		
	}
	*/
	if (queen_count === 1)
	{
		return sanitize(early_gatherer(), RIGHT_ORDER);
	}
	return sanitize(saboteur(), FREE_ORDER);
}


switch (this_ant().type)
{
	case QUEEN:
		return queen_decision();
	case GATHERER:
		return gatherer_decision();
	default:
		return sanitize(saboteur(), FREE_ORDER);

}












