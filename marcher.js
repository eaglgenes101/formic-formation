/*

Marcher phase A and Marcher phase B are two sides of a coin. They operate almost identically, differing only in recognising their own kind as lockstepping buddies and the other kind as the ones they alternate with. 

Marchers work by pattern-matching, choosing their movement based on the patterns of their neighbors. 

*/

//Common line-watching function for signalling and stalled ants
function linewatch(corner)
{
	if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER)
		return {cell:4, color:DOWN_GATHERER};
	if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER)
		if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].color === DOWN_GATHERER)
			return {cell:4, color:DOWN_GATHERER};
	if (view[CCW[corner][6]].food === 1)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][7]].food === 1 && is_ally(CCW[corner][1]) && view[CCW[corner][1]].color === DOWN_FOOD)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][5]].food === 1 && is_ally(CCW[corner][3]) && view[CCW[corner][3]].ant.type !== QUEEN)
		return {cell:4, color:UP_REALIGN};
	return null;
}

function linewatch2(corner)
{
	if (is_ally(CCW[corner][6]) && view[CCW[corner][6]].ant.type === GATHERER)
		return {cell:4, color:DOWN_GATHERER};
	if (is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type === GATHERER)
		if (is_ally(CCW[corner][1]) && view[CCW[corner][1]].color === DOWN_GATHERER)
			return {cell:4, color:DOWN_GATHERER};
	if (is_ally(CCW[corner][2]) && view[CCW[corner][2]].ant.type === GATHERER)
		return {cell:4, color:DOWN_GATHERER};
	if (is_ally(CCW[corner][3]) && view[CCW[corner][3]].ant.type === GATHERER)
		if (is_ally(CCW[corner][5]) && view[CCW[corner][5]].color === DOWN_GATHERER)
			return {cell:4, color:DOWN_GATHERER};
	if (view[CCW[corner][6]].food === 1)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][7]].food === 1 && is_ally(CCW[corner][1]) && view[CCW[corner][1]].color === DOWN_FOOD)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][5]].food === 1 && is_ally(CCW[corner][3]) && view[CCW[corner][3]].ant.type !== QUEEN)
		return {cell:4, color:UP_REALIGN};
	if (view[CCW[corner][2]].food === 1)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][3]].food === 1 && is_ally(CCW[corner][5]) && view[CCW[corner][5]].color === DOWN_FOOD)
		return {cell:4, color:DOWN_FOOD};
	if (view[CCW[corner][1]].food === 1 && is_ally(CCW[corner][7]) && view[CCW[corner][7]].ant.type !== QUEEN)
		return {cell:4, color:UP_REALIGN};
	return null;
}

function mdecide_one_corner(corner)
{
	if (view[corner].ant.type === QUEEN)
		return {cell:4};
	else return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_one_edge(corner)
{
	//This occurs when we march forward as the end, but the next corner neighbor is obstructed
	//Find this condition
	if (view[CCW[corner][1]].color === DOWN_MARCH)
	{
		if (view[CCW[corner][2]].food === 1)
			return {cell:corner};
	}

	//Break away
	return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_two_edge_bent(corner)
{
	//In recovery, do the moving step
	if ([DOWN_STALLED, UP_READY].includes(view[CCW[corner][1]].color) && [DOWN_STALLED, UP_READY].includes(view[4].color))
		return {cell:4, color:PUTPRECS[view[CCW[corner][1]].color][view[CCW[corner][3]].color]};
	return {cell:CCW[corner][2]}; 
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

	var down_sig = GETPRECS[view[corner].color][view[CCW[corner][1]].color];

	//Marching, or recovering? 
	if (down_sig === UP_REALIGN)
		return {cell:4, color:UP_REALIGN_END};

	if (down_sig === UP_READY)
		return {cell:4, color:DOWN_MARCH};

	if ([DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED].includes(down_sig))
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) 
		{
			if (provisional.color === UP_REALIGN)
				return {cell:4, color:UP_REALIGN_END};
			return provisional;
		}
		if ([DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED].includes(view[4].color))
		{
			//No gatherer in sight? send down DOWN_STALLED
			return {cell:4, color:DOWN_STALLED};
		}
		return {cell:4, color:down_sig};
	}

	//If none of the signals fit, go by the march
	return {cell:CCW[corner][2]};
	
}

function mdecide_edge_corner_right(corner)
{
	//Special logic do early-game correctly
	if (view[corner].ant.type === GATHERER && view[CCW[corner][7]].ant.type === QUEEN)
		if (is_ally(CCW[corner][4]) && view[CCW[corner][4]].ant.type !== this_ant().type)
			return {cell:CCW[corner][5]};

	var down_sig1 = GETPRECS[view[corner].color][view[CCW[corner][7]].color];
	var down_sig2 = GETPRECS[view[corner].color][view[CCW[corner][1]].color];
	var down_sig = (down_sig2 === DOWN_MARCH) ? down_sig1 : down_sig2;

	//Marching, or recovering? 
	if (down_sig === UP_REALIGN)
		return {cell:4, color:UP_REALIGN_END};

	if (down_sig === UP_READY)
		return {cell:4, color:DOWN_MARCH};

	if ([DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED].includes(down_sig))
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) 
		{
			if (provisional.color === UP_REALIGN)
				return {cell:4, color:UP_REALIGN_END};
			return provisional;
		}
		if ([DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED].includes(view[4].color))
		{
			//No gatherer in sight? send down DOWN_STALLED
			return {cell:4, color:DOWN_STALLED};
		}
		return {cell:4, color:down_sig};
	}

	//If none of the signals fit, go the color
	return {cell:4, color:down_sig};
	
}

