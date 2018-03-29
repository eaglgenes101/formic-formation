/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as lockstepping buddies and the other kind as the ones they alternate with. 

Marchers work by pattern-matching, choosing their movement based on the patterns of their neighbors. 

*/

// 10 functions to determine what to do for each of the 10 canonical views
// All other views cause dispatch to the saboteur routine

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
	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var num_realigning_neighbors = 0;
	var num_ready_neighbors = 0;
	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][1]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[4].color === UP_READY) num_ready_neighbors++;
	if (view[corner].color === UP_READY) num_ready_neighbors++;
	if (view[CCW[corner][1]].color === UP_READY) num_ready_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	if (num_ready_neighbors > 1) return {cell:4, color:UP_READY};

	if (view[corner].ant.type === GATHERER && view[CCW[corner][1]].ant.type === QUEEN)
		return {cell:4};

	//If none of the signals fit, go by the march
	return {cell:CCW[corner][2]};
	
}

function mdecide_edge_corner_right(corner)
{

	//Marching, or recovering? 
	//Guess by sampling ourselves and our two neighbors for UP_REALIGN
	var num_realigning_neighbors = 0;
	var num_ready_neighbors = 0;

	if (view[4].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[corner].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[CCW[corner][7]].color === UP_REALIGN) num_realigning_neighbors++;
	if (view[4].color === UP_READY) num_ready_neighbors++;
	if (view[corner].color === UP_READY) num_ready_neighbors++;
	if (view[CCW[corner][7]].color === UP_READY) num_ready_neighbors++;

	if (num_realigning_neighbors > 1) return {cell:4, color:UP_REALIGN_END};
	if (num_ready_neighbors > 1) return {cell:4, color:UP_READY};

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

function mdecide_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return {cell:4, color:UP_REALIGN};
}

function mdecide_three_hang(corner)
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
	//This pattern, though always still, is most complex, since most signalling happens along this pattern
	//First, get the color counts in ourself and the surrounding neighbors, since we'll need it all we can get. 
	var counts = [0,0,0,0,0,0,0,0,0]
	counts[view[4].color]++;
	counts[view[corner].color]++;
	counts[view[CCW[corner][1]]]++;
	counts[view[CCW[corner][3]]]++;
	counts[view[CCW[corner][4]]]++;

	//Try to trim away all but two colors, the primary and secondary color
	var primary = null;
	var secondary = null;
	var singular_colors = [];
	var pair_colors = [];
	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 1) singular_colors.push(i);
		else if (counts[i] === 2) pair_colors.push(i);
	}

	for (var i = 1; i <= 8; i++)
	{
		if (counts[i] === 5) //Too easy
		{
			primary = i;
			secondary = UP_PANIC;
		}
		else if (counts[i] === 4) //Also too easy
		{
			primary = i;
			secondary = singular_colors[0];
		}
		else if (counts[i] === 3)
		{
			primary = i;
			if (singular_colors.length === 2) secondary = based_precedence(primary, singular_colors);
			else secondary = pair_colors[0];
		}
	}

	if (primary === null)
	{
		primary = multisig_precedence( (pair_colors.length === 0) ? singular_colors : pair_colors);
		secondary = based_precedence( primary, (pair_colors.length < 2) ? singular_colors : pair_colors);
	}

	//Now with those found
	if ((primary === DOWN_MARCH || secondary === DOWN_MARCH))
	{
		if (view[CCW[corner][5]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][6]].food === 1) return {cell:4, color:DOWN_FOOD};
		if (view[CCW[corner][7]].food === 1) return {cell:4, color:UP_REALIGN};
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
	if (view[candidate.cell].food !== 0) return {cell:4, color:DOWN_FOOD};
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
		case ONE_EDGE: return marcher_step_watch(mdecide_one_edge(corner));
		case TWO_EDGE_BENT: return marcher_step_watch(mdecide_two_edge_bent(corner));
		case TWO_EDGE_STRAIGHT: return marcher_step_watch(mdecide_two_edge_straight(corner));
		case EDGE_CORNER_LEFT: return marcher_step_watch(mdecide_edge_corner_left(corner));
		case EDGE_CORNER_RIGHT: return marcher_step_watch(mdecide_edge_corner_right(corner));
		case THREE_MARCH: return marcher_step_watch(mdecide_three_march(corner));
		case THREE_STAND: return marcher_step_watch(mdecide_three_stand(corner));
		case THREE_RECOVER: return marcher_step_watch(mdecide_three_recover(corner));
		case THREE_HANG: return marcher_step_watch(mdecide_three_hand(corner));
		case FOUR_Z: return marcher_step_watch(mdecide_four_z(corner));
		case FOUR_STAIRS: return marcher_step_watch(mdecide_four_stairs(corner));
		default: return sanitize(saboteur(), FREE_ORDER);
	}
	
}










