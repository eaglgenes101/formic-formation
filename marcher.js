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
	//This occurs when we march forward as the end, but the next corner neighbor is obstructed
	//Find this condition
	if (view[CCW[corner][1]].color === UP_REALIGN)
	{
		if (view[CCW[corner][2]].food === 1)
			return {cell:corner};
	}

	//Break away
	return sanitize(saboteur(), FREE_ORDER);
}

function mdecide_two_edge_bent(corner)
{
	//Eject in scenarios where we would otherwise deadlock
	
	if (view[CCW[corner][1]].ant.type === GATHERER && view[CCW[corner][3]].ant.type === QUEEN)	
		return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[corner][1]].ant.type === QUEEN && view[CCW[corner][3]].ant.type === GATHERER)	
		return sanitize(saboteur(), FREE_ORDER);
	
	//In recovery, do the moving step
	if ([DOWN_STALLED].includes(view[CCW[corner][1]].color))
		if ([DOWN_STALLED, UP_READY, DOWN_GATHERER].includes(view[CCW[corner][3]].color))
			if ([DOWN_STALLED, UP_READY].includes(view[4].color))
			{
				return {cell:4, color:DOWN_STALLED};
			}

	//Special case: when the queen is visible at CCW[corner][1], we may need to do signal transmission
	if (view[CCW[corner][1]].ant.type === QUEEN)
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null)
			return provisional;
		if (view[CCW[corner][3]].color === UP_REALIGN && view[CCW[corner][1]].color === DOWN_GATHERER)
			if (view[4].color === DOWN_GATHERER)
				return {cell:4, color:DOWN_GATHERER};
	}
	
	return {cell:CCW[corner][2]}; 
}

function mdecide_two_edge_straight(corner)
{
	//Propogate UP_REALIGN
	//(Remember, we don't know if it's CCW[corner][1] or CCW[corner][5] that's upstream)
	return {cell:4, color:UP_REALIGN};
}

function mdecide_edge_corner_left(corner)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[corner][1]].ant.type === GATHERER && view[corner].ant.type === QUEEN)	
		return sanitize(saboteur(), FREE_ORDER);
	if (view[CCW[corner][1]].ant.type === QUEEN && view[corner].ant.type === GATHERER)	
		return sanitize(saboteur(), FREE_ORDER);

	//Special logic for arranging corners correctly
	if (is_other(CCW[corner][1]) && view[corner].ant.type === QUEEN)
		return {cell:CCW[corner][3]};

	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][1]].color];

	var provisional = linewatch(CCW[corner][4]);
	if (provisional !== null) 
	{
		if (provisional.color === UP_REALIGN)
			return {cell:4, color:UP_REALIGN_END};
		return provisional;
	}

	if (down_sig === UP_REALIGN && [DOWN_MARCH, UP_REALIGN_END].includes(view[4].color))
	{
		return {cell:4, color:UP_REALIGN_END};
	}
	if ([DOWN_STALLED].includes(down_sig) && [DOWN_MARCH, DOWN_STALLED, UP_REALIGN_END].includes(view[4].color))
	{
		return {cell:4, color:DOWN_STALLED};
	}
	if ([UP_READY].includes(down_sig) && [DOWN_STALLED].includes(view[4].color))
	{
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
		return {cell:4, color:DOWN_MARCH};
	}
	if (down_sig === DOWN_GATHERER && view[4].color === DOWN_GATHERER)
	{
		return {cell:4, color:DOWN_STALLED};
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

	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][7]].color];
	
	var provisional = linewatch(CCW[corner][4]);
	if (provisional !== null) 
	{
		if (provisional.color === UP_REALIGN)
			return {cell:4, color:UP_REALIGN_END};
		return provisional;
	}
	if ([DOWN_FOOD, DOWN_GATHERER].includes(down_sig) && [UP_REALIGN_END, DOWN_STALLED].includes(view[4].color))
	{
		return {cell:4, color:DOWN_STALLED};
	}
	if ([UP_READY].includes(down_sig) && [DOWN_STALLED].includes(view[4].color))
	{
		if (view[4].color === DOWN_MARCH && view[CCW[corner][1]].color !== DOWN_MARCH)
			return {cell:CCW[corner][1], color:DOWN_MARCH};
		if (view[4].color === DOWN_MARCH && view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
		return {cell:4, color:DOWN_MARCH};
	}
	if (down_sig === DOWN_STALLED && view[4].color === DOWN_STALLED)
	{
		if (view[CCW[corner][1]].color !== DOWN_MARCH)
			return {cell:CCW[corner][1], color:DOWN_MARCH};
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
	}
	if (down_sig === UP_REALIGN && view[4].color === UP_REALIGN_END)
		return {cell:CCW[corner][6]};

	//If none of the signals fit, go the color

	//If on DOWN_MARCH, clear out potentially confusing signals
	if (down_sig === DOWN_MARCH && view[4].color === DOWN_MARCH)
	{
		if (view[CCW[corner][1]].color !== DOWN_MARCH)
			return {cell:CCW[corner][1], color:DOWN_MARCH};
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
	}

	return {cell:4, color:down_sig};
	//return {cell:4};
	
}