function mdecide_three_march(corner)
{
	//If we need to stay still, there will be UP_REALIGN_END near the top

	//Then decide
	if (view[corner].color === UP_REALIGN_END && view[CCW[corner][3]].color !== DOWN_MARCH) 
		return {cell:4, color:UP_REALIGN};

	var down_sig = GETPRECS[view[corner].color][view[CCW[corner][1]].color];
	var up_sig = view[CCW[corner][3]].color;

	if ([DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED, UP_READY].includes(down_sig))
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) return provisional;
		return {cell:4, color:PUTPRECS[down_sig][up_sig]};
	}

	//If none matches our current situation, return
	return {cell:CCW[corner][2]};
	
}

function mdecide_three_stand(corner)
{
	//We stay still here. But which signal do we send?
	//If we're surrounded by UP_REALIGN, then send that
	var num_realigning = 0;
	var num_marching = 0;
	if ([UP_REALIGN, UP_REALIGN_END].includes(view[4].color)) num_realigning++;
	if ([UP_REALIGN, UP_REALIGN_END].includes(view[corner].color)) num_realigning++;
	if ([UP_REALIGN, UP_REALIGN_END].includes(view[CCW[corner][3]].color)) num_realigning++;
	if ([UP_REALIGN, UP_REALIGN_END].includes(view[CCW[corner][7]].color)) num_realigning++;
	if ([DOWN_MARCH].includes(view[4].color)) num_marching++;
	if ([DOWN_MARCH].includes(view[corner].color)) num_marching++;
	if ([DOWN_MARCH].includes(view[CCW[corner][3]].color)) num_marching++;
	if ([DOWN_MARCH].includes(view[CCW[corner][7]].color)) num_marching++;
	
	if (num_realigning > 0 && num_realigning >= num_marching) return {cell:4, color:UP_REALIGN};
	
	//Else send the all clear signal
	return {cell:4, color:DOWN_MARCH};
	
}

function mdecide_three_queen_stand(corner)
{
	//This is FOUR_STAIRS, but the gatherer jumped the gun here, 
	//or the corner is stalled 
	// ****
	// bA**
	// *Bqg
	// ****
	if (view[CCW[corner][5]].ant.type === QUEEN)
	{
		var provisional = linewatch(corner);
		if (provisional !== null) return provisional;

		var down_sig = GETPRECS[view[corner].color][view[CCW[corner][7]].color];
	
		return {cell:4, color:down_sig};
	}
	else
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) return provisional;
		//We are near the corner, and it's stalled
		return {cell:4, color:view[CCW[corner][5]].color};
	}
}

function mdecide_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return {cell:4, color:UP_REALIGN_END};
}

function mdecide_three_marcher_hang(corner)
{
	//This is FOUR_STAIRS, but the queen is going out to spawn a worker
	// ba**
	// *B*g
	// **q*
	//We know that upstream is in the direction of cell 4, so
	//transmit signals on behalf of the two ants at cells 3 and 4
	if (view[corner].ant.type !== QUEEN) return sanitize(saboteur(), FREE_ORDER);
	return {cell:4, color:PUTPRECS[view[CCW[corner][3]].color][view[CCW[corner][4]].color]};
}

function mdecide_four_z(corner)
{
	//Under certain conditions, this can appear during recovery
	//But this is usually a normal-march thing, so check both sides for indicators
	var provisional = linewatch2(CCW[corner][4]);
	if (provisional !== null) return provisional;
	var up_sig = GETPRECS[view[corner].color][view[CCW[corner][7]].color];
	var down_sig = GETPRECS[view[CCW[corner][4]].color][view[CCW[corner][3]].color];

	return {cell:4, color:PUTPRECS[up_sig][down_sig]};
}

function mdecide_four_stairs(corner)
{
	//This is a heavyweight. We are stalled, and therefore we become a transmission channel of sorts for 
	//all sorts of signals. The signals needs to be transmitted correctly for the whole gameplan to work out. 
	//No movement, though, so that doesn't need to be considered. 
	
	//Here, we have no idea if we're on the front or back of the formation. 
	// b**  ba*
	// aB*  *Ba
	// *ab  **b

	var provisional = linewatch2(corner);
	if (provisional !== null) return provisional;

	if ([UP_REALIGN, UP_REALIGN_END].includes(view[CCW[corner][7]].color))
	{
		if ([DOWN_FOOD, DOWN_STALLED, DOWN_GATHERER].includes(view[CCW[corner][4]]))
			return {cell:4, color:DOWN_STALLED};
	}
	if (view[CCW[corner][5]].color === DOWN_STALLED)
	{
		if ([DOWN_FOOD, DOWN_STALLED, DOWN_GATHERER].includes(view[CCW[corner][3]]))
			return {cell:4, color:DOWN_STALLED};
	}
	

	var up_sig = GETPRECS[view[corner].color][view[CCW[corner][1]].color];
	var down_sig = GETPRECS[view[CCW[corner][4]].color][view[CCW[corner][3]].color];

	return {cell:4, color:PUTPRECS[up_sig][down_sig]};
	
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










