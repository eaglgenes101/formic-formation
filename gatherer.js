/*

The gatherer is the right hand (wo)man to the queen. She guides her during the early phase, she gets food for her during midgame, and she tells her to not revert to early-game tactics. 

*/

function early_gatherer()
{
	//Revolve clockwise around the queen
	var queen_cell = null;
	var food_count = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell) && view[try_cell].ant.type === QUEEN)
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
		for (try_cell of random_permutation(SCAN_MOVES))
			if (view[try_cell].food > 0 && NEIGHBORS[try_cell].includes(queen_cell)) return {cell:try_cell};
	return {cell:CCW[queen_cell][1]};
	
}

function gatherer_decision()
{
	marcher_count = 0;
	queen_pos = null;
	for (try_cell of SCAN_MOVES)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === QUEEN)
				queen_pos = try_cell;
		}
	}
	if (queen_pos !== null && marcher_count > 0)
	{
		//
	}
	else if (queen_pos !== null)
	{
		return sanitize(early_gatherer(), LEFT_ORDER);
	}
	return sanitize(saboteur(), FREE_ORDER);
}
