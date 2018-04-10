/*

The gatherer is the right hand (wo)man to the queen. She guides her during the early phase, she gets food for her during midgame, and she tells her to not revert to early-game tactics. 

*/

//Don't step on food or enemies. Instead, signal. 
function gatherer_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (view[candidate.cell].food !== 0 && this_ant().food !== 0) return turn_color2(UP_PANIC, 0);
	if (view[candidate.cell].ant !== null) return turn_color2(UP_PANIC, 0); 
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
		return turn_color(UP_READY, corner); 
	}
	if (view[corner].color === DOWN_MARCH && view[CCW[corner][1]].color === DOWN_MARCH)
	{
		return turn_color(DOWN_MARCH, corner);
	}
	return turn_color(view[4].color, corner);
	
}

function gdecide_edge_corner_right(corner)
{
	if ([DOWN_MARCH, DOWN_FOOD].includes(view[corner].color) && [DOWN_MARCH, DOWN_FOOD].includes(view[CCW[corner][7]].color))
		return {cell:CCW[corner][6]};
	if (view[corner].color === DOWN_STALLED && view[CCW[corner][7]].color === DOWN_STALLED)
	{
		return turn_color(UP_READY, corner);
	}
	if (is_ally(corner) && view[corner].ant.type === QUEEN)
		return {cell:CCW[corner][1]};
	return turn_color(view[4].color, corner);
	
}

function gdecide_three_gatherer_walk(corner)
{
	if (view[CCW[corner][7]].color == DOWN_FOOD)
		return {cell: CCW[corner][6]};
	return {cell:CCW[corner][2]};
}

function gdecide_four_bent(corner)
{
	return {cell:CCW[corner][4]};
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
		if (EDGES.includes(try_cell) && view[try_cell].food > 0) return {cell:4, color:DOWN_FOOD};
	}
	if (queen_cell === null) return {cell:4};

	if (this_ant().food === 0)
	{
		for (try_cell of random_permutation(CORNERS))
			if (view[try_cell].food > 0) 
			{
				if (view[4].color === DOWN_FOOD && NEARS[try_cell].includes(queen_cell)) return {cell:try_cell};
				else return {cell:4, color: DOWN_FOOD};
			}
		for (try_cell of random_permutation(EDGES))
			if (view[try_cell].food > 0) 
			{
				if (CCW[queen_cell][2] === try_cell) return {cell:4, color:DOWN_FOOD};
				else return {cell:4, color: DOWN_MARCH};
			}
	}

	if (view[4].color === DOWN_FOOD) return {cell:4, color:DOWN_MARCH};
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
		case THREE_GATHERER_WALK: 
		{
			//Walk forward only if given the DOWN_FOOD signal
			if (view[CCW[corner][7]].color === DOWN_FOOD)
				return gatherer_step_watch({cell:CCW[corner][6]});
			return gatherer_step_watch({cell:CCW[corner][2]});
		}
		case FOUR_BENT: return gatherer_step_watch(turn_color(view[4].color, corner));
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
		case FOUR_BENT: return gatherer_step_watch(gdecide_four_bent(corner));
		default: return sanitize(early_gatherer(), LEFT_ORDER);
	}
}

function gatherer_decision()
{
	var marcher_count = 0;
	var gatherer_count = 0;
	var queen_pos = null;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === GATHERER)
				gatherer_count++;
			if (view[try_cell].ant.type === QUEEN)
				queen_pos = try_cell;
		}
	}
	if (gatherer_count > 0)
	{
		return sanitize(saboteur(), FREE_ORDER);
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