function mdecide_three_march(corner)
{
	var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][1]].color];
	var up_sig = view[CCW[corner][3]].color;
	//If we need to stay still, there will be UP_REALIGN_END near the top
	
	var provisional = linewatch2(corner);
	if (provisional !== null)
		return provisional;

	if (up_sig === UP_REALIGN_END && down_sig === DOWN_GATHERER && [DOWN_GATHERER, DOWN_STALLED].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN_END && [DOWN_STALLED].includes(down_sig) && [DOWN_MARCH, DOWN_STALLED].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN && down_sig === UP_REALIGN && view[4].color === UP_REALIGN)
		if (view[corner].color === UP_REALIGN_END)
		{
			if (view[CCW[corner][7]].color === DOWN_MARCH)	
				return {cell:4, color:UP_REALIGN};
			return {cell:CCW[corner][2]};
		}

	if (up_sig === UP_REALIGN && down_sig === DOWN_STALLED && [UP_REALIGN].includes(view[4].color))
		return {cell:4, color:UP_REALIGN};

	if (up_sig === UP_REALIGN && down_sig === DOWN_STALLED && [DOWN_MARCH, DOWN_STALLED].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN && down_sig === DOWN_GATHERER && [DOWN_GATHERER, DOWN_STALLED].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN && down_sig === UP_READY && view[4].color === DOWN_STALLED)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_MARCH && down_sig === UP_REALIGN && view[4].color === DOWN_MARCH)
		if (view[corner].color === UP_REALIGN_END)
			return {cell:4, color:UP_REALIGN};

	if (up_sig === DOWN_MARCH && [UP_READY].includes(down_sig) && view[4].color === UP_READY)
		return {cell:4, color:DOWN_MARCH};
	
	if (up_sig === DOWN_STALLED && down_sig === UP_READY && view[4].color === DOWN_STALLED)
		return {cell:4, color:UP_READY};

	if (up_sig === DOWN_STALLED && down_sig === DOWN_STALLED && [DOWN_STALLED, DOWN_MARCH].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_STALLED && down_sig === DOWN_GATHERER && view[4].color === DOWN_GATHERER)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_STALLED && down_sig === UP_REALIGN && [DOWN_STALLED, DOWN_MARCH].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_GATHERER && down_sig === DOWN_STALLED && view[4].color === DOWN_GATHERER)
		if (view[CCW[corner][3]].ant.type === QUEEN)
			return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_FOOD && down_sig === DOWN_FOOD && view[4].color === DOWN_FOOD)
		return {cell:4, color:DOWN_FOOD};

	if ([DOWN_FOOD, DOWN_GATHERER].includes(up_sig) && down_sig === DOWN_GATHERER && view[4].color === DOWN_GATHERER)
		return {cell:4, color:DOWN_GATHERER};

	//If none matches our current situation, return
	return {cell:CCW[corner][2]};
	
}

