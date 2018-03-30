/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as lockstepping buddies and the other kind as the ones they alternate with. 

Marchers work by pattern-matching, choosing their movement based on the patterns of their neighbors. 

*/

function mdecide_one_corner(corner)
{
	if (view[corner].ant.type === QUEEN)
		return {cell:4};
	else return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_one_edge(corner)
{
	//This is only meaningful if the edge neighbor is a queen
	if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].ant.type === QUEEN)
	{
		if (view[CCW[corner][1]].ant.food > 0) return {cell:CCW[corner][3]};
		else return {cell:CCW[corner][2]};
	}
	else //Break away
		return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_two_edge_bent(corner)
{
	//TODO: Validate that we're in recovery, or one of the neighbors is a queen
	return {cell: CCW[corner][2]}; 
}

function mdecide_two_edge_straight(corner)
{
	//TODO: Validate that we're in recovery
	//Propogate UP_REALIGN
	//(Remember, we don't know if it's CCW[corner][1] or CCW[corner][5] that's upstream)
	return {cell:4, color:UP_REALIGN};
}

function mdecide_edge_corner_left(corner)
{
	//Special logic for arranging corners correctly
	if (is_other(CCW[corner][1]) && view[corner].ant.type === QUEEN)
		return {cell:CCW[corner][3]};

	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var sigs = working_signals();
	var primary = sigs[0];
	var secondary = sigs[1];

	if (primary === UP_REALIGN) return {cell:4, color:UP_REALIGN_END};
	if (primary === UP_READY) return {cell:4, color:UP_READY};
	if (secondary === UP_REALIGN) return {cell:4, color:UP_REALIGN_END};
	if (secondary === UP_READY) return {cell:4, color:UP_READY};

	if (view[corner].ant.type === GATHERER && view[CCW[corner][1]].ant.type === QUEEN)
		return {cell:4};

	//If none of the signals fit, go by the march
	return {cell:CCW[corner][2]};
	
}

function mdecide_edge_corner_right(corner)
{
	//Special logic do early-game correctly
	if (view[corner].ant.type === GATHERER && view[CCW[corner][7]].ant.type === QUEEN)
		if (is_ally(CCW[corner][4]) && view[CCW[corner][4]].ant.type !== this_ant().type)
			return {cell:CCW[corner][5]};

	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var sigs = working_signals();
	var primary = sigs[0];
	var secondary = sigs[1];

	if (primary === UP_REALIGN) return {cell:4, color:UP_REALIGN_END};
	if (primary === UP_READY) return {cell:4, color:UP_READY};
	if (secondary === UP_REALIGN) return {cell:4, color:UP_REALIGN_END};
	if (secondary === UP_READY) return {cell:4, color:UP_READY};

	//If none of the signals fit, go the color
	return {cell:4, color:DOWN_MARCH};
	
}

function mdecide_three_march(corner)
{
	//If we need to stay still, there will be UP_REALIGN_END at the hanging edge
	//First, read up on the colors
	var corner_color = view[corner].color //Needed?
	var attached_edge_color = view[CCW[corner][1]].color //Needed?
	var hanging_edge_color = view[CCW[corner][3]].color

	//Then decide
	if (hanging_edge_color === UP_REALIGN_END) return {cell:4, color:UP_REALIGN};

	//If neither matches our current situation, return
	return {cell:CCW[corner][2]};
	
}

function mdecide_three_stand(corner)
{
	//We stay still here. But which signal do we send?
	//If we're surrounded by UP_REALIGN, then send that
	var num_realigning_neighbors = 0;
	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][3]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	
	//Else send the all clear signal
	return {cell:4, color:DOWN_MARCH};
	
}

function mdecide_three_queen_stand(corner)
{
	//Propogate signals
	var sigs = working_signals();
	var primary = sigs[0];
	var secondary = sigs[1];

	//Now with those found
	if ((primary === DOWN_MARCH || secondary === DOWN_MARCH))
	{
		if (view[CCW[corner][1]].food === 1) return {cell:4, color:UP_REALIGN};
		if (view[CCW[corner][2]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][3]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (is_enemy(CCW[corner][6])) return {cell:4, color:UP_PANIC};
	}
	if ((primary === DOWN_FOOD || secondary === DOWN_FOOD))
	{
		if (view[CCW[corner][1]].food === 1) return {cell:4, color:UP_REALIGN};
		if (view[CCW[corner][2]].food === 1) return {cell:4, color:UP_REALIGN};
		if (view[CCW[corner][3]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][2]) && view[CCW[corner][2]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][3]) && view[CCW[corner][3]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}
	if ((primary === UP_REALIGN || secondary === UP_REALIGN))
	{
		if (view[CCW[corner][2]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][2]) && view[CCW[corner][2]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][3]) && view[CCW[corner][3]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}

	return {cell:4, color:PRECEDENCES[primary][secondary]};
	//Otherwise just keep going
	//return {cell:CCW[corner][6]};
}

function mdecide_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return {cell:4, color:UP_REALIGN};
}

