//The gatherer

//Don't step on food or enemies. Instead, signal. 
function gatherer_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (view[candidate.cell].food !== 0 && this_ant().food !== 0) return turn_color2(U_PANIC, 0);
	if (view[candidate.cell].ant !== null) return turn_color2(U_PANIC, 0); 
	return candidate;
}

function gdecide_two_edge_bent(corner)
{
	return {cell:CCW[corner][4]};
}

function gdecide_edge_corner_left(corner)
{
	//Look for signal to walk the line for food
	if (view[corner].color === D_FOOD && view[CCW[corner][1]].color === D_FOOD) return {cell:CCW[corner][7]};
	if (view[corner].color === D_STALLED && view[CCW[corner][1]].color === D_STALLED) return turn_color(U_READY, CCW[corner][1]); 
	if (view[corner].color === D_MARCH && view[CCW[corner][1]].color === D_MARCH) return turn_color(D_MARCH, CCW[corner][1]);
	return turn_color(view[4].color, CCW[corner][1]);
	
}

function gdecide_edge_corner_right(corner)
{
	if ([D_MARCH, D_FOOD].includes(view[corner].color) && [D_MARCH, D_FOOD].includes(view[CCW[corner][7]].color))
		return {cell:CCW[corner][6]};
	if (view[corner].color === D_STALLED && view[CCW[corner][7]].color === D_STALLED)
		return turn_color(U_READY, CCW[corner][1]);
	if (is_ally(corner) && view[corner].ant.type === QUEEN)
		return {cell:CCW[corner][1]};
	return turn_color(view[4].color, CCW[corner][1]);
	
}

function gdecide_three_block(corner)
{
	if (view[CCW[corner][7]].color == D_FOOD) return {cell: CCW[corner][6]};
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
		if (is_ally(try_cell) && view[try_cell].ant.type === QUEEN) queen_cell = try_cell;
		else if (is_enemy(try_cell)) sanitize(saboteur(), FREE_ORDER);
	}
	if (queen_cell === null) return sanitize(saboteur(), FREE_ORDER);
	if (view[queen_cell].color === D_FOOD) return {cell:CCW[queen_cell][7]};

	if (this_ant().food === 0)
	{
		for (try_cell of random_permutation(CORNERS))
			if (view[try_cell].food > 0) 
			{
				if (view[4].color === D_FOOD && NEARS[try_cell].includes(queen_cell)) return {cell:try_cell};
				else if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			}
		for (try_cell of random_permutation(EDGES))
			if (view[try_cell].food > 0) 
			{
				if (CCW[queen_cell][2] === try_cell) 
				{
					if (view[4].color !== D_FOOD) return {cell:4, color:D_FOOD};
					else return {cell:CCW[queen_cell][1]};
				}
				else if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			}
	}
	return {cell:CCW[queen_cell][1]};
	
}

function gatherer_retrieve()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var corner = view_corner();
	switch(neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch({cell:CCW[corner][2]});
		case THREE_BLOCK: 
		{
			//Walk forward only if given the D_FOOD signal
			if (view[CCW[corner][7]].color === D_FOOD) return gatherer_step_watch({cell:CCW[corner][6]});
			return gatherer_step_watch({cell:CCW[corner][2]});
		}
		case FOUR_BENT: return gatherer_step_watch(turn_color(view[4].color, corner));
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}

function gatherer_return()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var corner = view_corner();
	switch(neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch({cell:CCW[corner][2]});
		case THREE_BLOCK: return gatherer_step_watch({cell:CCW[corner][2]});
		case FOUR_BENT: return gatherer_step_watch({cell:CCW[corner][4]});
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}


function gatherer_formation()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var corner = view_corner();
	switch (neighbor_type(corner))
	{
		case EDGE_CORNER_LEFT: return gatherer_step_watch(gdecide_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return gatherer_step_watch(gdecide_edge_corner_right(corner));
		case TWO_EDGE_BENT: return gatherer_step_watch(gdecide_two_edge_bent(corner));
		case THREE_BLOCK: return gatherer_step_watch(gdecide_three_block(corner));
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
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B) marcher_count++;
			if (view[try_cell].ant.type === GATHERER) gatherer_count++;
			if (view[try_cell].ant.type === QUEEN) queen_pos = try_cell;
		}
	if (gatherer_count > 0) return sanitize(saboteur(), FREE_ORDER);
	if (this_ant().food > 0 && marcher_count > 0) return gatherer_step_watch(gatherer_return());
	else if ((queen_pos !== null) && (marcher_count > 0)) return gatherer_step_watch(gatherer_formation());
	else if (marcher_count > 0) return gatherer_step_watch(gatherer_retrieve());
	else if (queen_pos !== null) return sanitize(early_gatherer(), LEFT_ORDER);
	else return sanitize(saboteur(), FREE_ORDER);
}