function mdecide_three_stand(corner)
{
	var provisional = linewatch2(corner);
	if (provisional !== null) 
	{
		return provisional;
	}
	
	var up_sig = view[CCW[corner][3]].color
	var down_sig = PAIRSIDES[view[corner].color][view[CCW[corner][7]].color];

	if (up_sig === UP_REALIGN && [DOWN_MARCH, DOWN_STALLED].includes(down_sig) && view[4].color === DOWN_MARCH)
		return {cell:4, color:UP_REALIGN};

	if (up_sig === UP_REALIGN && [DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED, UP_REALIGN, UP_READY].includes(down_sig))
		if (view[4].color === UP_REALIGN)
			return {cell:4, color:UP_REALIGN};

	if (up_sig === DOWN_MARCH && down_sig === UP_REALIGN && view[4].color === DOWN_MARCH)
		return {cell:4, color:UP_REALIGN};

	//If stalled, proactively clear out potentially confusing signals
	if ([DOWN_STALLED].includes(up_sig) && [DOWN_STALLED].includes(down_sig) && view[4].color === DOWN_STALLED)
	{
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
		if (view[CCW[corner][4]].color !== DOWN_MARCH)
			return {cell:CCW[corner][4], color:DOWN_MARCH};
		if (view[CCW[corner][5]].color !== DOWN_MARCH)
			return {cell:CCW[corner][5], color:DOWN_MARCH};
		if (view[CCW[corner][6]].color !== DOWN_MARCH)
			return {cell:CCW[corner][6], color:DOWN_MARCH};
		if (view[CCW[corner][7]].color !== DOWN_MARCH)
			return {cell:CCW[corner][7], color:DOWN_MARCH};
	}

	if (view[4].color === DOWN_MARCH)
	{
		if (view[CCW[corner][1]].color !== DOWN_MARCH)
			return {cell:CCW[corner][1], color:DOWN_MARCH};
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
	}
	
	
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
		var down_sig = PAIRUPS[view[corner].color][view[CCW[corner][7]].color];
	
		return {cell:4, color:down_sig};
		//return {cell:4};
	}
	else
	{
		var provisional = linewatch(CCW[corner][4]);
		if (provisional !== null) return provisional;

		var up_sig = view[CCW[corner][5]].color;
		var down_sig = PAIRDOWNS[view[corner].color][view[CCW[corner][7]].color];
		if (down_sig === DOWN_FOOD && view[4].color === DOWN_MARCH)
			return {cell:4, color:UP_REALIGN};

		if (up_sig === UP_REALIGN_END && [DOWN_FOOD, DOWN_GATHERER].includes(down_sig) && view[4].color === UP_REALIGN)
			return {cell:4, color:DOWN_STALLED};
		if (up_sig === UP_REALIGN_END && down_sig === DOWN_STALLED && view[4].color === UP_REALIGN_END)
			return {cell:4, color:DOWN_STALLED};
		if (up_sig === DOWN_STALLED && [UP_READY].includes(down_sig) && view[4].color === DOWN_STALLED)
			return {cell:4, color:UP_READY};
		if (up_sig === DOWN_STALLED && down_sig === DOWN_GATHERER && view[4].color === DOWN_GATHERER)
			return {cell:4, color:DOWN_STALLED};
		if (up_sig === DOWN_MARCH && [UP_READY].includes(down_sig) && view[4].color === UP_READY)
			return {cell:4, color:DOWN_MARCH};

		//If stalled, proactively clear out potentially confusing signals
		if ([DOWN_STALLED].includes(up_sig) && [DOWN_STALLED].includes(down_sig) && view[4].color === DOWN_STALLED)
		{
			if (view[CCW[corner][1]].color !== DOWN_MARCH)
				return {cell:CCW[corner][1], color:DOWN_MARCH};
			if (view[CCW[corner][2]].color !== DOWN_MARCH)
				return {cell:CCW[corner][2], color:DOWN_MARCH};
			if (view[CCW[corner][3]].color !== DOWN_MARCH)
				return {cell:CCW[corner][3], color:DOWN_MARCH};
			if (view[CCW[corner][4]].color !== DOWN_MARCH)
				return {cell:CCW[corner][4], color:DOWN_MARCH};
			if (view[CCW[corner][6]].color !== DOWN_MARCH)
				return {cell:CCW[corner][6], color:DOWN_MARCH};
		}
		return {cell:4};
	}
}