function mdecide_three_marcher_hang(corner)
{
	return {cell:4};
}

function mdecide_four_z(corner)
{
	//Read all four colors, then choose the correct one
	var num_realigning_neighbors = 0;
	var num_stalled_neighbors = 0;

	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][3]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][4]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;

	if (view[4].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[corner].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][3]].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][4]].color === DOWN_STALLED) num_stalled_neighbors++;
	if (view[CCW[corner][7]].color === DOWN_STALLED) num_stalled_neighbors++;

	//Now, determine which to send
	if (num_realigning_neighbors > 1 && num_realigning_neighbors > num_stalled_neighbors) return {cell:4, color:UP_REALIGN};
	if (num_stalled_neighbors > 1) return {cell:4, color:DOWN_STALLED};
	return {cell:4, color:DOWN_MARCH};
	
}

function mdecide_four_stairs(corner)
{
	//Propogate signals
	var sigs = working_signals();
	var primary = sigs[0];
	var secondary = sigs[1];

	//Now with those found
	if ((primary === DOWN_MARCH || secondary === DOWN_MARCH))
	{
		if (view[CCW[corner][5]].food === 1) return {cell:4, color:UP_REALIGN};
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][7]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (is_enemy(CCW[corner][6])) return {cell:4, color:UP_PANIC};
	}
	if ((primary === DOWN_FOOD || secondary === DOWN_FOOD))
	{
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_ally(CCW[corner][5]) && view[CCW[corner][5]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}
	if ((primary === UP_REALIGN || secondary === UP_REALIGN))
	{
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:UP_REALIGN};
		if (is_ally(CCW[corner][5]) && view[CCW[corner][5]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
		if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER) return {cell:4, color:DOWN_GATHERER};
	}
	
	return {cell:4, color:PRECEDENCES[primary][secondary]};
	
	
}

//Don't step on food or enemies. Instead, signal. 
function marcher_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (view[candidate.cell].food !== 0) 
	{
		var sees_queen = false;
		for (try_cell of EDGES)
			if (is_ally(try_cell) && view[try_cell].ant.type === QUEEN) sees_queen = true;
		if (!sees_queen) return {cell:4, color:DOWN_FOOD};
	}
	if (is_harvestable(candidate.cell)) return {cell:4, color:DOWN_FOOD};
	if (view[candidate.cell].ant !== null) return {cell:4, color:UP_PANIC};
	return candidate;
}

function marcher_decision()
{
	var corner = view_corner();
	if (this_ant().food > 0) return sanitize(saboteur(), FREE_ORDER);
	switch (neighbor_type(corner))
	{
		case ONE_CORNER: return marcher_step_watch(mdecide_one_corner(corner));
		case ONE_EDGE: return marcher_step_watch(mdecide_one_edge(corner));
		case TWO_EDGE_BENT: return marcher_step_watch(mdecide_two_edge_bent(corner));
		case TWO_EDGE_STRAIGHT: return marcher_step_watch(mdecide_two_edge_straight(corner));
		case EDGE_CORNER_LEFT: return marcher_step_watch(mdecide_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return marcher_step_watch(mdecide_edge_corner_right(corner));
		case THREE_MARCH: return marcher_step_watch(mdecide_three_march(corner));
		case THREE_STAND: return marcher_step_watch(mdecide_three_stand(corner));
		case THREE_RECOVER: return marcher_step_watch(mdecide_three_recover(corner));
		case THREE_QUEEN_STAND: return marcher_step_watch(mdecide_three_queen_stand(corner));
		case THREE_MARCHER_HANG: return marcher_step_watch(mdecide_three_marcher_hang(corner));
		case FOUR_Z: return marcher_step_watch(mdecide_four_z(corner));
		case FOUR_STAIRS: return marcher_step_watch(mdecide_four_stairs(corner));
		default: return sanitize(saboteur(), FREE_ORDER);
	}
	
}










