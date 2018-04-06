/*

The gatherer is the right hand (wo)man to the queen. She guides her during the early phase, she gets food for her during midgame, and she tells her to not revert to early-game tactics. 

*/

//Don't step on food or enemies. Instead, signal. 
function gatherer_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (view[candidate.cell].food !== 0 && this_ant().food !== 0) return {cell:4, color:UP_PANIC};
	if (view[candidate.cell].ant !== null) return {cell:4, color:UP_PANIC};
	return candidate;
}

function gdecide_two_edge_bent(corner)
{
	return {cell:CCW[corner][4]};
}

function gdecide_edge_corner_left(corner)
{
	//Look for signal to walk the line for food
	if (view[corner].color === DOWN_FOOD && view[CCW[corner][1]].color === DOWN_FOOD)
	{
		return {cell:CCW[corner][7]};
	}
	if (view[corner].color === DOWN_STALLED && view[CCW[corner][1]].color === DOWN_STALLED)
	{
		return {cell:4, color:UP_READY};
	}
	/*
	//return {cell:CCW[corner][2]};
	//If none of the signals fit, go the color
	return {cell:4, color:PUTPRECS[view[corner].color][view[CCW[corner][1]].color]};
	*/
	return {cell:4};
	
}

function gdecide_edge_corner_right(corner)
{
	if ([DOWN_MARCH, DOWN_FOOD].includes(view[corner].color) && [DOWN_MARCH, DOWN_FOOD].includes(view[CCW[corner][7]].color))
		return {cell:CCW[corner][6]};
	if (view[corner].color === DOWN_STALLED && view[CCW[corner][7]].color === DOWN_STALLED)
	{
		return {cell:4, color:UP_READY};
	}
	if (is_ally(corner) && view[corner].ant.type === QUEEN)
		return {cell:CCW[corner][1]};
	/*return {cell:4, color:PUTPRECS[view[corner].color][view[CCW[corner][7]].color]};*/
	return {cell:4};
	
}

function gdecide_three_gatherer_walk(corner)
{
	if (view[CCW[corner][7]].color == DOWN_FOOD)
		return {cell: CCW[corner][6]};
	return {cell:CCW[corner][2]};
}

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
		if (view[try_cell].food > 0) return {cell:4};
	}
	if (queen_cell === null) return {cell:4};
	//If a food cell is adjacent to the queen, get it
	if (this_ant().food === 0)
		for (try_cell of random_permutation(SCAN_MOVES))
			if (view[try_cell].food > 0 && NEARS[try_cell].includes(queen_cell)) return {cell:try_cell};
	if (view[queen_cell].color === DOWN_FOOD)
		return {cell:CCW[queen_cell][7]};
	return {cell:CCW[queen_cell][1]};
	
}

function gatherer_retrieve()
{
	//TODO: Only walk food-colored perimeters
	//TODO: Have some way to return empty-handed
	var corner = view_corner();
	switch(neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch({cell:CCW[corner][2]});
		case THREE_GATHERER_WALK: return gatherer_step_watch({cell:CCW[corner][6]});
		case FOUR_BENT: return gatherer_step_watch({cell:4});
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}

function gatherer_return()
{
	var corner = view_corner();
	switch(neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch({cell:CCW[corner][2]});
		case THREE_GATHERER_WALK: return gatherer_step_watch({cell:CCW[corner][2]});
		case FOUR_BENT: return gatherer_step_watch({cell:CCW[corner][4]});
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}


function gatherer_formation()
{
	var corner = view_corner();
	switch (neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch(gdecide_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return gatherer_step_watch(gdecide_edge_corner_right(corner));
		case TWO_EDGE_BENT: return gatherer_step_watch(gdecide_two_edge_bent(corner));
		case THREE_GATHERER_WALK: return gatherer_step_watch(gdecide_three_gatherer_walk(corner));
		default: return sanitize(early_gatherer(), LEFT_ORDER);
	}
}

function gatherer_decision()
{
	var marcher_count = 0;
	var queen_pos = null;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
			{
				marcher_count++;
			}
			if (view[try_cell].ant.type === QUEEN)
				queen_pos = try_cell;
		}
	}
	if (this_ant().food > 0 && marcher_count > 0)
	{
		return gatherer_step_watch(gatherer_return());
	}
	else if ((queen_pos !== null) && (marcher_count > 0))
	{
		return gatherer_step_watch(gatherer_formation());
	}
	else if (marcher_count > 0)
	{
		return gatherer_step_watch(gatherer_retrieve());
	}
	else if (queen_pos !== null)
	{
		return sanitize(early_gatherer(), LEFT_ORDER);
	}
	else 
	{
		return sanitize(saboteur(), FREE_ORDER);
	}
}