function mdecide_three_recover(corner)
{
	//This should only happen in the middle of recovery
	return {cell:4, color:UP_REALIGN_END};
}

function mdecide_three_marcher_hang(corner)
{
	return {cell:4};
}

function mdecide_four_z(corner)
{
	//Under certain conditions, this can appear during recovery
	//But this is usually a normal-march thing, so check both sides for indicators
	var provisional = linewatch2(CCW[corner][4]);
	if (provisional !== null) return provisional;

	var up_sig = PAIRSIDES[view[corner].color][view[CCW[corner][7]].color];
	var down_sig = PAIRSIDES[view[CCW[corner][4]].color][view[CCW[corner][3]].color];
	if (up_sig === UP_REALIGN && down_sig === DOWN_STALLED)
		return {cell:4, color:UP_REALIGN};
	if (up_sig === DOWN_STALLED && down_sig === UP_REALIGN)
		return {cell:4, color:UP_REALIGN};

	//If we're already on DOWN_MARCH, clear out potentially confusing colors
	if (view[CCW[corner][1]].color !== DOWN_MARCH)
		return {cell:CCW[corner][1], color:DOWN_MARCH};
	if (view[CCW[corner][2]].color !== DOWN_MARCH)
		return {cell:CCW[corner][2], color:DOWN_MARCH};
	if (view[CCW[corner][5]].color !== DOWN_MARCH)
		return {cell:CCW[corner][5], color:DOWN_MARCH};
	if (view[CCW[corner][6]].color !== DOWN_MARCH)
		return {cell:CCW[corner][6], color:DOWN_MARCH};
	return {cell:4, color:DOWN_MARCH};
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

	var up_sig = PAIRSIDES[view[corner].color][view[CCW[corner][1]].color];
	var down_sig = PAIRSIDES[view[CCW[corner][4]].color][view[CCW[corner][3]].color];


	if (up_sig === DOWN_MARCH && down_sig === UP_READY && view[4].color === UP_READY)
		return {cell:4, color:DOWN_MARCH};

	if (up_sig === DOWN_MARCH && down_sig === DOWN_FOOD && view[4].color === DOWN_MARCH)
		return {cell:4, color:DOWN_FOOD};

	if (up_sig === DOWN_MARCH && [DOWN_GATHERER, DOWN_STALLED].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_FOOD && down_sig === DOWN_MARCH && view[4].color === DOWN_MARCH)
		return {cell:4, color:DOWN_FOOD};

	if (up_sig === DOWN_FOOD && [UP_REALIGN, DOWN_STALLED].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_FOOD && down_sig === UP_READY && view[4].color === DOWN_STALLED)
	{	
		if (view[CCW[corner][5]].color !== DOWN_MARCH)
			return {cell:CCW[corner][5], color:DOWN_MARCH};
		if (view[CCW[corner][6]].color !== DOWN_MARCH)
			return {cell:CCW[corner][6], color:DOWN_MARCH};
		if (view[CCW[corner][7]].color !== DOWN_MARCH)
			return {cell:CCW[corner][7], color:DOWN_MARCH};
	}

	//If stalled, proactively clear out potentially confusing signals
	if (up_sig === DOWN_STALLED && down_sig === DOWN_STALLED && view[4].color === DOWN_STALLED)
	{
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
		if (view[CCW[corner][5]].color !== DOWN_MARCH)
			return {cell:CCW[corner][5], color:DOWN_MARCH};
		if (view[CCW[corner][6]].color !== DOWN_MARCH)
			return {cell:CCW[corner][6], color:DOWN_MARCH};
		if (view[CCW[corner][7]].color !== DOWN_MARCH)
			return {cell:CCW[corner][7], color:DOWN_MARCH};
	}

	if (up_sig === DOWN_STALLED && down_sig === UP_READY && view[4].color === DOWN_STALLED)
	{	
		if (view[CCW[corner][5]].color !== DOWN_MARCH)
			return {cell:CCW[corner][5], color:DOWN_MARCH};
		if (view[CCW[corner][6]].color !== DOWN_MARCH)
			return {cell:CCW[corner][6], color:DOWN_MARCH};
		if (view[CCW[corner][7]].color !== DOWN_MARCH)
			return {cell:CCW[corner][7], color:DOWN_MARCH};
		return {cell:4, color:UP_READY};
	}

	//If stalled, proactively clear out potentially confusing signals
	if (up_sig === DOWN_STALLED && down_sig === DOWN_STALLED && view[4].color === DOWN_MARCH)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_STALLED && down_sig === UP_REALIGN && [UP_REALIGN, DOWN_MARCH].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_STALLED && down_sig === DOWN_GATHERER && [DOWN_STALLED, DOWN_GATHERER].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_STALLED && [DOWN_FOOD, DOWN_MARCH].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_GATHERER && down_sig === UP_READY && view[4].color === DOWN_STALLED)
	{	
		if (view[CCW[corner][5]].color !== DOWN_MARCH)
			return {cell:CCW[corner][5], color:DOWN_MARCH};
		if (view[CCW[corner][6]].color !== DOWN_MARCH)
			return {cell:CCW[corner][6], color:DOWN_MARCH};
		if (view[CCW[corner][7]].color !== DOWN_MARCH)
			return {cell:CCW[corner][7], color:DOWN_MARCH};
	}

	if (up_sig === DOWN_GATHERER && [DOWN_MARCH, UP_REALIGN].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === DOWN_GATHERER && down_sig === DOWN_STALLED && [DOWN_STALLED, DOWN_GATHERER].includes(view[4].color))
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN && [DOWN_FOOD, DOWN_GATHERER, DOWN_STALLED, UP_READY].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_REALIGN && [DOWN_STALLED, UP_REALIGN].includes(down_sig) && view[4].color === DOWN_MARCH)
		return {cell:4, color:DOWN_STALLED};

	if (up_sig === UP_READY && down_sig === DOWN_STALLED && view[4].color === DOWN_STALLED)
		return {cell:4, color:UP_READY};

	if (up_sig === UP_READY && [DOWN_FOOD, DOWN_GATHERER].includes(down_sig) && view[4].color === DOWN_STALLED)
		if (view[CCW[corner][2]].color !== DOWN_MARCH)
			return {cell:CCW[corner][2], color:DOWN_MARCH};
	
	if (up_sig === UP_READY && down_sig === DOWN_MARCH && view[4].color === UP_READY)
		return {cell:4, color:DOWN_MARCH};

	if ([UP_READY].includes(up_sig) && [UP_REALIGN].includes(down_sig) && view[4].color === UP_REALIGN)
		return {cell:4, color:DOWN_STALLED};


	return {cell:4};
	
}

//Don't step on food or enemies. Instead, signal. 
function marcher_step_watch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color") && candidate.color === 0) return {cell:4};
	if (view[candidate.cell].food !== 0) return {cell:4, color:DOWN_FOOD};
	if (is_harvestable(candidate.cell)) return {cell:4, color:DOWN_FOOD};
	if (view[candidate.cell].ant !== null) return {cell:4, color:UP_PANIC};
	return candidate;
}

function marcher_decision()
{
	var gatherer_count = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === GATHERER)
				gatherer_count++;
		}
	}
	if (gatherer_count > 1)
	{
		return sanitize(saboteur(), FREE_ORDER);
	}
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










