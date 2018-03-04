/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as lockstepping buddies and the other kind as the ones they alternate with. 

The oldest marcher still in the formation initiates the signal. 

*/

//Ant positions
const DISCONNECTED = -1;
const SENTINEL = 0;
const MIDDLE = 1;

//Returns a number to guess whether we, the current marcher of either phase, are the end of the line. 
//If we are, then we hold special significance as the current working last worker in the line. 
function formation_position()
{
	//If we have food, we aren't in the marching formation
	if (this_ant().food > 0) return DISCONNECTED;

	var num_neighbors = 0;
	var queen_pos = null;
	var gatherer_pos = null;

	for (try_cell of SCAN_MOVES)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			num_neighbors++;
			//The queen and gatherer act as the right formation sentinel, so count them too
			if (view[try_cell].ant.type === QUEEN) queen_pos = try_cell;
			else if (view[try_cell].ant.type === GATHERER) gatherer_pos = try_cell;
		}
	}

	if (num_neighbors === 0) return DISCONNECTED;

	//For 1 neighbor, check that this neighbor is the opposite-phase worker and is orthogonal to us
	//Also, check that this opposite-phase worker has no food
	if (num_neighbors === 1)
	{
		for (try_cell of EDGES)
		{
			if (view[try_cell].ant.type === (this_ant.type()===MARCHER_A?MARCHER_B:MARCHER_A))
			{
				//If this worker has food, we're not in the line
				if (view[try_cell].ant.food > 0) return DISCONNECTED;

				//Dissociate on a panic signal
				if (view[try_cell].color === UP_PANIC) return DISCONNECTED;

				return SENTINEL;
			}
		}
		return DISCONNECTED;
	}

	//For those with 2 neighbors, check that workers are where we expect them
	else if (num_neighbors === 2)
	{
		
	}

	//For those with 3 neighbors, check that two of three are in position 
	//and that the last isn't where we would expect the end
	else if (num_neighbors === 3)
	{
	}

	//Return false in all other cases
	
	
}

function phase()
{
}

function marcher_a_decision()
{
	//Currently stubbed
	
	return sanitize(saboteur(), FREE_ORDER);
}

function marcher_b_decision()
{
	//Currently stubbed

	return sanitize(saboteur(), FREE_ORDER);
}
